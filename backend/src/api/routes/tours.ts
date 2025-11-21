import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { TourController } from '../controllers/TourController';
import { auth } from '../../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const tourController = new TourController();

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

// Rate limiting for tour operations
const tourLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many tour requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Advanced rate limiting for search operations
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  message: 'Too many search requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const createTourValidation = [
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim()
    .escape(),
  body('description')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters')
    .trim(),
  body('shortDescription')
    .isLength({ max: 500 })
    .withMessage('Short description must not exceed 500 characters')
    .trim(),
  body('tourType')
    .isIn(['ADVENTURE', 'CULTURAL', 'LEISURE', 'BUSINESS', 'WILDLIFE', 'BEACH', 'MOUNTAIN', 'CITY', 'HISTORICAL', 'FOOD', 'WELLNESS'])
    .withMessage('Invalid tour type'),
  body('duration')
    .isObject()
    .withMessage('Duration must be an object'),
  body('duration.days')
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration days must be between 1 and 365'),
  body('duration.nights')
    .isInt({ min: 0, max: 364 })
    .withMessage('Duration nights must be between 0 and 364'),
  body('difficultyLevel')
    .isIn(['EASY', 'MODERATE', 'CHALLENGING', 'EXPERT'])
    .withMessage('Invalid difficulty level'),
  body('groupSize.min')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Minimum group size must be between 1 and 1000'),
  body('groupSize.max')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum group size must be between 1 and 1000'),
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'])
    .withMessage('Invalid currency'),
  body('inclusions')
    .isArray({ max: 50 })
    .withMessage('Inclusions must be an array with maximum 50 items'),
  body('exclusions')
    .isArray({ max: 50 })
    .withMessage('Exclusions must be an array with maximum 50 items'),
  body('itinerary')
    .isArray({ max: 30 })
    .withMessage('Itinerary must be an array with maximum 30 items'),
  body('meetingPoint.address')
    .isLength({ min: 10, max: 500 })
    .withMessage('Meeting point address must be between 10 and 500 characters'),
  body('meetingPoint.coordinates')
    .optional()
    .isObject()
    .withMessage('Meeting point coordinates must be an object'),
  body('requirements')
    .isArray({ max: 20 })
    .withMessage('Requirements must be an array with maximum 20 items'),
  body('equipment')
    .isArray({ max: 20 })
    .withMessage('Equipment must be an array with maximum 20 items'),
  body('policies')
    .isObject()
    .withMessage('Policies must be an object'),
  body('policies.cancellation')
    .isObject()
    .withMessage('Cancellation policy must be an object'),
  body('policies.booking')
    .isObject()
    .withMessage('Booking policy must be an object'),
];

const updateTourValidation = [
  param('id').isUUID().withMessage('Invalid tour ID'),
  ...createTourValidation
];

