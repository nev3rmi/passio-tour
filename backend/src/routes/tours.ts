import { Router, Request, Response } from 'express'
import { query } from '@/database/connection'
import { asyncHandler, validateRequired, validateTypes } from '@/middleware/errorHandler'
import { authorize } from '@/middleware/auth'
import { CacheManager } from '@/services/CacheManager'

const router = Router()
const cacheManager = CacheManager.getInstance()

/**
 * @route   GET /tours
 * @desc    Get all tours with filters
 * @access  Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    category,
    type,
    minPrice,
    maxPrice,
    location,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query

  // Build cache key
  const cacheKey = `tours:${JSON.stringify(req.query)}`
  
  // Try cache first
  let result = await cacheManager.get(cacheKey)
  
  if (!result) {
    // Build query
    let whereClause = "WHERE tours.status = 'active'"
    const queryParams: any[] = []
    let paramCount = 0

    // Add filters
    if (category) {
      paramCount++
      whereClause += ` AND tour_categories.slug = $${paramCount}`
      queryParams.push(category)
    }

    if (type) {
      paramCount++
      whereClause += ` AND tours.type = $${paramCount}`
      queryParams.push(type)
    }

    if (minPrice) {
      paramCount++
      whereClause += ` AND tours.base_price >= $${paramCount}`
      queryParams.push(parseFloat(minPrice as string))
    }

    if (maxPrice) {
      paramCount++
      whereClause += ` AND tours.base_price <= $${paramCount}`
      queryParams.push(parseFloat(maxPrice as string))
    }

    if (location) {
      paramCount++
      whereClause += ` AND (tours.city ILIKE $${paramCount} OR tours.country ILIKE $${paramCount})`
      queryParams.push(`%${location}%`)
    }

    if (search) {
      paramCount++
      whereClause += ` AND (tours.title ILIKE $${paramCount} OR tours.description ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    // Build ORDER BY clause
    const validSortFields = ['title', 'base_price', 'created_at', 'average_rating']
    const validSortOrders = ['asc', 'desc']
    
    const orderBy = validSortFields.includes(sortBy as string) ? sortBy : 'created_at'
    const order = validSortOrders.includes((sortOrder as string).toLowerCase()) ? sortOrder.toLowerCase() : 'desc'

    // Calculate pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    paramCount++
    queryParams.push(limitNum)
    paramCount++
    queryParams.push(offset)

    const mainQuery = `
      SELECT 
        tours.*,
        tour_categories.name as category_name,
        tour_categories.slug as category_slug,
        users.full_name as operator_name,
        COUNT(*) OVER() as total_count
      FROM tours
      LEFT JOIN tour_categories ON tours.category_id = tour_categories.id
      LEFT JOIN users ON tours.operator_id = users.id
      ${whereClause}
      ORDER BY tours.${orderBy} ${order}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `

    const queryResult = await query(mainQuery, queryParams)
    
    if (queryResult.rows.length === 0) {
      result = {
        success: true,
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0
        }
      }
    } else {
      const total = parseInt(queryResult.rows[0].total_count)
      const totalPages = Math.ceil(total / limitNum)

      result = {
        success: true,
        data: queryResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      }

      // Cache for 30 minutes
      await cacheManager.set('tours', cacheKey, result, 1800)
    }
  }

  res.json(result)
}))

/**
 * @route   GET /tours/:id
 * @desc    Get tour by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  // Try cache first
  let result = await cacheManager.getTour(id)
  
  if (!result) {
    const queryResult = await query(`
      SELECT 
        tours.*,
        tour_categories.name as category_name,
        tour_categories.slug as category_slug,
        users.full_name as operator_name,
        users.email as operator_email
      FROM tours
      LEFT JOIN tour_categories ON tours.category_id = tour_categories.id
      LEFT JOIN users ON tours.operator_id = users.id
      WHERE tours.id = $1
    `, [id])

    if (queryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found',
        code: 'TOUR_NOT_FOUND'
      })
    }

    result = {
      success: true,
      data: queryResult.rows[0]
    }

    // Cache for 1 hour
    await cacheManager.cacheTour(id, result)
  }

  res.json(result)
}))

/**
 * @route   POST /tours
 * @desc    Create new tour
 * @access  Private (Tour Operator/Admin)
 */
