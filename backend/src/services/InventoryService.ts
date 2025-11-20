// Tour Management System - Inventory Service
// Date: 2025-11-20 | Feature: Tour Management System MVP

import { DatabaseManager } from '../database/DatabaseManager';
import { 
  Inventory,
  InventorySlot,
  CreateInventorySlot,
  UpdateInventorySlot,
  BulkInventoryUpdate,
  InventoryResponse,
  BulkInventoryResponse,
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
  CheckAvailabilityRangeRequest,
  CheckAvailabilityRangeResponse,
  ReserveSlotRequest,
  ReserveSlotResponse,
  ReleaseReservationRequest,
  ReleaseReservationResponse,
  InventorySearchParams,
  InventorySearchResponse,
  InventoryStats,
  validateInventorySlot,
  validateDateRange,
  isSlotAvailable,
  generateDateRange,
  isDateInPast,
  getDatePricing,
  INVENTORY_CONSTRAINTS,
  INVENTORY_ERROR_CODES
} from '../../../shared/types/inventory';
import { logger } from '../utils/enhancedLogger';
import { ApiError } from '../middleware/apiResponse';

export class InventoryService {
  private db: DatabaseManager;
  private readonly serviceName = 'InventoryService';

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Create inventory slot for a specific tour and date
   */
  async createInventorySlot(
    slotData: CreateInventorySlot,
    userId: string
  ): Promise<InventoryResponse> {
    const method = 'createInventorySlot';
    const correlationId = `inv_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Creating inventory slot', {
        service: this.serviceName,
        method,
        correlationId,
        tourId: slotData.tour_id,
        date: slotData.date,
        userId
      });

      // Validate input data
      this.validateCreateInventorySlot(slotData);

      // Check if inventory slot already exists
      const existingSlot = await this.getInventorySlotByDate(slotData.tour_id, slotData.date);
      if (existingSlot) {
        throw new ApiError(409, 'INVENTORY_EXISTS', 'Inventory slot already exists for this date');
      }

      // Create inventory slot
      const result = await this.db.query(`
        INSERT INTO inventory (
          tour_id, tour_date, total_capacity, booked_count, 
          price, currency, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        slotData.tour_id,
        slotData.date,
        slotData.max_capacity,
        slotData.max_capacity - slotData.available_count,
        slotData.base_price || 0,
        'USD',
        slotData.is_available !== false ? 'AVAILABLE' : 'BLOCKED'
      ]);

      const inventorySlot = await this.mapToInventorySlot(result.rows[0]);

      logger.info('Inventory slot created successfully', {
        service: this.serviceName,
        method,
        correlationId,
        inventoryId: inventorySlot.inventory_id
      });