const searchTourValidation = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
    .trim()
    .escape(),
  query('tourType')
    .optional()
    .isIn(['ADVENTURE', 'CULTURAL', 'LEISURE', 'BUSINESS', 'WILDLIFE', 'BEACH', 'MOUNTAIN', 'CITY', 'HISTORICAL', 'FOOD', 'WELLNESS'])
    .withMessage('Invalid tour type'),
  query('difficultyLevel')
    .optional()
    .isIn(['EASY', 'MODERATE', 'CHALLENGING', 'EXPERT'])
    .withMessage('Invalid difficulty level'),
  query('duration.days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration days must be between 1 and 365'),
  query('price.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('price.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('groupSize.max')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum group size must be between 1 and 1000'),
  query('location.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters')
    .trim()
    .escape(),
  query('location.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters')
    .trim()
    .escape(),
  query('location.region')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Region must not exceed 100 characters')
    .trim()
    .escape(),
  query('sortBy')
    .optional()
    .isIn(['price', 'duration', 'rating', 'reviews', 'createdAt', 'popularity'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('language')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Language code must not exceed 10 characters'),
  query('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'])
    .withMessage('Invalid currency'),
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

// GET /api/v1/tours - Search and list tours
router.get('/', 
  searchLimiter,
  searchTourValidation,
  validateRequest,
  tourController.searchTours.bind(tourController)
);

// GET /api/v1/tours/meta - Get search metadata
router.get('/meta',
  searchLimiter,
  query('language').optional().isLength({ max: 10 }),
  query('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY']),
  validateRequest,
  tourController.getSearchMetadata.bind(tourController)
);

// GET /api/v1/tours/featured - Get featured tours
router.get('/featured',
  searchLimiter,
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('language').optional().isLength({ max: 10 }),
  validateRequest,
  tourController.getFeaturedTours.bind(tourController)
);

// GET /api/v1/tours/popular - Get popular tours
router.get('/popular',
  searchLimiter,
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('timeframe').optional().isIn(['week', 'month', 'year']),
  query('language').optional().isLength({ max: 10 }),
  validateRequest,
  tourController.getPopularTours.bind(tourController)
);

// GET /api/v1/tours/:id - Get tour by ID
router.get('/:id',
  param('id').notEmpty().withMessage('Tour ID is required'),
  validateRequest,
  tourController.getTourById.bind(tourController)
);

// GET /api/v1/tours/:id/availability - Get tour availability
router.get('/:id/availability',
  param('id').isUUID().withMessage('Invalid tour ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('groupSize').optional().isInt({ min: 1, max: 1000 }),
  validateRequest,
  tourController.getTourAvailability.bind(tourController)
);

// POST /api/v1/tours - Create new tour
router.post('/',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  createTourValidation,
  validateRequest,
  tourController.createTour.bind(tourController)
);

// PUT /api/v1/tours/:id - Update tour
router.put('/:id',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  updateTourValidation,
  validateRequest,
  tourController.updateTour.bind(tourController)
);

// DELETE /api/v1/tours/:id - Delete tour
router.delete('/:id',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  validateRequest,
  tourController.deleteTour.bind(tourController)
);

// POST /api/v1/tours/:id/images - Upload tour images
router.post('/:id/images',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  tourController.uploadImages.bind(tourController)
);

// DELETE /api/v1/tours/:id/images/:imageId - Delete tour image
router.delete('/:id/images/:imageId',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  param('imageId').isUUID().withMessage('Invalid image ID'),
  validateRequest,
  tourController.deleteImage.bind(tourController)
);

// PUT /api/v1/tours/:id/images/reorder - Reorder tour images
router.put('/:id/images/reorder',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  body('imageIds')
    .isArray({ min: 1, max: 20 })
    .withMessage('Image IDs must be an array with 1-20 items'),
  body('imageIds.*')
    .isUUID()
    .withMessage('Each image ID must be a valid UUID'),
  validateRequest,
  tourController.reorderImages.bind(tourController)
);

// POST /api/v1/tours/:id/clone - Clone tour
router.post('/:id/clone',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  validateRequest,
  tourController.cloneTour.bind(tourController)
);

// PUT /api/v1/tours/:id/status - Update tour status
router.put('/:id/status',
  tourLimiter,
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  body('status')
    .isIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'])
    .withMessage('Invalid tour status'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  validateRequest,
  tourController.updateTourStatus.bind(tourController)
);

// GET /api/v1/tours/:id/analytics - Get tour analytics
router.get('/:id/analytics',
  auth,
  requireRole(['ADMIN', 'DMC_ADMIN', 'TOUR_OPERATOR']),
  param('id').isUUID().withMessage('Invalid tour ID'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('metrics').optional().isIn(['views', 'bookings', 'revenue', 'reviews']),
  validateRequest,
  tourController.getTourAnalytics.bind(tourController)
);

// POST /api/v1/tours/:id/reviews - Add tour review
router.post('/:id/reviews',
  auth,
  param('id').isUUID().withMessage('Invalid tour ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters')
    .trim(),
  body('highlights')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Highlights must be an array with maximum 10 items'),
  body('improvements')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Improvements must be an array with maximum 10 items'),
  validateRequest,
  tourController.addReview.bind(tourController)
);

// Error handling middleware
router.use((error: any, req: Request, res: Response, next: Function) => {
  console.error('Tour routes error:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large'
      }
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds limit'
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

export { router as toursRouter };