router.post('/', authorize('tour_operator', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const {
    title,
    description,
    shortDescription,
    categoryId,
    type,
    basePrice,
    durationHours,
    maxParticipants,
    country,
    city,
    startTime
  } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, [
    'title', 'description', 'type', 'basePrice', 
    'durationHours', 'maxParticipants', 'country', 'city', 'startTime'
  ])
  if (requiredError) {
    return res.status(400).json({
      success: false,
      message: requiredError.message,
      code: requiredError.code,
      details: requiredError.details
    })
  }

  // Validate field types
  const typeError = validateTypes(req.body, {
    title: 'string',
    description: 'string',
    shortDescription: 'string',
    type: 'string',
    basePrice: 'number',
    durationHours: 'number',
    maxParticipants: 'number',
    country: 'string',
    city: 'string',
    startTime: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  // Generate slug from title
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const queryResult = await query(`
    INSERT INTO tours (
      title, description, short_description, slug, type, operator_id,
      base_price, duration_hours, max_participants, country, city, start_time,
      status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', NOW(), NOW())
    RETURNING *
  `, [
    title, description, shortDescription, slug, type, user.userId,
    basePrice, durationHours, maxParticipants, country, city, startTime
  ])

  const newTour = queryResult.rows[0]

  // Invalidate tours cache
  await cacheManager.invalidatePattern('tours:*')

  res.status(201).json({
    success: true,
    message: 'Tour created successfully',
    data: newTour
  })
}))

/**
 * @route   PUT /tours/:id
 * @desc    Update tour
 * @access  Private (Tour Owner/Admin)
 */
router.put('/:id', authorize('tour_operator', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params
  const {
    title,
    description,
    shortDescription,
    categoryId,
    type,
    basePrice,
    durationHours,
    maxParticipants,
    country,
    city,
    startTime,
    status
  } = req.body

  // Check if user owns the tour or is admin
  const tourQuery = await query('SELECT operator_id FROM tours WHERE id = $1', [id])
  if (tourQuery.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Tour not found',
      code: 'TOUR_NOT_FOUND'
    })
  }

  const tour = tourQuery.rows[0]
  if (tour.operator_id !== user.userId && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this tour',
      code: 'NOT_AUTHORIZED'
    })
  }

  // Build update query dynamically
  const updates: any = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (shortDescription !== undefined) updates.short_description = shortDescription
  if (type !== undefined) updates.type = type
  if (basePrice !== undefined) updates.base_price = basePrice
  if (durationHours !== undefined) updates.duration_hours = durationHours
  if (maxParticipants !== undefined) updates.max_participants = maxParticipants
  if (country !== undefined) updates.country = country
  if (city !== undefined) updates.city = city
  if (startTime !== undefined) updates.start_time = startTime
  if (status !== undefined) updates.status = status

  const updateFields = Object.keys(updates)
  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update',
      code: 'NO_VALID_FIELDS'
    })
  }

  const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ')
  const values = updateFields.map(field => updates[field])

  const result = await query(
    `UPDATE tours SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  )

  // Invalidate caches
  await cacheManager.invalidateTour(id)
  await cacheManager.invalidatePattern('tours:*')

  res.json({
    success: true,
    message: 'Tour updated successfully',
    data: result.rows[0]
  })
}))

/**
 * @route   DELETE /tours/:id
 * @desc    Delete tour
 * @access  Private (Tour Owner/Admin)
 */
router.delete('/:id', authorize('tour_operator', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params

  // Check if user owns the tour or is admin
  const tourQuery = await query('SELECT operator_id FROM tours WHERE id = $1', [id])
  if (tourQuery.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Tour not found',
      code: 'TOUR_NOT_FOUND'
    })
  }

  const tour = tourQuery.rows[0]
  if (tour.operator_id !== user.userId && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this tour',
      code: 'NOT_AUTHORIZED'
    })
  }

  await query('DELETE FROM tours WHERE id = $1', [id])

  // Invalidate caches
  await cacheManager.invalidateTour(id)
  await cacheManager.invalidatePattern('tours:*')

  res.json({
    success: true,
    message: 'Tour deleted successfully'
  })
}))

export default router