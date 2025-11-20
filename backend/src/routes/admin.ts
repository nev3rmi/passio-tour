import { Router, Request, Response } from 'express'
import { query } from '@/database/connection'
import { asyncHandler, validateRequired, validateTypes } from '@/middleware/errorHandler'
import { authorize } from '@/middleware/auth'
import { CacheManager } from '@/services/CacheManager'

const router = Router()
const cacheManager = CacheManager.getInstance()

/**
 * @route   GET /admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  // Get dashboard statistics
  const statsQuery = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
      (SELECT COUNT(*) FROM tours WHERE status = 'active') as total_tours,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as total_bookings,
      (SELECT COALESCE(SUM(payments.amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
      (SELECT COUNT(*) FROM bookings WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days') as bookings_last_30_days,
      (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
  `)

  const stats = statsQuery.rows[0]

  // Get recent bookings
  const recentBookingsQuery = await query(`
    SELECT 
      bookings.*,
      tours.title as tour_title,
      users.full_name as customer_name,
      users.email as customer_email
    FROM bookings
    LEFT JOIN tours ON bookings.tour_id = tours.id
    LEFT JOIN users ON bookings.user_id = users.id
    ORDER BY bookings.booking_date DESC
    LIMIT 10
  `)

  // Get recent users
  const recentUsersQuery = await query(`
    SELECT id, email, full_name, role, status, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `)

  res.json({
    success: true,
    data: {
      statistics: {
        totalUsers: parseInt(stats.total_users),
        totalTours: parseInt(stats.total_tours),
        totalBookings: parseInt(stats.total_bookings),
        totalRevenue: parseFloat(stats.total_revenue),
        bookingsLast30Days: parseInt(stats.bookings_last_30_days),
        newUsersLast30Days: parseInt(stats.new_users_last_30_days)
      },
      recentBookings: recentBookingsQuery.rows,
      recentUsers: recentUsersQuery.rows
    }
  })
}))

/**
 * @route   GET /admin/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/users', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    role,
    status,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query

  // Build query
  let whereClause = 'WHERE 1=1'
  const queryParams: any[] = []
  let paramCount = 0

  // Add filters
  if (role) {
    paramCount++
    whereClause += ` AND role = $${paramCount}`
    queryParams.push(role)
  }

  if (status) {
    paramCount++
    whereClause += ` AND status = $${paramCount}`
    queryParams.push(status)
  }

  if (search) {
    paramCount++
    whereClause += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
    queryParams.push(`%${search}%`)
  }

  // Calculate pagination
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const offset = (pageNum - 1) * limitNum

  paramCount++
  queryParams.push(limitNum)
  paramCount++
  queryParams.push(offset)

  const queryResult = await query(`
    SELECT 
      id, email, full_name, first_name, last_name, role, status, 
      email_verified, phone_verified, last_login_at, created_at,
      COUNT(*) OVER() as total_count
    FROM users
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `, queryParams)

  if (queryResult.rows.length === 0) {
    return res.json({
      success: true,
      data: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0
      }
    })
  }

  const total = parseInt(queryResult.rows[0].total_count)
  const totalPages = Math.ceil(total / limitNum)

  res.json({
    success: true,
    data: queryResult.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  })
}))

/**
 * @route   GET /admin/bookings
 * @desc    Get all bookings (admin only)
 * @access  Private (Admin)
 */
router.get('/bookings', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    tourId,
    dateFrom,
    dateTo,
    sortBy = 'booking_date',
    sortOrder = 'desc'
  } = req.query

  // Build query
  let whereClause = 'WHERE 1=1'
  const queryParams: any[] = []
  let paramCount = 0

  // Add filters
  if (status) {
    paramCount++
    whereClause += ` AND bookings.status = $${paramCount}`
    queryParams.push(status)
  }

  if (tourId) {
    paramCount++
    whereClause += ` AND bookings.tour_id = $${paramCount}`
    queryParams.push(tourId)
  }

  if (dateFrom) {
    paramCount++
    whereClause += ` AND bookings.booking_date >= $${paramCount}`
    queryParams.push(dateFrom)
  }

  if (dateTo) {
    paramCount++
    whereClause += ` AND bookings.booking_date <= $${paramCount}`
    queryParams.push(dateTo)
  }

  // Calculate pagination
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const offset = (pageNum - 1) * limitNum

  paramCount++
  queryParams.push(limitNum)
  paramCount++
  queryParams.push(offset)

  const queryResult = await query(`
    SELECT 
      bookings.*,
      tours.title as tour_title,
      tours.slug as tour_slug,
      users.full_name as customer_name,
      users.email as customer_email,
      operator.full_name as operator_name,
      COUNT(*) OVER() as total_count
    FROM bookings
    LEFT JOIN tours ON bookings.tour_id = tours.id
    LEFT JOIN users ON bookings.user_id = users.id
    LEFT JOIN users as operator ON tours.operator_id = operator.id
    ${whereClause}
    ORDER BY bookings.${sortBy} ${sortOrder}
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `, queryParams)

  if (queryResult.rows.length === 0) {
    return res.json({
      success: true,
      data: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0
      }
    })
  }

  const total = parseInt(queryResult.rows[0].total_count)
  const totalPages = Math.ceil(total / limitNum)

  res.json({
    success: true,
    data: queryResult.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  })
}))

