import { Router, Request, Response } from 'express'
import { query } from '@/database/connection'
import { asyncHandler, validateRequired, validateTypes } from '@/middleware/errorHandler'
import { authorize } from '@/middleware/auth'
import { CacheManager } from '@/services/CacheManager'

const router = Router()
const cacheManager = CacheManager.getInstance()

/**
 * @route   GET /bookings
 * @desc    Get user bookings
 * @access  Private
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'booking_date',
    sortOrder = 'desc'
  } = req.query

  // Build query
  let whereClause = 'WHERE bookings.user_id = $1'
  const queryParams: any[] = [user.userId]
  let paramCount = 1

  if (status) {
    paramCount++
    whereClause += ` AND bookings.status = $${paramCount}`
    queryParams.push(status)
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
      tours.primary_image as tour_image,
      tours.base_price as tour_price,
      users.full_name as operator_name,
      COUNT(*) OVER() as total_count
    FROM bookings
    LEFT JOIN tours ON bookings.tour_id = tours.id
    LEFT JOIN users ON tours.operator_id = users.id
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
 * @route   GET /bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params

  const queryResult = await query(`
    SELECT 
      bookings.*,
      tours.title as tour_title,
      tours.slug as tour_slug,
      tours.primary_image as tour_image,
      tours.base_price as tour_price,
      tours.duration_hours as tour_duration,
      tours.start_time as tour_start_time,
      users.full_name as operator_name,
      booking_participants.*
    FROM bookings
    LEFT JOIN tours ON bookings.tour_id = tours.id
    LEFT JOIN users ON tours.operator_id = users.id
    LEFT JOIN booking_participants ON bookings.id = booking_participants.booking_id
    WHERE bookings.id = $1 AND bookings.user_id = $2
  `, [id, user.userId])

  if (queryResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
      code: 'BOOKING_NOT_FOUND'
    })
  }

  // Group participants by booking
  const booking = queryResult.rows[0]
  const participants = queryResult.rows.map(row => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    age: row.age,
    gender: row.gender,
    nationality: row.nationality,
    passportNumber: row.passport_number,
    passportExpiry: row.passport_expiry,
    dietaryRestrictions: row.dietary_restrictions,
    medicalConditions: row.medical_conditions,
    tshirtSize: row.tshirt_size,
    isPrimary: row.is_primary
  })).filter(p => p.id)

  const result = {
    success: true,
    data: {
      ...booking,
      participants
    }
  }

  res.json(result)
}))

/**
 * @route   POST /bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const {
    tourId,
    tourDate,
    participants,
    primaryContact,
    specialRequests,
    dietaryRestrictions,
    communicationPreference
  } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, [
    'tourId', 'tourDate', 'participants', 'primaryContact'
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
    tourId: 'string',
    tourDate: 'string',
    participants: 'array',
    primaryContact: 'object',
    specialRequests: 'string',
    dietaryRestrictions: 'string',
    communicationPreference: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one participant is required',
      code: 'INVALID_PARTICIPANTS'
    })
  }

  // Validate tour exists and is available
  const tourQuery = await query(
    'SELECT id, title, base_price, max_participants FROM tours WHERE id = $1 AND status = $2',
    [tourId, 'active']
  )

  if (tourQuery.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Tour not found or not available',
      code: 'TOUR_NOT_AVAILABLE'
    })
  }

  const tour = tourQuery.rows[0]

  if (participants.length > tour.max_participants) {
    return res.status(400).json({
      success: false,
      message: `Maximum ${tour.max_participants} participants allowed for this tour`,
      code: 'TOO_MANY_PARTICIPANTS',
      details: { maxParticipants: tour.max_participants, requested: participants.length }
    })
  }

  // Generate booking number
  const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

  // Calculate total price
  const totalPrice = tour.base_price * participants.length

  // Create booking in transaction
  const bookingResult = await query(`
    INSERT INTO bookings (
      booking_number, user_id, tour_id, status, total_participants,
      booking_date, tour_date, primary_contact, special_requests,
      dietary_restrictions, communication_preference, source,
      created_at, updated_at
    ) VALUES ($1, $2, $3, 'pending', $4, NOW(), $5, $6, $7, $8, $9, 'website', NOW(), NOW())
    RETURNING *
  `, [
    bookingNumber, user.userId, tourId, participants.length, tourDate,
    JSON.stringify(primaryContact), specialRequests, dietaryRestrictions, communicationPreference
  ])

  const booking = bookingResult.rows[0]

  // Insert participants
  const participantInserts = participants.map((participant: any, index: number) => `
    ($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, 
     $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8})
  `).join(', ')

  const participantParams = participants.flatMap((participant: any) => [
    booking.id,
    participant.firstName || '',
    participant.lastName || '',
    participant.email || '',
    participant.phone || '',
    participant.dateOfBirth || null,
    participant.dietaryRestrictions || '',
    participant.isPrimary === true
  ])

  if (participantInserts) {
    await query(`
      INSERT INTO booking_participants (
        booking_id, first_name, last_name, email, phone, 
        date_of_birth, dietary_restrictions, is_primary
      ) VALUES ${participantInserts}
    `, participantParams)
  }

  // Invalidate cache
  await cacheManager.invalidateUser(user.userId)

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  })
}))

/**
 * @route   PUT /bookings/:id
 * @desc    Update booking
 * @access  Private
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params
  const { status, specialRequests, dietaryRestrictions, communicationPreference } = req.body

  // Check if booking belongs to user
  const bookingQuery = await query(
    'SELECT user_id FROM bookings WHERE id = $1',
    [id]
  )

  if (bookingQuery.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
      code: 'BOOKING_NOT_FOUND'
    })
  }

  const booking = bookingQuery.rows[0]
  if (booking.user_id !== user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this booking',
      code: 'NOT_AUTHORIZED'
    })
  }

  // Build update query
  const updates: any = {}
  if (status !== undefined) updates.status = status
  if (specialRequests !== undefined) updates.special_requests = specialRequests
  if (dietaryRestrictions !== undefined) updates.dietary_restrictions = dietaryRestrictions
  if (communicationPreference !== undefined) updates.communication_preference = communicationPreference

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
    `UPDATE bookings SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  )

  // Invalidate cache
  await cacheManager.invalidateBooking(id)
  await cacheManager.invalidateUser(user.userId)

  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: result.rows[0]
  })
}))

/**
 * @route   DELETE /bookings/:id
 * @desc    Cancel booking
 * @access  Private
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params

  // Check if booking belongs to user
  const bookingQuery = await query(
    'SELECT user_id FROM bookings WHERE id = $1',
    [id]
  )

  if (bookingQuery.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
      code: 'BOOKING_NOT_FOUND'
    })
  }

  const booking = bookingQuery.rows[0]
  if (booking.user_id !== user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking',
      code: 'NOT_AUTHORIZED'
    })
  }

  // Update booking status to cancelled
  await query(
    'UPDATE bookings SET status = $1, cancelled_at = NOW(), updated_at = NOW() WHERE id = $2',
    ['cancelled', id]
  )

  // Invalidate cache
  await cacheManager.invalidateBooking(id)
  await cacheManager.invalidateUser(user.userId)

  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  })
}))

export default router