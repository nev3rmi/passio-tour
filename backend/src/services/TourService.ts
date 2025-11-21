// Tour Management System - Tour Service
// Date: 2025-11-19 | Feature: Tour Management System MVP

import { DatabaseManager } from '../database/DatabaseManager';
import { 
  Tour, 
  TourCreate, 
  TourUpdate, 
  TourSearchParams, 
  TourSearchResponse, 
  CreateTourResponse, 
  UpdateTourResponse, 
  GetTourResponse,
  DeleteTourResponse,
  TourDetail,
  TourCategory,
  TourType,
  TourStatus,
  DEFAULT_TOUR_LIMITS,
  validateTourName,
  validateTourPrice,
  validateParticipantRange,
  validateDuration,
  isValidCurrency,
  isValidLanguage
} from '@/types/tour';
import { TourImage, TourImageCreate, ImageValidationResult, validateImageFile } from '@/types/tour-image';
import { 
  Inventory, 
  InventorySlot,
  CreateInventorySlot 
} from '../../../shared/types/inventory';
import { logger } from '../utils/enhancedLogger';
import { ApiError } from '../middleware/apiResponse';

// Service Dependencies
export class TourService {
  private db: DatabaseManager;
  private readonly serviceName = 'TourService';

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Create a new tour with images and inventory
   */
  async createTour(tourData: TourCreate, userId: string): Promise<CreateTourResponse> {
    const method = 'createTour';
    const correlationId = `tour_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Creating new tour', {
        service: this.serviceName,
        method,
        correlationId,
        userId,
        tourName: tourData.name
      });

      // Validate tour data
      this.validateTourCreateData(tourData);

      // Create tour in database
      const tour = await this.db.transaction(async (trx) => {
        const query = `
          INSERT INTO tours (
            tenant_id, name, description, short_description, type, category, 
            destination, duration_hours, min_participants, max_participants,
            base_price, currency, difficulty_level, languages, inclusions, 
            exclusions, meeting_point, requirements, cancellation_policy,
            supplier_info, created_by, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
            $15, $16, $17, $18, $19, $20, $21, $22
          ) RETURNING *;
        `;

        const values = [
          this.getCurrentTenantId(), // tenant_id
          tourData.name,
          tourData.description,
          tourData.short_description || null,
          tourData.type,
          tourData.category,
          tourData.destination,
          tourData.duration_hours,
          tourData.min_participants,
          tourData.max_participants,
          tourData.base_price,
          tourData.currency,
          tourData.difficulty_level || null,
          JSON.stringify(tourData.languages || ['en']),
          JSON.stringify(tourData.inclusions || []),
          JSON.stringify(tourData.exclusions || []),
          tourData.meeting_point || null,
          JSON.stringify(tourData.requirements || []),
          tourData.cancellation_policy || null,
          tourData.supplier_info ? JSON.stringify(tourData.supplier_info) : null,
          userId,
          TourStatus.DRAFT // New tours default to draft
        ];

        const result = await trx.query(query, values);
        return result.rows[0];
      });

      // Handle images if provided
      if (tourData.images && tourData.images.length > 0) {
        await this.createTourImages(tour.tour_id, tourData.images, trx);
      }

      // Get the complete tour with images
      const completeTour = await this.getTourById(tour.tour_id);

      logger.info('Tour created successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId: tour.tour_id,
        imageCount: tourData.images?.length || 0
      });

      return {
        success: true,
        data: completeTour,
        message: 'Tour created successfully'
      };

    } catch (error) {
      logger.error('Failed to create tour', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create tour', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Advanced tour search with comprehensive filtering options
   */
  async searchTours(searchParams: TourSearchParams): Promise<TourSearchResponse> {
    const method = 'searchTours';
    const correlationId = `tour_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Searching tours', {
        service: this.serviceName,
        method,
        correlationId,
        searchParams
      });

      // Validate search parameters
      this.validateSearchParams(searchParams);

      // Build the query
      const { query, values, countQuery } = this.buildSearchQuery(searchParams);

      // Execute search and count queries
      const [tourResults, countResult] = await Promise.all([
        this.db.query(query, values),
        this.db.query(countQuery, values.slice(0, -2)) // Remove pagination params for count
      ]);

      const tours = tourResults.rows.map(this.mapToTourSummary);
      const total = parseInt(countResult.rows[0].total);

      // Build filter options
      const filterOptions = await this.buildFilterOptions(searchParams);

      const response: TourSearchResponse = {
        tours,
        pagination: {
          page: searchParams.page || 1,
          limit: searchParams.limit || 20,
          total,
          totalPages: Math.ceil(total / (searchParams.limit || 20))
        },
        filters: filterOptions,
        sort_options: this.getSortOptions()
      };

      logger.info('Tours searched successfully', {
        service: this.serviceName,
        method,
        correlationId,
        resultCount: tours.length,
        totalCount: total
      });

      return response;

    } catch (error) {
      logger.error('Failed to search tours', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to search tours', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Get tour by ID with full details
   */
  async getTourById(tourId: string): Promise<TourDetail> {
    const method = 'getTourById';
    const correlationId = `tour_get_${tourId}`;
    
    try {
      logger.info('Getting tour details', {
        service: this.serviceName,
        method,
        correlationId,
        tourId
      });

      const query = `
        SELECT 
          t.*,
          COALESCE(
            json_agg(
              json_build_object(
                'image_id', ti.image_id,
                'tour_id', ti.tour_id,
                'url', ti.url,
                'alt_text', ti.alt_text,
                'is_primary', ti.is_primary,
                'display_order', ti.display_order
              ) ORDER BY ti.display_order
            ) FILTER (WHERE ti.image_id IS NOT NULL), 
            '[]'::json
          ) as images,
          COUNT(ti.image_id) as image_count,
          AVG(r.rating) as average_rating,
          COUNT(r.review_id) as review_count
        FROM tours t
        LEFT JOIN tour_images ti ON t.tour_id = ti.tour_id
        LEFT JOIN reviews r ON t.tour_id = r.tour_id
        WHERE t.tour_id = $1 AND t.status != $2
        GROUP BY t.tour_id
      `;

      const result = await this.db.query(query, [tourId, TourStatus.ARCHIVED]);

      if (result.rows.length === 0) {
        throw new ApiError(404, 'TOUR_NOT_FOUND', 'Tour not found');
      }

      const tour = this.mapToTourDetail(result.rows[0]);

      logger.info('Tour details retrieved successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        hasImages: tour.images.length > 0
      });

      return tour;

    } catch (error) {
      logger.error('Failed to get tour details', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to get tour details', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Update tour
   */
  async updateTour(tourId: string, updateData: TourUpdate, userId: string): Promise<UpdateTourResponse> {
    const method = 'updateTour';
    const correlationId = `tour_update_${tourId}`;
    
    try {
      logger.info('Updating tour', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        userId
      });

      // Validate update data
      this.validateTourUpdateData(updateData);

      // Check if tour exists and user has permission
      const existingTour = await this.getTourById(tourId);

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }
      if (updateData.short_description !== undefined) {
        updates.push(`short_description = $${paramCount++}`);
        values.push(updateData.short_description);
      }
      if (updateData.category !== undefined) {
        updates.push(`category = $${paramCount++}`);
        values.push(updateData.category);
      }
      if (updateData.destination !== undefined) {
        updates.push(`destination = $${paramCount++}`);
        values.push(updateData.destination);
      }
      if (updateData.duration_hours !== undefined) {
        updates.push(`duration_hours = $${paramCount++}`);
        values.push(updateData.duration_hours);
      }
      if (updateData.min_participants !== undefined) {
        updates.push(`min_participants = $${paramCount++}`);
        values.push(updateData.min_participants);
      }
      if (updateData.max_participants !== undefined) {
        updates.push(`max_participants = $${paramCount++}`);
        values.push(updateData.max_participants);
      }
      if (updateData.base_price !== undefined) {
        updates.push(`base_price = $${paramCount++}`);
        values.push(updateData.base_price);
      }
      if (updateData.currency !== undefined) {
        updates.push(`currency = $${paramCount++}`);
        values.push(updateData.currency);
      }
      if (updateData.difficulty_level !== undefined) {
        updates.push(`difficulty_level = $${paramCount++}`);
        values.push(updateData.difficulty_level);
      }
      if (updateData.languages !== undefined) {
        updates.push(`languages = $${paramCount++}`);
        values.push(JSON.stringify(updateData.languages));
      }
      if (updateData.inclusions !== undefined) {
        updates.push(`inclusions = $${paramCount++}`);
        values.push(JSON.stringify(updateData.inclusions));
      }
      if (updateData.exclusions !== undefined) {
        updates.push(`exclusions = $${paramCount++}`);
        values.push(JSON.stringify(updateData.exclusions));
      }
      if (updateData.meeting_point !== undefined) {
        updates.push(`meeting_point = $${paramCount++}`);
        values.push(updateData.meeting_point);
      }
      if (updateData.requirements !== undefined) {
        updates.push(`requirements = $${paramCount++}`);
        values.push(JSON.stringify(updateData.requirements));
      }
      if (updateData.cancellation_policy !== undefined) {
        updates.push(`cancellation_policy = $${paramCount++}`);
        values.push(updateData.cancellation_policy);
      }
      if (updateData.supplier_info !== undefined) {
        updates.push(`supplier_info = $${paramCount++}`);
        values.push(JSON.stringify(updateData.supplier_info));
      }
      if (updateData.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) { // Only updated_at
        throw new ApiError(400, 'VALIDATION_ERROR', 'No valid fields to update');
      }

      values.push(tourId); // Add tourId for WHERE clause

      const updateQuery = `
        UPDATE tours 
        SET ${updates.join(', ')}
        WHERE tour_id = $${paramCount}
        RETURNING *;
      `;

      const result = await this.db.query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new ApiError(404, 'TOUR_NOT_FOUND', 'Tour not found');
      }

      const updatedTour = await this.getTourById(tourId);

      logger.info('Tour updated successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        updatedFields: Object.keys(updateData)
      });

      return {
        success: true,
        data: updatedTour,
        message: 'Tour updated successfully'
      };

    } catch (error) {
      logger.error('Failed to update tour', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to update tour', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Delete tour (soft delete - archive)
   */
  async deleteTour(tourId: string, userId: string): Promise<DeleteTourResponse> {
    const method = 'deleteTour';
    const correlationId = `tour_delete_${tourId}`;
    
    try {
      logger.info('Deleting tour', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        userId
      });

      // Check if tour exists
      const existingTour = await this.getTourById(tourId);

      // Check for active bookings
      const hasActiveBookings = await this.checkActiveBookings(tourId);
      if (hasActiveBookings) {
        throw new ApiError(409, 'TOUR_HAS_ACTIVE_BOOKINGS', 'Cannot delete tour with active bookings');
      }

      // Soft delete by archiving
      const query = `
        UPDATE tours 
        SET status = $1, updated_at = NOW()
        WHERE tour_id = $2
        RETURNING tour_id;
      `;

      const result = await this.db.query(query, [TourStatus.ARCHIVED, tourId]);

      if (result.rows.length === 0) {
        throw new ApiError(404, 'TOUR_NOT_FOUND', 'Tour not found');
      }

      logger.info('Tour deleted successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId
      });

      return {
        success: true,
        message: 'Tour deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete tour', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to delete tour', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Upload and manage tour images
   */
  async uploadTourImages(tourId: string, images: TourImageCreate[]): Promise<{ success: boolean; data: TourImage[] }> {
    const method = 'uploadTourImages';
    const correlationId = `tour_images_${tourId}`;
    
    try {
      logger.info('Uploading tour images', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        imageCount: images.length
      });

      // Validate images
      for (const image of images) {
        const validation = this.validateImage(image);
        if (!validation.isValid) {
          throw new ApiError(400, 'INVALID_IMAGE', `Invalid image: ${validation.errors.join(', ')}`);
        }
      }

      const createdImages: TourImage[] = [];

      await this.db.transaction(async (trx) => {
        for (const [index, imageData] of images.entries()) {
          const query = `
            INSERT INTO tour_images (
              tour_id, url, alt_text, is_primary, display_order
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
          `;

          const values = [
            tourId,
            imageData.url,
            imageData.alt_text,
            imageData.is_primary || false,
            imageData.display_order || index
          ];

          const result = await trx.query(query, values);
          createdImages.push(result.rows[0]);
        }
      });

      logger.info('Tour images uploaded successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        uploadedCount: createdImages.length
      });

      return {
        success: true,
        data: createdImages
      };

    } catch (error) {
      logger.error('Failed to upload tour images', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to upload tour images', error instanceof Error ? error.message : undefined);
    }
  }

  // Private helper methods

  private validateTourCreateData(tourData: TourCreate): void {
    const errors: string[] = [];

    // Required field validation
    if (!tourData.name || !validateTourName(tourData.name)) {
      errors.push('Invalid tour name');
    }
    if (!tourData.description) {
      errors.push('Tour description is required');
    }
    if (!tourData.category || !Object.values(TourCategory).includes(tourData.category as TourCategory)) {
      errors.push('Invalid tour category');
    }
    if (!tourData.destination) {
      errors.push('Tour destination is required');
    }
    if (!tourData.type || !Object.values(TourType).includes(tourData.type as TourType)) {
      errors.push('Invalid tour type');
    }

    // Numeric validation
    if (!validateTourPrice(tourData.base_price)) {
      errors.push('Invalid tour price');
    }
    if (!validateParticipantRange(tourData.min_participants, tourData.max_participants)) {
      errors.push('Invalid participant range');
    }
    if (!validateDuration(tourData.duration_hours)) {
      errors.push('Invalid tour duration');
    }

    // Currency validation
    if (!isValidCurrency(tourData.currency)) {
      errors.push('Invalid currency');
    }

    // Array validation
    if (tourData.languages) {
      for (const lang of tourData.languages) {
        if (!isValidLanguage(lang)) {
          errors.push(`Invalid language code: ${lang}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Tour validation failed', errors);
    }
  }

  private validateTourUpdateData(updateData: TourUpdate): void {
    const errors: string[] = [];

    // Validate individual fields if provided
    if (updateData.name && !validateTourName(updateData.name)) {
      errors.push('Invalid tour name');
    }
    if (updateData.base_price && !validateTourPrice(updateData.base_price)) {
      errors.push('Invalid tour price');
    }
    if (updateData.min_participants !== undefined && updateData.max_participants !== undefined) {
      if (!validateParticipantRange(updateData.min_participants, updateData.max_participants)) {
        errors.push('Invalid participant range');
      }
    }
    if (updateData.duration_hours && !validateDuration(updateData.duration_hours)) {
      errors.push('Invalid tour duration');
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Tour update validation failed', errors);
    }
  }

  private validateSearchParams(searchParams: TourSearchParams): void {
    const errors: string[] = [];

    if (searchParams.page && searchParams.page < 1) {
      errors.push('Page must be greater than 0');
    }
    if (searchParams.limit && (searchParams.limit < 1 || searchParams.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }
    if (searchParams.min_price && searchParams.max_price && searchParams.min_price > searchParams.max_price) {
      errors.push('Min price cannot be greater than max price');
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Search parameters validation failed', errors);
    }
  }

  private validateImage(imageData: TourImageCreate): ImageValidationResult {
    const errors: string[] = [];

    if (!imageData.url) {
      errors.push('Image URL is required');
    }
    if (!imageData.alt_text) {
      errors.push('Image alt text is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private buildSearchQuery(searchParams: TourSearchParams): { query: string; values: any[]; countQuery: string } {
    const conditions: string[] = ['t.status != $ARCHIVED'];
    const values: any[] = [];
    let paramCount = 1;

    // Add WHERE conditions based on search params
    if (searchParams.search) {
      conditions.push(`(
        t.name ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount} OR 
        t.destination ILIKE $${paramCount}
      )`);
      values.push(`%${searchParams.search}%`);
      paramCount++;
    }

    if (searchParams.destination) {
      conditions.push(`t.destination = $${paramCount}`);
      values.push(searchParams.destination);
      paramCount++;
    }

    if (searchParams.category) {
      conditions.push(`t.category = $${paramCount}`);
      values.push(searchParams.category);
      paramCount++;
    }

    if (searchParams.type) {
      conditions.push(`t.type = $${paramCount}`);
      values.push(searchParams.type);
      paramCount++;
    }

    if (searchParams.min_price) {
      conditions.push(`t.base_price >= $${paramCount}`);
      values.push(searchParams.min_price);
      paramCount++;
    }

    if (searchParams.max_price) {
      conditions.push(`t.base_price <= $${paramCount}`);
      values.push(searchParams.max_price);
      paramCount++;
    }

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY t.created_at DESC';
    if (searchParams.sort_by && searchParams.sort_order) {
      const validSortFields = ['name', 'price', 'duration_hours', 'created_at'];
      const validSortOrders = ['asc', 'desc'];

      if (validSortFields.includes(searchParams.sort_by) && validSortOrders.includes(searchParams.sort_order)) {
        orderByClause = `ORDER BY t.${searchParams.sort_by} ${searchParams.sort_order.toUpperCase()}`;
      }
    }

    // Build pagination
    const page = searchParams.page || 1;
    const limit = searchParams.limit || 20;
    const offset = (page - 1) * limit;

    values.push(limit, offset);

    const query = `
      SELECT DISTINCT
        t.tour_id,
        t.name,
        t.short_description,
        t.destination,
        t.category,
        t.type,
        t.base_price,
        t.currency,
        t.duration_hours,
        t.min_participants,
        t.max_participants,
        t.status,
        COALESCE(
          json_agg(
            json_build_object(
              'image_id', ti.image_id,
              'url', ti.url,
              'alt_text', ti.alt_text,
              'is_primary', ti.is_primary,
              'display_order', ti.display_order
            ) ORDER BY ti.display_order
          ) FILTER (WHERE ti.image_id IS NOT NULL), 
          '[]'::json
        ) as images,
        AVG(r.rating) as rating,
        COUNT(r.review_id) as review_count
      FROM tours t
      LEFT JOIN tour_images ti ON t.tour_id = ti.tour_id
      LEFT JOIN reviews r ON t.tour_id = r.tour_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.tour_id
      ${orderByClause}
      LIMIT $${paramCount++} OFFSET $${paramCount};
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT t.tour_id) as total
      FROM tours t
      WHERE ${conditions.join(' AND ')};
    `;

    return { query, values, countQuery };
  }

  private async buildFilterOptions(searchParams: TourSearchParams): Promise<{
    destinations: string[];
    categories: string[];
    price_range: { min: number; max: number };
  }> {
    // This would be optimized with database views or cached queries
    const baseConditions = ['t.status != $ARCHIVED'];
    const values: any[] = [];

    if (searchParams.type) {
      baseConditions.push('t.type = $1');
      values.push(searchParams.type);
    }

    const query = `
      SELECT DISTINCT
        array_agg(DISTINCT t.destination) FILTER (WHERE t.destination IS NOT NULL) as destinations,
        array_agg(DISTINCT t.category) FILTER (WHERE t.category IS NOT NULL) as categories,
        MIN(t.base_price) as min_price,
        MAX(t.base_price) as max_price
      FROM tours t
      WHERE ${baseConditions.join(' AND ')};
    `;

    const result = await this.db.query(query, values);

    return {
      destinations: result.rows[0].destinations || [],
      categories: result.rows[0].categories || [],
      price_range: {
        min: parseFloat(result.rows[0].min_price) || 0,
        max: parseFloat(result.rows[0].max_price) || 1000
      }
    };
  }

  private getSortOptions(): { field: string; label: string }[] {
    return [
      { field: 'name', label: 'Name' },
      { field: 'price', label: 'Price' },
      { field: 'duration_hours', label: 'Duration' },
      { field: 'created_at', label: 'Date Added' }
    ];
  }

  private mapToTourSummary(row: any) {
    return {
      tour_id: row.tour_id,
      name: row.name,
      short_description: row.short_description,
      destination: row.destination,
      category: row.category,
      type: row.type,
      base_price: parseFloat(row.base_price),
      currency: row.currency,
      duration_hours: parseFloat(row.duration_hours),
      min_participants: parseInt(row.min_participants),
      max_participants: parseInt(row.max_participants),
      images: row.images || [],
      rating: row.rating ? parseFloat(row.rating) : null,
      review_count: row.review_count ? parseInt(row.review_count) : 0,
      status: row.status
    };
  }

  private mapToTourDetail(row: any): TourDetail {
    return {
      ...this.mapToTourSummary(row),
      description: row.description,
      difficulty_level: row.difficulty_level,
      languages: row.languages ? JSON.parse(row.languages) : [],
      inclusions: row.inclusions ? JSON.parse(row.inclusions) : [],
      exclusions: row.exclusions ? JSON.parse(row.exclusions) : [],
      meeting_point: row.meeting_point,
      requirements: row.requirements ? JSON.parse(row.requirements) : [],
      cancellation_policy: row.cancellation_policy,
      supplier_info: row.supplier_info ? JSON.parse(row.supplier_info) : null,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      availability_summary: {
        next_available_date: null, // Would be populated from inventory
        available_dates_count: 0,
        price_range: {
          min: parseFloat(row.base_price),
          max: parseFloat(row.base_price)
        }
      }
    };
  }

  private async getCurrentTenantId(): string {
    // This would get the current tenant ID from the request context
    return 'default-tenant';
  }

  private async checkActiveBookings(tourId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as booking_count
      FROM bookings 
      WHERE tour_id = $1 AND status IN ('pending', 'confirmed')
    `;

    const result = await this.db.query(query, [tourId]);
    return parseInt(result.rows[0].booking_count) > 0;
  }

  private async createTourImages(tourId: string, images: TourImageCreate[], trx: any): Promise<void> {
    // Implementation for creating tour images
    // This would handle the database operations for image creation
  }

  /**
   * Search tours by location with radius-based filtering
   */
  async searchToursByLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 50,
    searchParams?: TourSearchParams
  ): Promise<TourSearchResponse> {
    const method = 'searchToursByLocation';
    const correlationId = `tour_location_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('Searching tours by location', {
        service: this.serviceName,
        method,
        correlationId,
        latitude,
        longitude,
        radiusKm
      });

      // Enhanced search parameters with location
      const enhancedParams: TourSearchParams = {
        ...searchParams,
        location: {
          latitude,
          longitude,
          radius: radiusKm
        }
      };

      return await this.searchTours(enhancedParams);

    } catch (error) {
      logger.error('Failed to search tours by location', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'LOCATION_SEARCH_ERROR', 'Failed to search tours by location', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Search tours by availability for specific dates
   */
  async searchToursByAvailability(
    startDate: Date,
    endDate: Date,
    groupSize: number = 1,
    searchParams?: TourSearchParams
  ): Promise<TourSearchResponse> {
    const method = 'searchToursByAvailability';
    const correlationId = `tour_availability_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('Searching tours by availability', {
        service: this.serviceName,
        method,
        correlationId,
        startDate,
        endDate,
        groupSize
      });

      // Enhanced search parameters with availability filter
      const enhancedParams: TourSearchParams = {
        ...searchParams,
        availability: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          groupSize
        }
      };

      return await this.searchTours(enhancedParams);

    } catch (error) {
      logger.error('Failed to search tours by availability', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'AVAILABILITY_SEARCH_ERROR', 'Failed to search tours by availability', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Get featured tours based on popularity and ratings
   */
  async getFeaturedTours(
    limit: number = 10,
    language?: string,
    currency?: string
  ): Promise<TourSearchResponse> {
    const method = 'getFeaturedTours';
    const correlationId = `featured_tours_${Date.now()}`;

    try {
      logger.info('Getting featured tours', {
        service: this.serviceName,
        method,
        correlationId,
        limit
      });

      const featuredParams: TourSearchParams = {
        sortBy: 'popularity',
        sortOrder: 'desc',
        limit,
        language,
        currency,
        status: [TourStatus.PUBLISHED]
      };

      return await this.searchTours(featuredParams);

    } catch (error) {
      logger.error('Failed to get featured tours', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'FEATURED_TOURS_ERROR', 'Failed to get featured tours', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Get popular tours based on booking frequency
   */
  async getPopularTours(
    timeframe: 'week' | 'month' | 'year' = 'month',
    limit: number = 10,
    language?: string
  ): Promise<TourSearchResponse> {
    const method = 'getPopularTours';
    const correlationId = `popular_tours_${Date.now()}`;

    try {
      logger.info('Getting popular tours', {
        service: this.serviceName,
        method,
        correlationId,
        timeframe,
        limit
      });

      let sortBy = 'weekly_bookings';
      if (timeframe === 'month') {
        sortBy = 'monthly_bookings';
      } else if (timeframe === 'year') {
        sortBy = 'total_bookings';
      }

      const popularParams: TourSearchParams = {
        sortBy,
        sortOrder: 'desc',
        limit,
        language,
        status: [TourStatus.PUBLISHED]
      };

      return await this.searchTours(popularParams);

    } catch (error) {
      logger.error('Failed to get popular tours', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'POPULAR_TOURS_ERROR', 'Failed to get popular tours', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Get search metadata for building filter options
   */
  async getSearchMetadata(
    language?: string,
    currency?: string
  ): Promise<any> {
    const method = 'getSearchMetadata';
    const correlationId = `search_metadata_${Date.now()}`;

    try {
      logger.info('Getting search metadata', {
        service: this.serviceName,
        method,
        correlationId
      });

      const query = `
        SELECT 
          json_build_object(
            'tour_types', json_agg(DISTINCT t.tour_type ORDER BY t.tour_type),
            'difficulty_levels', json_agg(DISTINCT t.difficulty_level ORDER BY t.difficulty_level),
            'duration_ranges', json_build_object(
              'min_days', MIN(t.duration_days),
              'max_days', MAX(t.duration_days)
            ),
            'price_range', json_build_object(
              'min', MIN(t.base_price),
              'max', MAX(t.base_price)
            ),
            'group_sizes', json_build_object(
              'min_size', MIN(t.group_size_min),
              'max_size', MAX(t.group_size_max)
            ),
            'languages', array_agg(DISTINCT t.language) FILTER (WHERE t.language IS NOT NULL),
            'currencies', array_agg(DISTINCT t.currency) FILTER (WHERE t.currency IS NOT NULL),
            'total_tours', COUNT(*),
            'featured_tours', COUNT(*) FILTER (WHERE t.is_featured = TRUE),
            'average_rating', AVG(t.average_rating),
            'total_reviews', SUM(t.total_reviews)
          ) as metadata
        FROM tours t
        WHERE t.status = $1
      `;

      const result = await this.db.query(query, [TourStatus.PUBLISHED]);
      const metadata = result.rows[0].metadata;

      logger.info('Search metadata retrieved successfully', {
        service: this.serviceName,
        method,
        correlationId,
        metadataKeys: Object.keys(metadata)
      });

      return metadata;

    } catch (error) {
      logger.error('Failed to get search metadata', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'METADATA_ERROR', 'Failed to get search metadata', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Advanced facet-based search for building sophisticated filters
   */
  async searchToursWithFacets(
    searchParams: TourSearchParams
  ): Promise<{ tours: TourSearchResponse; facets: any }> {
    const method = 'searchToursWithFacets';
    const correlationId = `facet_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('Performing facet search', {
        service: this.serviceName,
        method,
        correlationId
      });

      // Get tours with basic search
      const tourResults = await this.searchTours(searchParams);

      // Build facets based on current search results
      const facets = await this.buildFacets(searchParams);

      return {
        tours: tourResults,
        facets
      };

    } catch (error) {
      logger.error('Failed to perform facet search', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'FACET_SEARCH_ERROR', 'Failed to perform facet search', error instanceof Error ? error.message : undefined);
    }
  }

  private async buildFacets(searchParams: TourSearchParams): Promise<any> {
    const method = 'buildFacets';
    
    try {
      // Build query for facets based on current filters
      let facetQuery = `
        SELECT 
          json_build_object(
            'tour_types', (
              SELECT json_object_agg(tour_type, count)
              FROM (
                SELECT tour_type, COUNT(*) as count
                FROM tours t
                WHERE t.status = $1
                GROUP BY tour_type
              ) type_counts
            ),
            'difficulty_levels', (
              SELECT json_object_agg(difficulty_level, count)
              FROM (
                SELECT difficulty_level, COUNT(*) as count
                FROM tours t
                WHERE t.status = $1
                GROUP BY difficulty_level
              ) diff_counts
            ),
            'price_ranges', (
              SELECT json_object_agg(range_label, count)
              FROM (
                SELECT 
                  CASE 
                    WHEN base_price < 100 THEN 'Under $100'
                    WHEN base_price < 250 THEN '$100 - $250'
                    WHEN base_price < 500 THEN '$250 - $500'
                    WHEN base_price < 1000 THEN '$500 - $1000'
                    ELSE 'Over $1000'
                  END as range_label,
                  COUNT(*) as count
                FROM tours t
                WHERE t.status = $1
                GROUP BY range_label
              ) price_ranges
            ),
            'durations', (
              SELECT json_object_agg(duration_label, count)
              FROM (
                SELECT 
                  CASE 
                    WHEN duration_days = 1 THEN '1 Day'
                    WHEN duration_days <= 3 THEN '2-3 Days'
                    WHEN duration_days <= 7 THEN '4-7 Days'
                    WHEN duration_days <= 14 THEN '8-14 Days'
                    ELSE '15+ Days'
                  END as duration_label,
                  COUNT(*) as count
                FROM tours t
                WHERE t.status = $1
                GROUP BY duration_label
              ) duration_ranges
            )
          ) as facets
      `;

      const result = await this.db.query(facetQuery, [TourStatus.PUBLISHED]);
      return result.rows[0].facets;

    } catch (error) {
      logger.error('Failed to build facets', {
        service: this.serviceName,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {};
    }
  }
}