/**
 * @route   GET /admin/tours
 * @desc    Get all tours (admin only)
 * @access  Private (Admin)
 */
router.get('/tours', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    operatorId,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query

  // Build query
  let whereClause = 'WHERE 1=1'
  const queryParams: any[] = []
  let paramCount = 0

  // Add filters
  if (status) {
    paramCount++
    whereClause += ` AND tours.status = $${paramCount}`
    queryParams.push(status)
  }

  if (category) {
    paramCount++
    whereClause += ` AND tour_categories.slug = $${paramCount}`
    queryParams.push(category)
  }

  if (operatorId) {
    paramCount++
    whereClause += ` AND tours.operator_id = $${paramCount}`
    queryParams.push(operatorId)
  }

  // Calculate pagination
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const offset = (pageNum - 1) * limitNum

  paramCount++
  queryParams.push(limitNum)
  paramCount++
  queryParams.push(offset)

  const queryResult = await query(`
    SELECT 
      tours.*,
      tour_categories.name as category_name,
      tour_categories.slug as category_slug,
      users.full_name as operator_name,
      users.email as operator_email,
      COUNT(*) OVER() as total_count
    FROM tours
    LEFT JOIN tour_categories ON tours.category_id = tour_categories.id
    LEFT JOIN users ON tours.operator_id = users.id
    ${whereClause}
    ORDER BY tours.${sortBy} ${sortOrder}
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `, queryParams)

  if (queryResult.rows.length === 0) {
    return res.json({
      success: true,
      data: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0
      }
    })
  }

  const total = parseInt(queryResult.rows[0].total_count)
  const totalPages = Math.ceil(total / limitNum)

  res.json({
    success: true,
    data: queryResult.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  })
}))

/**
 * @route   PUT /admin/users/:userId/status
 * @desc    Update user status (admin only)
 * @access  Private (Admin)
 */
router.put('/users/:userId/status', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const { status } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['status'])
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
    status: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  // Validate status value
  const validStatuses = ['active', 'inactive', 'archived']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value',
      code: 'INVALID_STATUS',
      details: { validStatuses }
    })
  }

  const result = await query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, userId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    })
  }

  // Invalidate cache
  await cacheManager.invalidateUser(userId)

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: result.rows[0]
  })
}))

/**
 * @route   GET /admin/analytics
 * @desc    Get analytics data (admin only)
 * @access  Private (Admin)
 */
router.get('/analytics', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { period = '30' } = req.query // days
  
  const periodDays = parseInt(period as string)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get booking trends
  const bookingTrendsQuery = await query(`
    SELECT 
      DATE_TRUNC('day', booking_date) as date,
      COUNT(*) as bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) * AVG(tours.base_price) as revenue
    FROM bookings
    LEFT JOIN tours ON bookings.tour_id = tours.id
    WHERE booking_date >= $1
    GROUP BY DATE_TRUNC('day', booking_date)
    ORDER BY date
  `, [startDate])

  // Get user registration trends
  const userTrendsQuery = await query(`
    SELECT 
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) as new_users
    FROM users
    WHERE created_at >= $1
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date
  `, [startDate])

  // Get tour popularity
  const tourPopularityQuery = await query(`
    SELECT 
      tours.id,
      tours.title,
      COUNT(bookings.id) as booking_count,
      AVG(reviews.rating) as average_rating,
      COUNT(reviews.id) as review_count
    FROM tours
    LEFT JOIN bookings ON tours.id = bookings.tour_id AND bookings.status = 'confirmed'
    LEFT JOIN reviews ON tours.id = reviews.tour_id
    WHERE tours.created_at >= $1
    GROUP BY tours.id, tours.title
    ORDER BY booking_count DESC
    LIMIT 10
  `, [startDate])

  res.json({
    success: true,
    data: {
      period: periodDays,
      startDate: startDate.toISOString(),
      bookingTrends: bookingTrendsQuery.rows,
      userTrends: userTrendsQuery.rows,
      tourPopularity: tourPopularityQuery.rows
    }
  })
}))

export default router