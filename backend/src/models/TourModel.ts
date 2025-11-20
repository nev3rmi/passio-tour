import { Tour, CreateTourRequest, UpdateTourRequest, TourSearchParams, TourListResponse, TourStats } from '@/types/tour'
import { query, transaction } from '@/database/connection'
import { logger } from '@/utils/logger'
import { CacheManager } from '@/services/CacheManager'

export interface CreateTourData {
  title: string
  description: string
  shortDescription?: string
  slug: string
  categoryId: string
  type: string
  operatorId: string
  basePrice: number
  currency: string
  pricePerPerson?: boolean
  
  // Duration
  durationDays: number
  durationHours: number
  durationMinutes?: number
  
  // Frequency
  frequencyType: 'daily' | 'weekly' | 'monthly' | 'custom'
  frequencyPattern?: string
  seasonal?: boolean
  startDate?: Date
  endDate?: Date
  availableDays?: number[]
  startTime: string
  endTime?: string
  
  // Location
  country: string
  region?: string
  city: string
  coordinatesLat?: number
  coordinatesLng?: number
  
  // Capacity
  maxParticipants: number
  minParticipants?: number
  currentParticipants?: number
  isPrivate?: boolean
  
  // Media
  primaryImage?: string
  videoUrl?: string
  
  // SEO and metadata
  metaTitle?: string
  metaDescription?: string
  tags?: string[]
  difficulty?: string
  
  // Age and language
  minAge?: number
  maxAge?: number
  requiresAdultSupervision?: boolean
  adultRequired?: boolean
  languages?: string[]
  
  // Policies
  cancellationPolicy?: any
  refundPolicy?: any
  termsAndConditions?: string[]
  
  // Lists
  included?: string[]
  excluded?: string[]
  requirements?: string[]
  recommendations?: string[]
  highlights?: string[]
}

export interface UpdateTourData extends Partial<CreateTourData> {
  status?: string
  averageRating?: number
  reviewCount?: number
  viewCount?: number
  bookingCount?: number
  conversionRate?: number
}

