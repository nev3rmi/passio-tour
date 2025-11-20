import { User } from '@/types/user'
import { query, transaction } from '@/database/connection'
import { logger } from '@/utils/logger'
import { CacheManager } from '@/services/CacheManager'

export interface CreateUserData {
  email: string
  passwordHash: string
  fullName: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
}

export interface UpdateUserData {
  fullName?: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  dateOfBirth?: Date
  gender?: string
  language?: string
  timezone?: string
  status?: string
}

export interface UserFilters {
  role?: string
  status?: string
  search?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  createdAfter?: Date
  createdBefore?: Date
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

export class UserModel {
  private cacheManager: CacheManager

  constructor() {
    this.cacheManager = CacheManager.getInstance()
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const result = await query(`
        INSERT INTO users (
          email, password_hash, full_name, first_name, last_name, phone, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `, [
        userData.email.toLowerCase(),
        userData.passwordHash,
        userData.fullName,
        userData.firstName || null,
        userData.lastName || null,
        userData.phone || null,
        userData.role || 'customer'
      ])

      const user = result.rows[0]

      // Create default user preferences
      await query(
        'INSERT INTO user_preferences (user_id) VALUES ($1)',
        [user.id]
      )

      // Cache user data
      await this.cacheManager.cacheUser(user.id, user)

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      })

      return user
    } catch (error) {
      logger.error('Failed to create user', {
        email: userData.email,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      // Try cache first
      const cachedUser = await this.cacheManager.getUser(id)
      if (cachedUser) {
        return cachedUser
      }

      const result = await query(`
        SELECT u.*, 
               COALESCE(json_build_object(
                 'emailNotifications', up.email_notifications,
                 'smsNotifications', up.sms_notifications,
                 'pushNotifications', up.push_notifications,
                 'marketing', up.marketing,
                 'currency', up.currency,
                 'dateFormat', up.date_format,
                 'timeFormat', up.time_format,
                 'theme', up.theme
               ), '{}') as preferences
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.id = $1
      `, [id])

      if (result.rows.length === 0) {
        return null
      }

      const user = result.rows[0]

      // Cache user data
      await this.cacheManager.cacheUser(id, user)

      return user
    } catch (error) {
      logger.error('Failed to find user by ID', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(`
        SELECT u.*, 
               COALESCE(json_build_object(
                 'emailNotifications', up.email_notifications,
                 'smsNotifications', up.sms_notifications,
                 'pushNotifications', up.push_notifications,
                 'marketing', up.marketing,
                 'currency', up.currency,
                 'dateFormat', up.date_format,
                 'timeFormat', up.time_format,
                 'theme', up.theme
               ), '{}') as preferences
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.email = $1
      `, [email.toLowerCase()])

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to find user by email', {
        email,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Update user
   */
  async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramCount = 0

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++
          const dbField = this.camelToSnake(key)
          updateFields.push(`${dbField} = $${paramCount}`)
          values.push(value)
        }
      })

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update')
      }

      values.push(id) // Add ID for WHERE clause

      const result = await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount + 1}
        RETURNING *;
      `, values)

      if (result.rows.length === 0) {
        return null
      }

      const user = result.rows[0]

      // Update cache
      await this.cacheManager.cacheUser(id, user)
      await this.cacheManager.invalidateUser(id)

      logger.info('User updated successfully', {
        userId: id,
        updatedFields: Object.keys(updateData)
      })

      return user
    } catch (error) {
      logger.error('Failed to update user', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Delete user (soft delete by setting status to archived)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        ['archived', id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateUser(id)

      logger.info('User deleted (archived)', {
        userId: id
      })

      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to delete user', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Find users with filters and pagination
   */
  async findMany(
    filters: UserFilters = {},
    pagination: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    try {
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      let paramCount = 0

      // Apply filters
      if (filters.role) {
        paramCount++
        whereClause += ` AND role = $${paramCount}`
        queryParams.push(filters.role)
      }

      if (filters.status) {
        paramCount++
        whereClause += ` AND status = $${paramCount}`
        queryParams.push(filters.status)
      }

      if (filters.search) {
        paramCount++
        whereClause += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
        queryParams.push(`%${filters.search}%`)
      }

      if (filters.emailVerified !== undefined) {
        paramCount++
        whereClause += ` AND email_verified = $${paramCount}`
        queryParams.push(filters.emailVerified)
      }

      if (filters.phoneVerified !== undefined) {
        paramCount++
        whereClause += ` AND phone_verified = $${paramCount}`
        queryParams.push(filters.phoneVerified)
      }

      if (filters.createdAfter) {
        paramCount++
        whereClause += ` AND created_at >= $${paramCount}`
        queryParams.push(filters.createdAfter)
      }

      if (filters.createdBefore) {
        paramCount++
        whereClause += ` AND created_at <= $${paramCount}`
        queryParams.push(filters.createdBefore)
      }

      // Build ORDER BY clause
      const sortBy = pagination.sortBy || 'created_at'
      const sortOrder = pagination.sortOrder || 'desc'
      const validSortFields = ['created_at', 'updated_at', 'full_name', 'email', 'last_login_at']

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
          u.*,
          COUNT(*) OVER() as total_count
        FROM users u
        ${whereClause}
        ORDER BY u.${orderBy} ${sortOrder}
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
      logger.error('Failed to find users', {
        filters,
        pagination,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Update user login information
   */
  async updateLoginInfo(id: string, ip?: string, userAgent?: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET last_login_at = NOW(), login_attempts = 0, locked_until = NULL WHERE id = $1',
        [id]
      )

      // Invalidate cache to get fresh data on next request
      await this.cacheManager.invalidateUser(id)
    } catch (error) {
      logger.error('Failed to update user login info', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(id: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // Get current attempts
        const userResult = await client.query(
          'SELECT login_attempts FROM users WHERE id = $1',
          [id]
        )

        if (userResult.rows.length === 0) {
          throw new Error('User not found')
        }

        const currentAttempts = userResult.rows[0].login_attempts || 0
        const newAttempts = currentAttempts + 1
        const shouldLock = newAttempts >= 5

        await client.query(
          'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $2',
          [
            newAttempts,
            shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // Lock for 30 minutes
            id
          ]
        )
      })
    } catch (error) {
      logger.error('Failed to increment failed login attempts', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedAttempts(id: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1',
        [id]
      )
    } catch (error) {
      logger.error('Failed to reset failed login attempts', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(id: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1',
        [id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateUser(id)

      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to verify email', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Verify phone
   */
  async verifyPhone(id: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET phone_verified = TRUE, updated_at = NOW() WHERE id = $1',
        [id]
      )

      // Invalidate cache
      await this.cacheManager.invalidateUser(id)

      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to verify phone', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Update password
   */
  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, id]
      )

      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to update password', {
        userId: id,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    newThisMonth: number
    byRole: Record<string, number>
  }> {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as new_this_month,
          json_object_agg(role, role_count) as by_role
        FROM (
          SELECT role, COUNT(*) as role_count
          FROM users
          GROUP BY role
        ) role_counts
      `)

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to get user statistics', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}

export default UserModel