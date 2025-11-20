// Tour Management System - Tour Controller
// Date: 2025-11-19 | Feature: Tour Management System MVP

import { Request, Response } from 'express';
import { TourService } from '../../services/TourService';
import { ImageUploadService } from '../../services/ImageUploadService';
import { DatabaseManager } from '../../database/DatabaseManager';
import { 
  TourCreate, 
  TourUpdate, 
  TourSearchParams,
  CreateTourResponse,
  UpdateTourResponse,
  GetTourResponse,
  SearchToursResponse,
  DeleteTourResponse 
} from '../../../shared/types/tour';
import { TourImageCreate } from '../../../shared/types/tour-image';
import { ApiResponseBuilder } from '../../middleware/apiResponse';
import { logger } from '../../utils/enhancedLogger';

// Initialize services
const db = new DatabaseManager();
const tourService = new TourService(db);
const imageUploadService = new ImageUploadService(db);

export class TourController {
  private readonly controllerName = 'TourController';

  /**
   * Create a new tour
   * POST /api/v1/tours
   */
  async createTour(req: Request, res: Response): Promise<void> {
    const method = 'createTour';
    const correlationId = `tour_create_${Date.now()}`;
    
    try {
      logger.info('Creating tour request received', {
        service: this.controllerName,
        method,
        correlationId,
        body: req.body,
        headers: req.headers
      });

      // Extract tour data from request body
      const tourData: TourCreate = req.body;
      
      // Validate request has required data
      if (!tourData || typeof tourData !== 'object') {
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

      // Create the tour
      const result: CreateTourResponse = await tourService.createTour(tourData, userId);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, 'Tour created successfully');
      res.status(201).json(response.body);

      logger.info('Tour created successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: result.data.tour_id,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to create tour', {
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
        const response = ApiResponseBuilder.internalServerError('Failed to create tour');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Search tours with filters and pagination
   * GET /api/v1/tours
   */
  async searchTours(req: Request, res: Response): Promise<void> {
    const method = 'searchTours';
    const correlationId = `tour_search_${Date.now()}`;
    
    try {
      logger.info('Searching tours request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query,
        headers: req.headers
      });

      // Extract search parameters from query string
      const searchParams: TourSearchParams = {
        search: req.query.search as string,
        destination: req.query.destination as string,
        category: req.query.category as string,
        type: req.query.type as string,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        participants: req.query.participants ? parseInt(req.query.participants as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as 'asc' | 'desc'
      };

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

      // Search tours
      const result: SearchToursResponse = await tourService.searchTours(searchParams);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Tours retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Tours searched successfully', {
        service: this.controllerName,
        method,
        correlationId,
        resultCount: result.tours.length,
        totalCount: result.pagination.total,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to search tours', {
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
        const response = ApiResponseBuilder.internalServerError('Failed to search tours');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get tour by ID
   * GET /api/v1/tours/:tour_id
   */
  async getTour(req: Request, res: Response): Promise<void> {
    const method = 'getTour';
    const correlationId = `tour_get_${req.params.tour_id}`;
    
    try {
      logger.info('Getting tour request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        headers: req.headers
      });

      const { tour_id } = req.params;

      // Validate tour ID
      if (!tour_id || typeof tour_id !== 'string' || tour_id.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid tour ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get the tour
      const result: TourDetail = await tourService.getTourById(tour_id);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Tour retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Tour retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: result.tour_id,
        hasImages: result.images.length > 0,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get tour', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
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
        const response = ApiResponseBuilder.internalServerError('Failed to get tour');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Update tour
   * PUT /api/v1/tours/:tour_id
   */
  async updateTour(req: Request, res: Response): Promise<void> {
    const method = 'updateTour';
    const correlationId = `tour_update_${req.params.tour_id}`;
    
    try {
      logger.info('Updating tour request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        body: req.body,
        headers: req.headers
      });

      const { tour_id } = req.params;

      // Validate tour ID
      if (!tour_id || typeof tour_id !== 'string' || tour_id.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid tour ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Extract update data from request body
      const updateData: TourUpdate = req.body;

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

      // Update the tour
      const result: UpdateTourResponse = await tourService.updateTour(tour_id, updateData, userId);

      // Return success response
      const response = ApiResponseBuilder.success(result.data, 'Tour updated successfully');
      res.status(200).json(response.body);

      logger.info('Tour updated successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: result.data.tour_id,
        updatedFields: updateFields,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to update tour', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
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
        const response = ApiResponseBuilder.internalServerError('Failed to update tour');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Delete tour (soft delete)
   * DELETE /api/v1/tours/:tour_id
   */
  async deleteTour(req: Request, res: Response): Promise<void> {
    const method = 'deleteTour';
    const correlationId = `tour_delete_${req.params.tour_id}`;
    
    try {
      logger.info('Deleting tour request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        headers: req.headers
      });

      const { tour_id } = req.params;

      // Validate tour ID
      if (!tour_id || typeof tour_id !== 'string' || tour_id.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid tour ID');
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

      // Delete the tour
      const result: DeleteTourResponse = await tourService.deleteTour(tour_id, userId);

      // Return success response
      const response = ApiResponseBuilder.success(null, result.message);
      res.status(200).json(response.body);

      logger.info('Tour deleted successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: tour_id,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to delete tour', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
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
        const response = ApiResponseBuilder.internalServerError('Failed to delete tour');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Upload tour images
   * POST /api/v1/tours/:tour_id/images
   */
  async uploadImages(req: Request, res: Response): Promise<void> {
    const method = 'uploadImages';
    const correlationId = `tour_images_${req.params.tour_id}`;
    
    try {
      logger.info('Uploading tour images request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        hasFiles: !!(req as any).files,
        fileCount: (req as any).files?.length || 0
      });

      const { tour_id } = req.params;

      // Validate tour ID
      if (!tour_id || typeof tour_id !== 'string' || tour_id.length === 0) {
        const response = ApiResponseBuilder.badRequest('Invalid tour ID');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Check if files were uploaded
      const files = (req as any).files;
      if (!files || !Array.isArray(files) || files.length === 0) {
        const response = ApiResponseBuilder.badRequest('No image files provided');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Upload images using the image upload service
      const result = await imageUploadService.uploadTourImages(tour_id, files);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Images uploaded successfully');
      res.status(201).json(response.body);

      logger.info('Tour images uploaded successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: tour_id,
        uploadedCount: result.uploadedCount,
        failedCount: result.failedCount,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to upload tour images', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
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
        const response = ApiResponseBuilder.internalServerError('Failed to upload tour images');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get tours for user dashboard
   * GET /api/v1/tours/dashboard
   */
  async getToursForDashboard(req: Request, res: Response): Promise<void> {
    const method = 'getToursForDashboard';
    const correlationId = `tour_dashboard_${Date.now()}`;
    
    try {
      logger.info('Getting tours for dashboard request received', {
        service: this.controllerName,
        method,
        correlationId,
        headers: req.headers
      });

      // Get user ID from authentication middleware
      const userId = (req as any).user?.user_id;
      if (!userId) {
        const response = ApiResponseBuilder.unauthorized('Authentication required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Get user's role
      const userRole = (req as any).user?.role;
      
      // Set default search params
      const searchParams: TourSearchParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      // Add user-specific filtering based on role
      if (userRole === 'dmc_admin' || userRole === 'tour_operator') {
        // Show only tours created by this user
        (searchParams as any).created_by = userId;
      }
      // For customers and partners, show all active tours

      // Search tours
      const result = await tourService.searchTours(searchParams);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Dashboard tours retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Dashboard tours retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        userId,
        userRole,
        resultCount: result.tours.length,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get dashboard tours', {
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
        const response = ApiResponseBuilder.internalServerError('Failed to get dashboard tours');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Delete tour image
   * DELETE /api/v1/tours/:tour_id/images/:image_id
   */
  async deleteImage(req: Request, res: Response): Promise<void> {
    const method = 'deleteImage';
    const correlationId = `delete_image_${req.params.tour_id}_${req.params.image_id}`;
    
    try {
      logger.info('Deleting tour image request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        imageId: req.params.image_id
      });

      const { tour_id, image_id } = req.params;

      // Validate parameters
      if (!tour_id || !image_id) {
        const response = ApiResponseBuilder.badRequest('Tour ID and Image ID are required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Delete image using the image upload service
      const result = await imageUploadService.deleteTourImage(tour_id, image_id);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Image deleted successfully');
      res.status(200).json(response.body);

      logger.info('Tour image deleted successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: tour_id,
        imageId: image_id,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to delete tour image', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        imageId: req.params.image_id,
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
        const response = ApiResponseBuilder.internalServerError('Failed to delete tour image');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Reorder tour images
   * PUT /api/v1/tours/:tour_id/images/reorder
   */
  async reorderImages(req: Request, res: Response): Promise<void> {
    const method = 'reorderImages';
    const correlationId = `reorder_images_${req.params.tour_id}`;
    
    try {
      logger.info('Reordering tour images request received', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
        body: req.body
      });

      const { tour_id } = req.params;
      const { image_ids } = req.body;

      // Validate parameters
      if (!tour_id || !image_ids) {
        const response = ApiResponseBuilder.badRequest('Tour ID and image IDs are required');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Validate image_ids is an array
      if (!Array.isArray(image_ids) || image_ids.length === 0) {
        const response = ApiResponseBuilder.badRequest('Image IDs must be a non-empty array');
        res.status(response.statusCode).json(response.body);
        return;
      }

      // Reorder images using the image upload service
      const result = await imageUploadService.reorderTourImages(tour_id, image_ids);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Images reordered successfully');
      res.status(200).json(response.body);

      logger.info('Tour images reordered successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: tour_id,
        imageCount: image_ids.length,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to reorder tour images', {
        service: this.controllerName,
        method,
        correlationId,
        tourId: req.params.tour_id,
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
        const response = ApiResponseBuilder.internalServerError('Failed to reorder tour images');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get search metadata for filters
   * GET /api/v1/tours/meta
   */
  async getSearchMetadata(req: Request, res: Response): Promise<void> {
    const method = 'getSearchMetadata';
    const correlationId = `search_metadata_${Date.now()}`;
    
    try {
      logger.info('Getting search metadata request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query
      });

      const language = req.query.language as string;
      const currency = req.query.currency as string;

      // Get metadata using the tour service
      const metadata = await tourService.getSearchMetadata(language, currency);

      // Return success response
      const response = ApiResponseBuilder.success(metadata, 'Search metadata retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Search metadata retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        hasMetadata: !!metadata,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get search metadata', {
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
        const response = ApiResponseBuilder.internalServerError('Failed to get search metadata');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get featured tours
   * GET /api/v1/tours/featured
   */
  async getFeaturedTours(req: Request, res: Response): Promise<void> {
    const method = 'getFeaturedTours';
    const correlationId = `featured_tours_${Date.now()}`;
    
    try {
      logger.info('Getting featured tours request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query
      });

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const language = req.query.language as string;
      const currency = req.query.currency as string;

      // Get featured tours using the tour service
      const result = await tourService.getFeaturedTours(limit, language, currency);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Featured tours retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Featured tours retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourCount: result.tours.length,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get featured tours', {
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
        const response = ApiResponseBuilder.internalServerError('Failed to get featured tours');
        res.status(500).json(response.body);
      }
    }
  }

  /**
   * Get popular tours
   * GET /api/v1/tours/popular
   */
  async getPopularTours(req: Request, res: Response): Promise<void> {
    const method = 'getPopularTours';
    const correlationId = `popular_tours_${Date.now()}`;
    
    try {
      logger.info('Getting popular tours request received', {
        service: this.controllerName,
        method,
        correlationId,
        query: req.query
      });

      const timeframe = (req.query.timeframe as 'week' | 'month' | 'year') || 'month';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const language = req.query.language as string;

      // Get popular tours using the tour service
      const result = await tourService.getPopularTours(timeframe, limit, language);

      // Return success response
      const response = ApiResponseBuilder.success(result, 'Popular tours retrieved successfully');
      res.status(200).json(response.body);

      logger.info('Popular tours retrieved successfully', {
        service: this.controllerName,
        method,
        correlationId,
        tourCount: result.tours.length,
        timeframe,
        status: 'success'
      });

    } catch (error) {
      logger.error('Failed to get popular tours', {
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
        const response = ApiResponseBuilder.internalServerError('Failed to get popular tours');
        res.status(500).json(response.body);
      }
    }
  }
}

export default new TourController();