export interface TourFilters {
  status?: string
  type?: string
  category?: string
  operator?: string
  difficulty?: string
  priceMin?: number
  priceMax?: number
  location?: string
  tags?: string[]
  available?: boolean
  featured?: boolean
  ratingMin?: number
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class TourModel {
  private cacheManager: CacheManager

  constructor() {
    this.cacheManager = CacheManager.getInstance()
  }

  /**
   * Create a new tour
   */
  async create(tourData: CreateTourData): Promise<Tour> {
    try {
      return await transaction(async (client) => {
        // Insert main tour record
        const tourResult = await client.query(`
          INSERT INTO tours (
            title, description, short_description, slug, category_id, type,
            operator_id, base_price, currency, price_per_person,
            duration_days, duration_hours, duration_minutes,
            frequency_type, frequency_pattern, seasonal, start_date, end_date,
            available_days, start_time, end_time,
            country, region, city, coordinates_lat, coordinates_lng,
            max_participants, min_participants, current_participants, is_private,
            primary_image, video_url,
            meta_title, meta_description, tags, difficulty,
            min_age, max_age, requires_adult_supervision, adult_required, languages
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41)
          RETURNING *;
        `, [
          tourData.title,
          tourData.description,
          tourData.shortDescription || null,
          tourData.slug.toLowerCase(),
          tourData.categoryId,
          tourData.type,
          tourData.operatorId,
          tourData.basePrice,
          tourData.currency || 'USD',
          tourData.pricePerPerson !== false, // Default to true
          tourData.durationDays || 0,
          tourData.durationHours,
          tourData.durationMinutes || 0,
          tourData.frequencyType || 'daily',
          tourData.frequencyPattern || null,
          tourData.seasonal || false,
          tourData.startDate || null,
          tourData.endDate || null,
          tourData.availableDays || [1,2,3,4,5,6,0], // Default all days
          tourData.startTime,
          tourData.endTime || null,
          tourData.country,
          tourData.region || null,
          tourData.city,
          tourData.coordinatesLat || null,
          tourData.coordinatesLng || null,
          tourData.maxParticipants,
          tourData.minParticipants || null,
          tourData.currentParticipants || 0,
          tourData.isPrivate || false,
          tourData.primaryImage || null,
          tourData.videoUrl || null,
          tourData.metaTitle || null,
          tourData.metaDescription || null,
          tourData.tags || [],
          tourData.difficulty || 'moderate',
          tourData.minAge || 0,
          tourData.maxAge || null,
          tourData.requiresAdultSupervision || false,
          tourData.adultRequired || false,
          tourData.languages || ['English']
        ])

        const tour = tourResult.rows[0]
        const tourId = tour.id

        // Insert tour inclusions
        if (tourData.included && tourData.included.length > 0) {
          await client.query(
            'INSERT INTO tour_inclusions (tour_id, item, included) VALUES ($1, unnest($2), true)',
            [tourId, tourData.included]
          )
        }

        // Insert tour exclusions
        if (tourData.excluded && tourData.excluded.length > 0) {
          await client.query(
            'INSERT INTO tour_inclusions (tour_id, item, included) VALUES ($1, unnest($2), false)',
            [tourId, tourData.excluded]
          )
        }

        // Insert requirements
        if (tourData.requirements && tourData.requirements.length > 0) {
          await client.query(
            'INSERT INTO tour_requirements (tour_id, requirement) VALUES (unnest($1), unnest($2))',
            [Array(tourData.requirements.length).fill(tourId), tourData.requirements]
          )
        }

        // Insert recommendations
        if (tourData.recommendations && tourData.recommendations.length > 0) {
          await client.query(
            'INSERT INTO tour_recommendations (tour_id, recommendation) VALUES (unnest($1), unnest($2))',
            [Array(tourData.recommendations.length).fill(tourId), tourData.recommendations]
          )
        }

        // Insert highlights
        if (tourData.highlights && tourData.highlights.length > 0) {
          await client.query(
            'INSERT INTO tour_highlights (tour_id, highlight) VALUES (unnest($1), unnest($2))',
            [Array(tourData.highlights.length).fill(tourId), tourData.highlights]
          )
        }

        // Cache tour data
        await this.cacheManager.cacheTour(tourId, tour)

        logger.info('Tour created successfully', {
          tourId,
          title: tour.title,
          operatorId: tour.operator_id
        })

        return tour
      })
    } catch (error) {
      logger.error('Failed to create tour', {
        title: tourData.title,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Find tour by ID
   */
  async findById(id: string): Promise<Tour | null> {
    try {
      // Try cache first
      const cachedTour = await this.cacheManager.getTour(id)
      if (cachedTour) {
        return cachedTour
      }

      const result = await query(`
        SELECT t.*,
               tc.name as category_name,
               tc.slug as category_slug,
               u.full_name as operator_name,
               u.company_name as operator_company
        FROM tours t
        LEFT JOIN tour_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.operator_id = u.id
        WHERE t.id = $1
      `, [id])

      if (result.rows.length === 0) {
        return null
      }

      const tour = result.rows[0]

      // Get additional tour data
      const inclusions = await this.getTourInclusions(id)
      const requirements = await this.getTourRequirements(id)
      const recommendations = await this.getTourRecommendations(id)
      const highlights = await this.getTourHighlights(id)

      // Enhance tour object with related data
      const enhancedTour = {
        ...tour,
        included: inclusions.filter((item: any) => item.included).map((item: any) => item.item),
        excluded: inclusions.filter((item: any) => !item.included).map((item: any) => item.item),
        requirements: requirements.map((req: any) => req.requirement),
        recommendations: recommendations.map((rec: any) => rec.recommendation),
        highlights: highlights.map((highlight: any) => highlight.highlight),
        operator: {
          id: tour.operator_id,
          fullName: tour.operator_name,
          companyName: tour.operator_company
        }
      }

      // Cache tour data
      await this.cacheManager.cacheTour(id, enhancedTour)

      return enhancedTour
    } catch (error) {
      logger.error('Failed to find tour by ID', {
        tourId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Find tour by slug
   */
  async findBySlug(slug: string): Promise<Tour | null> {
    try {
      const result = await query(`
        SELECT t.*,
               tc.name as category_name,
               tc.slug as category_slug,
               u.full_name as operator_name,
               u.company_name as operator_company
        FROM tours t
        LEFT JOIN tour_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.operator_id = u.id
        WHERE t.slug = $1
      `, [slug.toLowerCase()])

      if (result.rows.length === 0) {
        return null
      }

      const tour = result.rows[0]

      // Get additional tour data
      const inclusions = await this.getTourInclusions(tour.id)
      const requirements = await this.getTourRequirements(tour.id)
      const recommendations = await this.getTourRecommendations(tour.id)
      const highlights = await this.getTourHighlights(tour.id)

      // Enhance tour object with related data
      const enhancedTour = {
        ...tour,
        included: inclusions.filter((item: any) => item.included).map((item: any) => item.item),
        excluded: inclusions.filter((item: any) => !item.included).map((item: any) => item.item),
        requirements: requirements.map((req: any) => req.requirement),
        recommendations: recommendations.map((rec: any) => rec.recommendation),
        highlights: highlights.map((highlight: any) => highlight.highlight),
        operator: {
          id: tour.operator_id,
          fullName: tour.operator_name,
          companyName: tour.operator_company
        }
      }

      return enhancedTour
    } catch (error) {
      logger.error('Failed to find tour by slug', {
        slug,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Update tour
   */
  async update(id: string, updateData: UpdateTourData): Promise<Tour | null> {
    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramCount = 0

      // Handle special mapping from camelCase to snake_case
      const fieldMappings: Record<string, string> = {
        'shortDescription': 'short_description',
        'categoryId': 'category_id',
        'pricePerPerson': 'price_per_person',
        'durationDays': 'duration_days',
        'durationHours': 'duration_hours',
        'durationMinutes': 'duration_minutes',
        'frequencyType': 'frequency_type',
        'frequencyPattern': 'frequency_pattern',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'availableDays': 'available_days',
        'country': 'country',
        'region': 'region',
        'city': 'city',
        'coordinatesLat': 'coordinates_lat',
        'coordinatesLng': 'coordinates_lng',
        'maxParticipants': 'max_participants',
        'minParticipants': 'min_participants',
        'currentParticipants': 'current_participants',
        'isPrivate': 'is_private',
        'primaryImage': 'primary_image',
        'videoUrl': 'video_url',
        'metaTitle': 'meta_title',
        'metaDescription': 'meta_description',
        'averageRating': 'average_rating',
        'reviewCount': 'review_count',
        'viewCount': 'view_count',
        'bookingCount': 'booking_count',
        'conversionRate': 'conversion_rate',
        'minAge': 'min_age',
        'maxAge': 'max_age',
        'requiresAdultSupervision': 'requires_adult_supervision',
        'adultRequired': 'adult_required'
      }

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++
          const dbField = fieldMappings[key] || this.camelToSnake(key)
          updateFields.push(`${dbField} = $${paramCount}`)
          values.push(value)
        }
      })

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update')
      }

      values.push(id) // Add ID for WHERE clause

      const result = await query(`
        UPDATE tours 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount + 1}
        RETURNING *;
      `, values)

      if (result.rows.length === 0) {
        return null
      }

      const tour = result.rows[0]

      // Update cache
      await this.cacheManager.cacheTour(id, tour)
      await this.cacheManager.invalidateTour(id)

      logger.info('Tour updated successfully', {
        tourId: id,
        updatedFields: Object.keys(updateData)
      })

      return tour
    } catch (error) {
      logger.error('Failed to update tour', {
        tourId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Delete tour (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE tours SET status = $1, updated_at = NOW() WHERE id = $2',
        ['archived', id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateTour(id)

      logger.info('Tour deleted (archived)', {
        tourId: id
      })

      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete tour', {
        tourId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Find tours with filters and pagination
   */
  async findMany(
    filters: TourFilters = {},
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Tour>> {
    try {
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      let paramCount = 0

      // Apply filters
      if (filters.status) {
        paramCount++
        whereClause += ` AND t.status = $${paramCount}`
        queryParams.push(filters.status)
      }

      if (filters.type) {
        paramCount++
        whereClause += ` AND t.type = $${paramCount}`
        queryParams.push(filters.type)
      }

      if (filters.category) {
        paramCount++
        whereClause += ` AND t.category_id = $${paramCount}`
        queryParams.push(filters.category)
      }

      if (filters.operator) {
        paramCount++
        whereClause += ` AND t.operator_id = $${paramCount}`
        queryParams.push(filters.operator)
      }

      if (filters.difficulty) {
        paramCount++
        whereClause += ` AND t.difficulty = $${paramCount}`
        queryParams.push(filters.difficulty)
      }

      if (filters.priceMin !== undefined) {
        paramCount++
        whereClause += ` AND t.base_price >= $${paramCount}`
        queryParams.push(filters.priceMin)
      }

      if (filters.priceMax !== undefined) {
        paramCount++
        whereClause += ` AND t.base_price <= $${paramCount}`
        queryParams.push(filters.priceMax)
      }

      if (filters.location) {
        paramCount++
        whereClause += ` AND (t.city ILIKE $${paramCount} OR t.country ILIKE $${paramCount} OR t.region ILIKE $${paramCount})`
        queryParams.push(`%${filters.location}%`)
      }

      if (filters.tags && filters.tags.length > 0) {
        paramCount++
        whereClause += ` AND t.tags && $${paramCount}`
        queryParams.push(filters.tags)
      }

      if (filters.ratingMin !== undefined) {
        paramCount++
        whereClause += ` AND t.average_rating >= $${paramCount}`
        queryParams.push(filters.ratingMin)
      }

      // Build ORDER BY clause
      const sortBy = pagination.sortBy || 'created_at'
      const sortOrder = pagination.sortOrder || 'desc'
      const validSortFields = ['created_at', 'updated_at', 'title', 'base_price', 'average_rating', 'view_count', 'booking_count']

      const orderBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'

      // Calculate pagination
      const page = Math.max(1, pagination.page)
      const limit = Math.min(100, Math.max(1, pagination.limit))
      const offset = (page - 1) * limit

      paramCount++
      queryParams.push(limit)
      paramCount++
      queryParams.push(offset)

      // Main query
      const queryText = `
        SELECT 
          t.*,
          tc.name as category_name,
          u.full_name as operator_name,
          COUNT(*) OVER() as total_count
        FROM tours t
        LEFT JOIN tour_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.operator_id = u.id
        ${whereClause}
        ORDER BY t.${orderBy} ${sortOrder}
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `

      const result = await query(queryText, queryParams)

      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0
      const totalPages = Math.ceil(total / limit)

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    } catch (error) {
      logger.error('Failed to find tours', {
        filters,
        pagination,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Search tours
   */
  async search(searchParams: TourSearchParams, pagination: PaginationOptions): Promise<PaginatedResult<Tour>> {
    try {
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      let paramCount = 0

      // Text search
      if (searchParams.query) {
        paramCount++
        whereClause += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount} OR t.short_description ILIKE $${paramCount})`
        queryParams.push(`%${searchParams.query}%`)
      }

      // Apply other filters
      if (searchParams.type) {
        paramCount++
        whereClause += ` AND t.type = $${paramCount}`
        queryParams.push(searchParams.type)
      }

      if (searchParams.location) {
        paramCount++
        whereClause += ` AND (t.city ILIKE $${paramCount} OR t.country ILIKE $${paramCount})`
        queryParams.push(`%${searchParams.location}%`)
      }

      if (searchParams.priceMin !== undefined) {
        paramCount++
        whereClause += ` AND t.base_price >= $${paramCount}`
        queryParams.push(searchParams.priceMin)
      }

      if (searchParams.priceMax !== undefined) {
        paramCount++
        whereClause += ` AND t.base_price <= $${paramCount}`
        queryParams.push(searchParams.priceMax)
      }

      if (searchParams.duration) {
        paramCount++
        whereClause += ` AND (t.duration_days * 24 + t.duration_hours) BETWEEN $${paramCount} AND $${paramCount + 1}`
        queryParams.push(searchParams.duration.min, searchParams.duration.max)
        paramCount++
      }

      if (searchParams.difficulty) {
        paramCount++
        whereClause += ` AND t.difficulty = $${paramCount}`
        queryParams.push(searchParams.difficulty)
      }

      if (searchParams.rating !== undefined) {
        paramCount++
        whereClause += ` AND t.average_rating >= $${paramCount}`
        queryParams.push(searchParams.rating)
      }

      if (searchParams.tags && searchParams.tags.length > 0) {
        paramCount++
        whereClause += ` AND t.tags && $${paramCount}`
        queryParams.push(searchParams.tags)
      }

      // Calculate pagination
      const page = Math.max(1, pagination.page)
      const limit = Math.min(100, Math.max(1, pagination.limit))
      const offset = (page - 1) * limit

      paramCount++
      queryParams.push(limit)
      paramCount++
      queryParams.push(offset)

      // Build ORDER BY clause
      let orderBy = 't.created_at'
      let sortOrder = 'desc'

      if (searchParams.sortBy) {
        const sortFields: Record<string, string> = {
          'price': 't.base_price',
          'rating': 't.average_rating',
          'popularity': 't.view_count',
          'duration': '(t.duration_days * 24 + t.duration_hours)',
          'created': 't.created_at'
        }
        
        const sortField = sortFields[searchParams.sortBy] || 't.created_at'
        orderBy = sortField
        sortOrder = searchParams.sortOrder || 'desc'
      }

      // Main query
      const queryText = `
        SELECT 
          t.*,
          tc.name as category_name,
          u.full_name as operator_name,
          COUNT(*) OVER() as total_count
        FROM tours t
        LEFT JOIN tour_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.operator_id = u.id
        ${whereClause}
        ORDER BY ${orderBy} ${sortOrder}
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `

      const result = await query(queryText, queryParams)

      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0
      const totalPages = Math.ceil(total / limit)

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    } catch (error) {
      logger.error('Failed to search tours', {
        searchParams,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Get tour statistics
   */
  async getStatistics(): Promise<TourStats> {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_tours,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tours,
          COALESCE(SUM(booking_count), 0) as total_bookings,
          COALESCE(SUM(base_price * booking_count), 0) as total_revenue,
          COALESCE(AVG(average_rating), 0) as average_rating,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END), 0) as recent_bookings
        FROM tours
      `)

      // Get top categories
      const categoryResult = await query(`
        SELECT 
          tc.name as category,
          COUNT(t.id) as count
        FROM tour_categories tc
        LEFT JOIN tours t ON tc.id = t.category_id
        WHERE t.status = 'active'
        GROUP BY tc.name
        ORDER BY count DESC
        LIMIT 5
      `)

      return {
        totalTours: parseInt(result.rows[0].total_tours),
        activeTours: parseInt(result.rows[0].active_tours),
        totalBookings: parseInt(result.rows[0].total_bookings),
        totalRevenue: parseFloat(result.rows[0].total_revenue),
        averageRating: parseFloat(result.rows[0].average_rating),
        recentBookings: parseInt(result.rows[0].recent_bookings),
        topCategories: categoryResult.rows
      }
    } catch (error) {
      logger.error('Failed to get tour statistics', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await query(
        'UPDATE tours SET view_count = view_count + 1 WHERE id = $1',
        [id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateTour(id)
    } catch (error) {
      logger.error('Failed to increment view count', {
        tourId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Update booking count
   */
  async updateBookingCount(id: string, change: number = 1): Promise<void> {
    try {
      await query(
        'UPDATE tours SET booking_count = GREATEST(0, booking_count + $1) WHERE id = $2',
        [change, id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateTour(id)
    } catch (error) {
      logger.error('Failed to update booking count', {
        tourId: id,
        change,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Update rating
   */
  async updateRating(id: string, averageRating: number, reviewCount: number): Promise<void> {
    try {
      await query(
        'UPDATE tours SET average_rating = $1, review_count = $2 WHERE id = $3',
        [averageRating, reviewCount, id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateTour(id)
    } catch (error) {
      logger.error('Failed to update rating', {
        tourId: id,
        averageRating,
        reviewCount,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Get featured tours
   */
  async getFeaturedTours(limit: number = 10): Promise<Tour[]> {
    try {
      const result = await query(`
        SELECT t.*,
               tc.name as category_name,
               u.full_name as operator_name
        FROM tours t
        LEFT JOIN tour_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.operator_id = u.id
        WHERE t.status = 'active'
        AND t.view_count > 0
        ORDER BY 
          t.average_rating DESC,
          t.view_count DESC,
          t.booking_count DESC
        LIMIT $1
      `, [limit])

      return result.rows
    } catch (error) {
      logger.error('Failed to get featured tours', {
        limit,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Get similar tours
   */
  async getSimilarTours(tourId: string, limit: number = 5): Promise<Tour[]> {
    try {
      const result = await query(`
        SELECT t.*,
               tc.name as category_name,
               u.full_name as operator_name
        FROM tours t
        LEFT JOIN tour_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.operator_id = u.id
        WHERE t.id != $1
        AND t.status = 'active'
        AND (t.category_id = (
          SELECT category_id FROM tours WHERE id = $1
        ) OR t.type = (
          SELECT type FROM tours WHERE id = $1
        ))
        ORDER BY 
          t.average_rating DESC,
          t.booking_count DESC
        LIMIT $2
      `, [tourId, limit])

      return result.rows
    } catch (error) {
      logger.error('Failed to get similar tours', {
        tourId,
        limit,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  // Helper methods for related data

  private async getTourInclusions(tourId: string): Promise<any[]> {
    const result = await query(
      'SELECT item, included FROM tour_inclusions WHERE tour_id = $1 ORDER BY included DESC, item',
      [tourId]
    )
    return result.rows
  }

  private async getTourRequirements(tourId: string): Promise<any[]> {
    const result = await query(
      'SELECT requirement FROM tour_requirements WHERE tour_id = $1 ORDER BY requirement',
      [tourId]
    )
    return result.rows
  }

  private async getTourRecommendations(tourId: string): Promise<any[]> {
    const result = await query(
      'SELECT recommendation FROM tour_recommendations WHERE tour_id = $1 ORDER BY recommendation',
      [tourId]
    )
    return result.rows
  }

  private async getTourHighlights(tourId: string): Promise<any[]> {
    const result = await query(
      'SELECT highlight FROM tour_highlights WHERE tour_id = $1 ORDER BY highlight',
      [tourId]
    )
    return result.rows
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}

export default TourModel