      return {
        success: true,
        data: inventorySlot,
        message: 'Inventory slot created successfully'
      };

    } catch (error) {
      logger.error('Failed to create inventory slot', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to create inventory slot', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Update inventory slot
   */
  async updateInventorySlot(
    inventoryId: string,
    updateData: UpdateInventorySlot,
    userId: string
  ): Promise<InventoryResponse> {
    const method = 'updateInventorySlot';
    const correlationId = `inv_update_${inventoryId}`;
    
    try {
      logger.info('Updating inventory slot', {
        service: this.serviceName,
        method,
        correlationId,
        inventoryId,
        userId
      });

      // Check if inventory slot exists
      const existingSlot = await this.getInventorySlotById(inventoryId);
      if (!existingSlot) {
        throw new ApiError(404, 'INVENTORY_NOT_FOUND', 'Inventory slot not found');
      }

      // Validate update data
      this.validateUpdateInventorySlot(updateData, existingSlot);

      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.available_count !== undefined) {
        const newBookedCount = existingSlot.max_capacity - updateData.available_count;
        updates.push(`booked_count = $${paramCount++}`);
        values.push(newBookedCount);
      }

      if (updateData.max_capacity !== undefined) {
        updates.push(`total_capacity = $${paramCount++}`);
        values.push(updateData.max_capacity);
      }

      if (updateData.base_price !== undefined) {
        updates.push(`price = $${paramCount++}`);
        values.push(updateData.base_price);
      }

      if (updateData.is_available !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(updateData.is_available ? 'AVAILABLE' : 'BLOCKED');
      }

      if (updateData.notes !== undefined) {
        updates.push(`block_reason = $${paramCount++}`);
        values.push(updateData.notes);
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) { // Only updated_at
        throw new ApiError(400, 'VALIDATION_ERROR', 'No valid fields to update');
      }

      values.push(inventoryId);

      const result = await this.db.query(
        `UPDATE inventory SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      const updatedSlot = await this.mapToInventorySlot(result.rows[0]);

      logger.info('Inventory slot updated successfully', {
        service: this.serviceName,
        method,
        correlationId,
        inventoryId
      });

      return {
        success: true,
        data: updatedSlot,
        message: 'Inventory slot updated successfully'
      };

    } catch (error) {
      logger.error('Failed to update inventory slot', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to update inventory slot', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Bulk update inventory slots
   */
  async bulkUpdateInventory(
    bulkData: BulkInventoryUpdate,
    userId: string
  ): Promise<BulkInventoryResponse> {
    const method = 'bulkUpdateInventory';
    const correlationId = `inv_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Bulk updating inventory', {
        service: this.serviceName,
        method,
        correlationId,
        tourId: bulkData.tour_id,
        updateCount: bulkData.updates.length,
        userId
      });

      if (bulkData.updates.length > INVENTORY_CONSTRAINTS.BULK_UPDATE_MAX_DATES) {
        throw new ApiError(400, 'BULK_UPDATE_LIMIT_EXCEEDED', `Cannot update more than ${INVENTORY_CONSTRAINTS.BULK_UPDATE_MAX_DATES} inventory slots at once`);
      }

      const updated: InventorySlot[] = [];
      const failed: { date: string; error: string }[] = [];

      for (const update of bulkData.updates) {
        try {
          const existingSlot = await this.getInventorySlotByDate(bulkData.tour_id, update.date);
          
          if (existingSlot) {
            const result = await this.updateInventorySlot(existingSlot.inventory_id, update, userId);
            if (result.success) {
              updated.push(result.data);
            } else {
              failed.push({ date: update.date, error: result.message || 'Update failed' });
            }
          } else {
            const createData: CreateInventorySlot = {
              tour_id: bulkData.tour_id,
              date: update.date,
              available_count: update.available_count || 10,
              max_capacity: update.max_capacity || 10,
              base_price: update.base_price,
              is_available: update.is_available,
              notes: update.notes
            };
            const result = await this.createInventorySlot(createData, userId);
            if (result.success) {
              updated.push(result.data);
            } else {
              failed.push({ date: update.date, error: result.message || 'Creation failed' });
            }
          }
        } catch (error) {
          failed.push({ 
            date: update.date, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      logger.info('Bulk inventory update completed', {
        service: this.serviceName,
        method,
        correlationId,
        updatedCount: updated.length,
        failedCount: failed.length
      });

      return {
        success: true,
        data: { updated, failed },
        message: `Updated ${updated.length} inventory slots, ${failed.length} failed`
      };

    } catch (error) {
      logger.error('Failed to bulk update inventory', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to bulk update inventory', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Check availability for a specific date
   */
  async checkAvailability(
    request: CheckAvailabilityRequest
  ): Promise<CheckAvailabilityResponse> {
    const method = 'checkAvailability';
    const correlationId = `inv_check_${request.tour_id}_${request.date}`;
    
    try {
      logger.info('Checking inventory availability', {
        service: this.serviceName,
        method,
        correlationId,
        tourId: request.tour_id,
        date: request.date,
        participants: request.participants
      });

      // Validate request
      if (isDateInPast(request.date)) {
        return {
          success: true,
          data: {
            tour_id: request.tour_id,
            date: request.date,
            requested_participants: request.participants,
            available: false,
            remaining_spots: 0,
            max_capacity: 0
          }
        };
      }

      const inventorySlot = await this.getInventorySlotByDate(request.tour_id, request.date);
      
      if (!inventorySlot || !inventorySlot.is_available) {
        return {
          success: true,
          data: {
            tour_id: request.tour_id,
            date: request.date,
            requested_participants: request.participants,
            available: false,
            remaining_spots: 0,
            max_capacity: inventorySlot?.max_capacity || 0
          }
        };
      }

      const available = isSlotAvailable(inventorySlot.available_count, request.participants);
      
      // Get pricing information
      const tourBasePrice = await this.getTourBasePrice(request.tour_id);
      const pricingInfo = tourBasePrice ? getDatePricing(tourBasePrice, request.date) : undefined;

      const response: CheckAvailabilityResponse = {
        success: true,
        data: {
          tour_id: request.tour_id,
          date: request.date,
          requested_participants: request.participants,
          available,
          remaining_spots: inventorySlot.available_count,
          max_capacity: inventorySlot.max_capacity
        }
      };

      if (pricingInfo) {
        response.data.price_info = {
          base_price: pricingInfo.base_price,
          adjusted_price: pricingInfo.adjusted_price,
          currency: pricingInfo.currency
        };
      }

      logger.info('Availability check completed', {
        service: this.serviceName,
        method,
        correlationId,
        available,
        remainingSpots: inventorySlot.available_count
      });

      return response;

    } catch (error) {
      logger.error('Failed to check availability', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to check availability', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Check availability for a date range
   */
  async checkAvailabilityRange(
    request: CheckAvailabilityRangeRequest
  ): Promise<CheckAvailabilityRangeResponse> {
    const method = 'checkAvailabilityRange';
    const correlationId = `inv_range_${request.tour_id}_${request.start_date}_${request.end_date}`;
    
    try {
      logger.info('Checking availability range', {
        service: this.serviceName,
        method,
        correlationId,
        tourId: request.tour_id,
        startDate: request.start_date,
        endDate: request.end_date,
        participants: request.participants
      });

      // Validate date range
      const dateValidation = validateDateRange(request.start_date, request.end_date);
      if (!dateValidation.isValid) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid date range', dateValidation.errors);
      }

      const dates = generateDateRange(request.start_date, request.end_date);
      const availability: InventorySlot[] = [];

      for (const date of dates) {
        const slot = await this.getInventorySlotByDate(request.tour_id, date);
        if (slot) {
          availability.push(slot);
        }
      }

      // Calculate summary
      const totalDates = dates.length;
      const availableDates = availability.filter(slot => 
        slot.is_available && isSlotAvailable(slot.available_count, request.participants)
      ).length;
      const fullyBookedDates = availability.filter(slot => 
        slot.available_count === 0
      ).length;
      const partiallyBookedDates = availability.filter(slot => 
        slot.available_count > 0 && slot.available_count < slot.max_capacity
      ).length;

      const response: CheckAvailabilityRangeResponse = {
        success: true,
        data: {
          tour_id: request.tour_id,
          date_range: {
            start_date: request.start_date,
            end_date: request.end_date
          },
          requested_participants: request.participants,
          availability,
          summary: {
            total_dates: totalDates,
            available_dates: availableDates,
            fully_booked_dates: fullyBookedDates,
            partially_booked_dates: partiallyBookedDates
          }
        }
      };

      logger.info('Availability range check completed', {
        service: this.serviceName,
        method,
        correlationId,
        totalDates,
        availableDates
      });

      return response;

    } catch (error) {
      logger.error('Failed to check availability range', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to check availability range', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Search inventory with filters
   */
  async searchInventory(
    searchParams: InventorySearchParams
  ): Promise<InventorySearchResponse> {
    const method = 'searchInventory';
    const correlationId = `inv_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Searching inventory', {
        service: this.serviceName,
        method,
        correlationId,
        searchParams
      });

      // Build query
      const { query, values, countQuery } = this.buildInventorySearchQuery(searchParams);

      // Execute search and count queries
      const [inventoryResults, countResult] = await Promise.all([
        this.db.query(query, values),
        this.db.query(countQuery, values.slice(0, -2))
      ]);

      const inventory = await Promise.all(
        inventoryResults.rows.map(row => this.mapToInventorySlot(row))
      );
      const total = parseInt(countResult.rows[0].total);

      const response: InventorySearchResponse = {
        success: true,
        data: {
          inventory,
          pagination: {
            page: searchParams.page || 1,
            limit: searchParams.limit || 20,
            total,
            totalPages: Math.ceil(total / (searchParams.limit || 20))
          },
          filters: {
            destinations: [],
            tour_names: [],
            price_range: { min: 0, max: 1000 }
          }
        }
      };

      logger.info('Inventory search completed', {
        service: this.serviceName,
        method,
        correlationId,
        resultCount: inventory.length,
        totalCount: total
      });

      return response;

    } catch (error) {
      logger.error('Failed to search inventory', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to search inventory', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Get inventory statistics for a tour
   */
  async getInventoryStats(
    tourId: string,
    startDate: string,
    endDate: string
  ): Promise<InventoryStats> {
    const method = 'getInventoryStats';
    const correlationId = `inv_stats_${tourId}`;
    
    try {
      logger.info('Getting inventory statistics', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        startDate,
        endDate
      });

      const query = `
        SELECT 
          i.tour_id,
          COUNT(*) as total_dates,
          SUM(i.total_capacity) as total_capacity,
          SUM(i.booked_count) as total_booked,
          SUM(i.available_spots) as total_available,
          AVG(CASE WHEN i.total_capacity > 0 
            THEN (i.booked_count::float / i.total_capacity::float) * 100 
            ELSE 0 END) as avg_utilization
        FROM inventory i
        WHERE i.tour_id = $1 
        AND i.tour_date BETWEEN $2 AND $3
        AND i.deleted_at IS NULL
        GROUP BY i.tour_id
      `;

      const result = await this.db.query(query, [tourId, startDate, endDate]);
      
      if (result.rows.length === 0) {
        throw new ApiError(404, 'NO_DATA', 'No inventory data found for the specified period');
      }

      const row = result.rows[0];

      // Get peak and low performance dates
      const peakDatesQuery = `
        SELECT 
          tour_date,
          (booked_count::float / total_capacity::float) * 100 as utilization
        FROM inventory
        WHERE tour_id = $1 
        AND tour_date BETWEEN $2 AND $3
        AND total_capacity > 0
        ORDER BY utilization DESC
        LIMIT 5
      `;

      const lowDatesQuery = `
        SELECT 
          tour_date,
          (booked_count::float / total_capacity::float) * 100 as utilization
        FROM inventory
        WHERE tour_id = $1 
        AND tour_date BETWEEN $2 AND $3
        AND total_capacity > 0
        ORDER BY utilization ASC
        LIMIT 5
      `;

      const [peakDatesResult, lowDatesResult] = await Promise.all([
        this.db.query(peakDatesQuery, [tourId, startDate, endDate]),
        this.db.query(lowDatesQuery, [tourId, startDate, endDate])
      ]);

      const stats: InventoryStats = {
        tour_id: tourId,
        period: {
          start_date: startDate,
          end_date: endDate
        },
        total_capacity: parseInt(row.total_capacity),
        total_booked: parseInt(row.total_booked),
        total_available: parseInt(row.total_available),
        average_utilization: parseFloat(row.avg_utilization),
        peak_dates: peakDatesResult.rows.map(r => ({
          date: r.tour_date,
          utilization: parseFloat(r.utilization)
        })),
        low_performance_dates: lowDatesResult.rows.map(r => ({
          date: r.tour_date,
          utilization: parseFloat(r.utilization)
        }))
      };

      logger.info('Inventory statistics retrieved', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        avgUtilization: stats.average_utilization
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get inventory statistics', {
        service: this.serviceName,
        method,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Failed to get inventory statistics', error instanceof Error ? error.message : undefined);
    }
  }

  // Private helper methods

  private async getInventorySlotById(inventoryId: string): Promise<InventorySlot | null> {
    const result = await this.db.query(`
      SELECT i.*, t.title as tour_name
      FROM inventory i
      LEFT JOIN tours t ON i.tour_id = t.id
      WHERE i.id = $1 AND i.deleted_at IS NULL
    `, [inventoryId]);

    return result.rows.length > 0 ? await this.mapToInventorySlot(result.rows[0]) : null;
  }

  private async getInventorySlotByDate(tourId: string, date: string): Promise<InventorySlot | null> {
    const result = await this.db.query(`
      SELECT i.*, t.title as tour_name
      FROM inventory i
      LEFT JOIN tours t ON i.tour_id = t.id
      WHERE i.tour_id = $1 AND i.tour_date = $2 AND i.deleted_at IS NULL
    `, [tourId, date]);

    return result.rows.length > 0 ? await this.mapToInventorySlot(result.rows[0]) : null;
  }

  private async getTourBasePrice(tourId: string): Promise<number | null> {
    const result = await this.db.query(
      'SELECT base_price FROM tours WHERE id = $1',
      [tourId]
    );

    return result.rows.length > 0 ? parseFloat(result.rows[0].base_price) : null;
  }

  private async mapToInventorySlot(row: any): Promise<InventorySlot> {
    return {
      inventory_id: row.id,
      tour_id: row.tour_id,
      date: row.tour_date,
      available_count: row.available_spots || row.total_capacity - row.booked_count,
      max_capacity: row.total_capacity,
      base_price: parseFloat(row.price),
      is_available: row.status !== 'BLOCKED' && row.status !== 'SOLD_OUT',
      notes: row.block_reason,
      updated_at: row.updated_at,
      updated_by: 'system', // This would come from audit trail
      booking_count: row.booked_count,
      reserved_count: 0, // This would come from reservations table
      remaining_count: row.available_spots || row.total_capacity - row.booked_count
    };
  }

  private buildInventorySearchQuery(searchParams: InventorySearchParams): { query: string; values: any[]; countQuery: string } {
    const conditions: string[] = ['i.deleted_at IS NULL'];
    const values: any[] = [];
    let paramCount = 1;

    if (searchParams.tour_id) {
      conditions.push(`i.tour_id = $${paramCount++}`);
      values.push(searchParams.tour_id);
    }

    if (searchParams.start_date) {
      conditions.push(`i.tour_date >= $${paramCount++}`);
      values.push(searchParams.start_date);
    }

    if (searchParams.end_date) {
      conditions.push(`i.tour_date <= $${paramCount++}`);
      values.push(searchParams.end_date);
    }

    if (searchParams.is_available !== undefined) {
      if (searchParams.is_available) {
        conditions.push(`i.status IN ('AVAILABLE', 'LIMITED')`);
      } else {
        conditions.push(`i.status IN ('SOLD_OUT', 'BLOCKED', 'MAINTENANCE')`);
      }
    }

    if (searchParams.has_capacity) {
      conditions.push(`i.available_spots > 0`);
    }

    if (searchParams.price_range) {
      if (searchParams.price_range.min) {
        conditions.push(`i.price >= $${paramCount++}`);
        values.push(searchParams.price_range.min);
      }
      if (searchParams.price_range.max) {
        conditions.push(`i.price <= $${paramCount++}`);
        values.push(searchParams.price_range.max);
      }
    }

    // Build ORDER BY clause
    const validSortFields = ['tour_date', 'total_capacity', 'booked_count', 'price'];
    const sortBy = validSortFields.includes(searchParams.sort_by || 'tour_date') ? searchParams.sort_by || 'tour_date' : 'tour_date';
    const sortOrder = searchParams.sort_order === 'asc' ? 'ASC' : 'DESC';

    // Build pagination
    const page = searchParams.page || 1;
    const limit = searchParams.limit || 20;
    const offset = (page - 1) * limit;

    values.push(limit, offset);

    const query = `
      SELECT 
        i.*,
        t.title as tour_name
      FROM inventory i
      LEFT JOIN tours t ON i.tour_id = t.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.${sortBy} ${sortOrder}
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory i
      WHERE ${conditions.join(' AND ')}
    `;

    return { query, values, countQuery };
  }

  private validateCreateInventorySlot(slotData: CreateInventorySlot): void {
    const errors: string[] = [];

    if (!slotData.tour_id) {
      errors.push('Tour ID is required');
    }

    if (!slotData.date) {
      errors.push('Date is required');
    }

    if (isDateInPast(slotData.date)) {
      errors.push('Cannot create inventory for past dates');
    }

    const capacityValidation = validateInventorySlot(slotData.available_count, slotData.max_capacity);
    if (!capacityValidation.isValid) {
      errors.push(...capacityValidation.errors);
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid inventory slot data', errors);
    }
  }

  private validateUpdateInventorySlot(updateData: UpdateInventorySlot, existingSlot: InventorySlot): void {
    const errors: string[] = [];

    if (updateData.available_count !== undefined && updateData.max_capacity !== undefined) {
      const capacityValidation = validateInventorySlot(updateData.available_count, updateData.max_capacity);
      if (!capacityValidation.isValid) {
        errors.push(...capacityValidation.errors);
      }
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid update data', errors);
    }
  }
}

export default InventoryService;