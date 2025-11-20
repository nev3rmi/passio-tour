// Tour Management System - Inventory Controller
// Date: 2025-11-20 | Feature: Tour Management System MVP

import { Request, Response } from 'express';
import InventoryService from '../../services/InventoryService';
import { DatabaseManager } from '../../database/DatabaseManager';
import { 
  CreateInventorySlot,
  UpdateInventorySlot,
  BulkInventoryUpdate,
  CheckAvailabilityRequest,
  CheckAvailabilityRangeRequest,
  InventorySearchParams
} from '../../../shared/types/inventory';
import { ApiResponseBuilder } from '../../middleware/apiResponse';
import { logger } from '../../utils/enhancedLogger';

// Initialize services
const db = new DatabaseManager();
const inventoryService = new InventoryService(db);

export class InventoryController {
  private readonly controllerName = 'InventoryController';

  /**
   * Create inventory slot
   * POST /api/v1/inventory
   */
  async createInventorySlot(req: Request, res: Response): Promise<void> {
    const method = 'createInventorySlot';
    const correlationId = `inv_create_${Date.now()}`;
    
    try {
      logger.info('Creating inventory slot request received', {
        service: this.controllerName,
        method,
        correlationId,
        body: req.body,
        headers: req.headers
      });

      // Extract inventory data from request body
      const slotData: CreateInventorySlot = req.body;
      
      // Validate request has required data
      if (!slotData || typeof slotData !== 'object') {
        const response = ApiResponseBuilder.badRequest('Invalid request body');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get user ID from authentication middleware
      const userId = (req as any).user?.user_id;
      if (!userId) {
        const response = ApiResponseBuilder.unauthorized('Authentication required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Create the inventory slot
      const result = await inventoryService.createInventorySlot(slotData, userId);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, result.message || 'Inventory slot created successfully');
      res.status(201).json(response.body);

      logger.info('Inventory slot created successfully', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: result.data.inventory_id,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to create inventory slot', {
        service: this.controllerName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Handle different error types
      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to create inventory slot');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Update inventory slot
   * PUT /api/v1/inventory/:inventoryId
   */
  async updateInventorySlot(req: Request, res: Response): Promise<void> {
    const method = 'updateInventorySlot';
    const correlationId = `inv_update_${req.params.inventoryId}`;
    
    try {
      logger.info('Updating inventory slot request received', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: req.params.inventoryId,
        body: req.body,
        headers: req.headers
      });

      const { inventoryId } = req.params;

      // Validate inventory ID
      if (!inventoryId || typeof inventoryId !== 'string' || inventoryId.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid inventory ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Extract update data from request body
      const updateData: UpdateInventorySlot = req.body;

      // Validate request has data
      if (!updateData || typeof updateData !== 'object') {
        const response = ApiResponseBuilder.badRequest('Invalid request body');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Check if at least one field is being updated
      const updateFields = Object.keys(updateData);
      if (updateFields.length === 0) {
        const response = ApiResponseBuilder.badRequest('No fields to update');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get user ID from authentication middleware
      const userId = (req as any).user?.user_id;
      if (!userId) {
        const response = ApiResponseBuilder.unauthorized('Authentication required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Update the inventory slot
      const result = await inventoryService.updateInventorySlot(inventoryId, updateData, userId);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, result.message || 'Inventory slot updated successfully');
      res.status(200).json(response.body);

      logger.info('Inventory slot updated successfully', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId,
        updatedFields: updateFields,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to update inventory slot', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: req.params.inventoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to update inventory slot');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Bulk update inventory slots
   * POST /api/v1/inventory/bulk
   */
  async bulkUpdateInventory(req: Request, res: Response): Promise<void> {
    const method = 'bulkUpdateInventory';
    const correlationId = `inv_bulk_${Date.now()}`;
    
    try {
      logger.info('Bulk updating inventory request received', {
        service: this.controllerName,
        method,
        correlationId,
        body: req.body,
        headers: req.headers
      });

      // Extract bulk data from request body
      const bulkData: BulkInventoryUpdate = req.body;

      // Validate request has required data
      if (!bulkData || typeof bulkData !== 'object' || !bulkData.tour_id || !bulkData.updates) {
        const response = ApiResponseBuilder.badRequest('Invalid request body');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get user ID from authentication middleware
      const userId = (req as any).user?.user_id;
      if (!userId) {
        const response = ApiResponseBuilder.unauthorized('Authentication required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Bulk update inventory
      const result = await inventoryService.bulkUpdateInventory(bulkData, userId);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, result.message || 'Bulk inventory update completed');
      res.status(200).json(response.body);

      logger.info('Bulk inventory update completed', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: bulkData.tour_id,
        updateCount: bulkData.updates.length,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to bulk update inventory', {
        service: this.controllerName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to bulk update inventory');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Check availability for specific date
   * GET /api/v1/inventory/availability
   */
  async checkAvailability(req: Request, res: Response): Promise<void> {
    const method = 'checkAvailability';
    const correlationId = `inv_check_${Date.now()}`;
    
    try {
      logger.info('Checking availability request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query,
        headers: req.headers
      });

      // Extract availability parameters from query string
      const availabilityRequest: CheckAvailabilityRequest = {
        tour_id: req.query.tour_id as string,
        date: req.query.date as string,
        participants: req.query.participants ? parseInt(req.query.participants as string) : 1
      };

      // Validate required parameters
      if (!availabilityRequest.tour_id || !availabilityRequest.date) {
        const response = ApiResponseBuilder.badRequest('Tour ID and date are required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Validate participants
      if (availabilityRequest.participants < 1 || availabilityRequest.participants > 1000) {
        const response = ApiResponseBuilder.badRequest('Participants must be between 1 and 1000');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Check availability
      const result = await inventoryService.checkAvailability(availabilityRequest);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, 'Availability check completed');
      res.status(200).json(response.body);

      logger.info('Availability check completed', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: availabilityRequest.tour_id,
        date: availabilityRequest.date,
        available: result.data.available,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to check availability', {
        service: this.controllerName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to check availability');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Check availability for date range
   * GET /api/v1/inventory/availability-range
   */
  async checkAvailabilityRange(req: Request, res: Response): Promise<void> {
    const method = 'checkAvailabilityRange';
    const correlationId = `inv_range_${Date.now()}`;
    
    try {
      logger.info('Checking availability range request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query,
        headers: req.headers
      });

      // Extract availability parameters from query string
      const availabilityRequest: CheckAvailabilityRangeRequest = {
        tour_id: req.query.tour_id as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        participants: req.query.participants ? parseInt(req.query.participants as string) : 1
      };

      // Validate required parameters
      if (!availabilityRequest.tour_id || !availabilityRequest.start_date || !availabilityRequest.end_date) {
        const response = ApiResponseBuilder.badRequest('Tour ID, start date, and end date are required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Validate participants
      if (availabilityRequest.participants < 1 || availabilityRequest.participants > 1000) {
        const response = ApiResponseBuilder.badRequest('Participants must be between 1 and 1000');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Check availability range
      const result = await inventoryService.checkAvailabilityRange(availabilityRequest);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, 'Availability range check completed');
      res.status(200).json(response.body);

      logger.info('Availability range check completed', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: availabilityRequest.tour_id,
        startDate: availabilityRequest.start_date,
        endDate: availabilityRequest.end_date,
        availableDates: result.data.summary.available_dates,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to check availability range', {
        service: this.controllerName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to check availability range');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Search inventory with filters
   * GET /api/v1/inventory
   */
  async searchInventory(req: Request, res: Response): Promise<void> {
    const method = 'searchInventory';
    const correlationId = `inv_search_${Date.now()}`;
    
    try {
      logger.info('Searching inventory request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query,
        headers: req.headers
      });

      // Extract search parameters from query string
      const searchParams: InventorySearchParams = {
        tour_id: req.query.tour_id as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        is_available: req.query.is_available ? req.query.is_available === 'true' : undefined,
        has_capacity: req.query.has_capacity ? req.query.has_capacity === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as 'asc' | 'desc'
      };

      // Parse price range if provided
      if (req.query.min_price || req.query.max_price) {
        searchParams.price_range = {
          min: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
          max: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined
        };
      }

      // Validate numeric parameters
      if (searchParams.page && searchParams.page < 1) {
        const response = ApiResponseBuilder.badRequest('Page must be greater than 0');
        res.status(response.statusCode).json(response.body);
        return;
      }

      if (searchParams.limit && (searchParams.limit < 1 || searchParams.limit > 100)) {
        const response = ApiResponseBuilder.badRequest('Limit must be between 1 and 100');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Search inventory
      const result = await inventoryService.searchInventory(searchParams);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, 'Inventory search completed');
      res.status(200).json(response.body);

      logger.info('Inventory search completed', {
        service: this.controllerName,
        method,
        correlationId,
        resultCount: result.data.inventory.length,
        totalCount: result.data.pagination.total,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to search inventory', {
        service: this.controllerName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to search inventory');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get inventory statistics
   * GET /api/v1/inventory/stats/:tourId
   */
  async getInventoryStats(req: Request, res: Response): Promise<void> {
    const method = 'getInventoryStats';
    const correlationId = `inv_stats_${req.params.tourId}`;
    
    try {
      logger.info('Getting inventory statistics request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tourId,
        query: req.query,
        headers: req.headers
      });

      const { tourId } = req.params;

      // Validate tour ID
      if (!tourId || typeof tourId !== 'string' || tourId.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid tour ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Extract date range from query parameters
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      if (!startDate || !endDate) {
        const response = ApiResponseBuilder.badRequest('Start date and end date are required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get inventory statistics
      const result = await inventoryService.getInventoryStats(tourId, startDate, endDate);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Inventory statistics retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Inventory statistics retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId,
        avgUtilization: result.average_utilization,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get inventory statistics', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tourId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to get inventory statistics');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get inventory slot by ID
   * GET /api/v1/inventory/:inventoryId
   */
  async getInventorySlot(req: Request, res: Response): Promise<void> {
    const method = 'getInventorySlot';
    const correlationId = `inv_get_${req.params.inventoryId}`;
    
    try {
      logger.info('Getting inventory slot request received', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: req.params.inventoryId,
        headers: req.headers
      });

      const { inventoryId } = req.params;

      // Validate inventory ID
      if (!inventoryId || typeof inventoryId !== 'string' || inventoryId.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid inventory ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Search for the specific inventory slot
      const searchParams: InventorySearchParams = {
        page: 1,
        limit: 1
      };

      const result = await inventoryService.searchInventory(searchParams);
      
      // Find the specific inventory slot in the results
      const inventorySlot = result.data.inventory.find(slot => slot.inventory_id === inventoryId);

      if (!inventorySlot) {
        const response = ApiResponseBuilder.notFound('Inventory slot not found');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Return success response
      const response = ApiResponseBuilder.success(inventorySlot, 'Inventory slot retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Inventory slot retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get inventory slot', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: req.params.inventoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to get inventory slot');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Delete inventory slot
   * DELETE /api/v1/inventory/:inventoryId
   */
  async deleteInventorySlot(req: Request, res: Response): Promise<void> {
    const method = 'deleteInventorySlot';
    const correlationId = `inv_delete_${req.params.inventoryId}`;
    
    try {
      logger.info('Deleting inventory slot request received', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: req.params.inventoryId,
        headers: req.headers
      });

      const { inventoryId } = req.params;

      // Validate inventory ID
      if (!inventoryId || typeof inventoryId !== 'string' || inventoryId.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid inventory ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get user ID from authentication middleware
      const userId = (req as any).user?.user_id;
      if (!userId) {
        const response = ApiResponseBuilder.unauthorized('Authentication required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Soft delete by updating status to BLOCKED
      const updateData: UpdateInventorySlot = {
        is_available: false,
        notes: 'Deleted via API'
      };

      const result = await inventoryService.updateInventorySlot(inventoryId, updateData, userId);

      // Return success response
      const response = ApiResponseBuilder.success(null, 'Inventory slot deleted successfully');
      res.status(200).json(response.body);

      logger.info('Inventory slot deleted successfully', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to delete inventory slot', {
        service: this.controllerName,
        method,
        correlationId,
        inventoryId: req.params.inventoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error.code) {
        const response = ApiResponseBuilder.error(
          error.code,
          error.message,
          error.details
        );
        res.status(error.statusCode || 500).json(response.body);
      } else {
        const response = ApiResponseBuilder.internalServerError('Failed to delete inventory slot');
        res.status(500).json(response.body);
      }
    }
  }
}

export default new InventoryController();