import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { InventoryController } from '../controllers/InventoryController';
import { auth } from '../../middleware/auth';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = Router();
const inventoryController = new InventoryController();

// Simple validation middleware
const validateRequest = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// Rate limiting for inventory operations
const inventoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many inventory requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for availability checks
const availabilityLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 availability requests per minute
  message: 'Too many availability requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const createInventoryValidation = [
  body('tour_id')
    .isUUID()
    .withMessage('Invalid tour ID'),
  body('date')
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
  body('available_count')
    .isInt({ min: 0, max: 10000 })
    .withMessage('Available count must be between 0 and 10000'),
  body('max_capacity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Maximum capacity must be between 1 and 10000'),
  body('base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('Is available must be a boolean'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim()
    .escape(),
];

const updateInventoryValidation = [
  param('inventoryId').isUUID().withMessage('Invalid inventory ID'),
  body('available_count')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Available count must be between 0 and 10000'),
  body('max_capacity')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Maximum capacity must be between 1 and 10000'),
  body('base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('Is available must be a boolean'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim()
    .escape(),
];

const bulkUpdateValidation = [
  body('tour_id')
    .isUUID()
    .withMessage('Invalid tour ID'),
  body('updates')
    .isArray({ min: 1, max: 365 })
    .withMessage('Updates must be an array with 1-365 items'),
  body('updates.*.date')
    .isISO8601()
    .withMessage('Each update must have a valid date in ISO 8601 format'),
  body('updates.*.available_count')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Available count must be between 0 and 10000'),
  body('updates.*.max_capacity')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Maximum capacity must be between 1 and 10000'),
  body('updates.*.base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('updates.*.is_available')
    .optional()
    .isBoolean()
    .withMessage('Is available must be a boolean'),
  body('updates.*.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim()
    .escape(),
];

const checkAvailabilityValidation = [
  query('tour_id')
    .isUUID()
    .withMessage('Invalid tour ID'),
  query('date')
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('participants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Participants must be between 1 and 1000'),
];

const checkAvailabilityRangeValidation = [
  query('tour_id')
    .isUUID()
    .withMessage('Invalid tour ID'),
  query('start_date')
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('end_date')
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const startDate = new Date(req.query.start_date as string);
      const endDate = new Date(value);
      if (endDate < startDate) {
        throw new Error('End date must be after or equal to start date');
      }
      // Check if date range is not too large (max 365 days)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        throw new Error('Date range cannot exceed 365 days');
      }
      return true;
    }),
  query('participants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Participants must be between 1 and 1000'),
];

const searchInventoryValidation = [
  query('tour_id')
    .optional()
    .isUUID()
    .withMessage('Invalid tour ID'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (req.query.start_date && value) {
        const startDate = new Date(req.query.start_date as string);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error('End date must be after or equal to start date');
        }
      }
      return true;
    }),
  query('is_available')
    .optional()
    .isBoolean()
    .withMessage('Is available must be a boolean'),
  query('has_capacity')
    .optional()
    .isBoolean()
    .withMessage('Has capacity must be a boolean'),
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((value, { req }) => {
      if (req.query.min_price && value) {
        const minPrice = parseFloat(req.query.min_price as string);
        const maxPrice = parseFloat(value);
        if (maxPrice < minPrice) {
          throw new Error('Maximum price must be greater than or equal to minimum price');
        }
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort_by')
    .optional()
    .isIn(['tour_date', 'total_capacity', 'booked_count', 'price'])
    .withMessage('Invalid sort field'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const getStatsValidation = [
  param('tourId').isUUID().withMessage('Invalid tour ID'),
  query('start_date')
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('end_date')
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const startDate = new Date(req.query.start_date as string);
      const endDate = new Date(value);
      if (endDate < startDate) {
        throw new Error('End date must be after or equal to start date');
      }
      return true;
    }),
];

// Middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};

// GET /api/v1/inventory - Search inventory with filters
router.get('/', 
  inventoryLimiter,
  searchInventoryValidation,
  validateRequest,
  inventoryController.searchInventory.bind(inventoryController)
);

// GET /api/v1/inventory/availability - Check availability for specific date
router.get('/availability',
  availabilityLimiter,
  checkAvailabilityValidation,
  validateRequest,
  inventoryController.checkAvailability.bind(inventoryController)
);

// GET /api/v1/inventory/availability-range - Check availability for date range
router.get('/availability-range',
  availabilityLimiter,
  checkAvailabilityRangeValidation,
  validateRequest,
  inventoryController.checkAvailabilityRange.bind(inventoryController)
);

// POST /api/v1/inventory - Create inventory slot
router.post('/',
  inventoryLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  createInventoryValidation,
  validateRequest,
  inventoryController.createInventorySlot.bind(inventoryController)
);

// POST /api/v1/inventory/bulk - Bulk update inventory slots
router.post('/bulk',
  inventoryLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  bulkUpdateValidation,
  validateRequest,
  inventoryController.bulkUpdateInventory.bind(inventoryController)
);

// GET /api/v1/inventory/:inventoryId - Get inventory slot by ID
router.get('/:inventoryId',
  param('inventoryId').isUUID().withMessage('Invalid inventory ID'),
  validateRequest,
  inventoryController.getInventorySlot.bind(inventoryController)
);

// PUT /api/v1/inventory/:inventoryId - Update inventory slot
router.put('/:inventoryId',
  inventoryLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  updateInventoryValidation,
  validateRequest,
  inventoryController.updateInventorySlot.bind(inventoryController)
);

// DELETE /api/v1/inventory/:inventoryId - Delete inventory slot
router.delete('/:inventoryId',
  inventoryLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  param('inventoryId').isUUID().withMessage('Invalid inventory ID'),
  validateRequest,
  inventoryController.deleteInventorySlot.bind(inventoryController)
);

// GET /api/v1/inventory/stats/:tourId - Get inventory statistics for a tour
router.get('/stats/:tourId',
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  getStatsValidation,
  validateRequest,
  inventoryController.getInventoryStats.bind(inventoryController)
);

// Error handling middleware
router.use((error: any, req: Request, res: Response, next: Function) => {
  console.error('Inventory routes error:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large'
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

export { router as inventoryRouter };