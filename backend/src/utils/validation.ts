/**
 * Validation utilities for the application
 */

/**
 * Email validation
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase())
}

/**
 * Password validation
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false
  }

  // Remove whitespace
  const trimmedPassword = password.trim()

  // Check minimum length
  if (trimmedPassword.length < 8) {
    return false
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(trimmedPassword)) {
    return false
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(trimmedPassword)) {
    return false
  }

  // Check for at least one number
  if (!/\d/.test(trimmedPassword)) {
    return false
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword)) {
    return false
  }

  return true
}

/**
 * Strong password validation ( stricter requirements )
 * Requirements:
 * - At least 12 characters long
 * - Contains at least two uppercase letters
 * - Contains at least two lowercase letters
 * - Contains at least two numbers
 * - Contains at least two special characters
 */
export const validateStrongPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false
  }

  const trimmedPassword = password.trim()

  // Check minimum length
  if (trimmedPassword.length < 12) {
    return false
  }

  // Check for at least two uppercase letters
  const uppercaseMatches = trimmedPassword.match(/[A-Z]/g)
  if (!uppercaseMatches || uppercaseMatches.length < 2) {
    return false
  }

  // Check for at least two lowercase letters
  const lowercaseMatches = trimmedPassword.match(/[a-z]/g)
  if (!lowercaseMatches || lowercaseMatches.length < 2) {
    return false
  }

  // Check for at least two numbers
  const numberMatches = trimmedPassword.match(/\d/g)
  if (!numberMatches || numberMatches.length < 2) {
    return false
  }

  // Check for at least two special characters
  const specialMatches = trimmedPassword.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g)
  if (!specialMatches || specialMatches.length < 2) {
    return false
  }

  return true
}

/**
 * Phone number validation (basic international format)
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Basic validation: must start with + and have 8-15 digits total
  const phoneRegex = /^\+[1-9]\d{7,14}$/
  return phoneRegex.test(cleaned)
}

/**
 * Name validation (first name, last name, full name)
 */
export const validateName = (name: string, minLength: number = 2, maxLength: number = 100): boolean => {
  if (!name || typeof name !== 'string') {
    return false
  }

  const trimmedName = name.trim()

  // Check length
  if (trimmedName.length < minLength || trimmedName.length > maxLength) {
    return false
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ' -]+$/
  return nameRegex.test(trimmedName)
}

/**
 * URL validation
 */
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Date validation
 */
export const validateDate = (date: string | Date): boolean => {
  if (!date) {
    return false
  }

  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

/**
 * Future date validation
 */
export const validateFutureDate = (date: string | Date): boolean => {
  if (!validateDate(date)) {
    return false
  }

  const parsedDate = new Date(date)
  const now = new Date()
  return parsedDate > now
}

/**
 * Past date validation
 */
export const validatePastDate = (date: string | Date): boolean => {
  if (!validateDate(date)) {
    return false
  }

  const parsedDate = new Date(date)
  const now = new Date()
  return parsedDate < now
}

/**
 * Age validation (18+ years old)
 */
export const validateAdultAge = (dateOfBirth: string | Date): boolean => {
  if (!validateDate(dateOfBirth)) {
    return false
  }

  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age >= 18
}

/**
 * Slug validation (for tour URLs, etc.)
 */
export const validateSlug = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  // Allow alphanumeric characters, hyphens, and underscores
  // Must start and end with alphanumeric
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100
}

/**
 * Currency code validation (ISO 4217)
 */
export const validateCurrency = (currency: string): boolean => {
  if (!currency || typeof currency !== 'string') {
    return false
  }

  // Common currency codes (you might want to extend this)
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR',
    'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK'
  ]

  return validCurrencies.includes(currency.toUpperCase())
}

/**
 * Language code validation (ISO 639-1)
 */
export const validateLanguage = (language: string): boolean => {
  if (!language || typeof language !== 'string') {
    return false
  }

  // Common language codes
  const validLanguages = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko',
    'ar', 'hi', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'cs', 'tr'
  ]

  return validLanguages.includes(language.toLowerCase())
}

/**
 * Timezone validation
 */
export const validateTimezone = (timezone: string): boolean => {
  if (!timezone || typeof timezone !== 'string') {
    return false
  }

  try {
    // This will throw an error if the timezone is invalid
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Latitude/longitude validation
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false
  }

  // Latitude must be between -90 and 90
  if (lat < -90 || lat > 90) {
    return false
  }

  // Longitude must be between -180 and 180
  if (lng < -180 || lng > 180) {
    return false
  }

  return true
}

/**
 * Positive number validation
 */
export const validatePositiveNumber = (value: number, min?: number, max?: number): boolean => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false
  }

  if (value <= 0) {
    return false
  }

  if (min !== undefined && value < min) {
    return false
  }

  if (max !== undefined && value > max) {
    return false
  }

  return true
}

/**
 * Integer validation
 */
export const validateInteger = (value: number, min?: number, max?: number): boolean => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return false
  }

  if (min !== undefined && value < min) {
    return false
  }

  if (max !== undefined && value > max) {
    return false
  }

  return true
}

/**
 * Array validation
 */
export const validateArray = <T>(array: T[], minLength?: number, maxLength?: number): boolean => {
  if (!Array.isArray(array)) {
    return false
  }

  if (minLength !== undefined && array.length < minLength) {
    return false
  }

  if (maxLength !== undefined && array.length > maxLength) {
    return false
  }

  return true
}

/**
 * Enum value validation
 */
export const validateEnum = <T extends string>(value: T, allowedValues: readonly T[]): boolean => {
  return allowedValues.includes(value)
}

/**
 * File type validation
 */
export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  if (!filename || typeof filename !== 'string') {
    return false
  }

  const extension = filename.toLowerCase().split('.').pop()
  if (!extension) {
    return false
  }

  return allowedTypes.includes(extension)
}

/**
 * Input sanitization
 */
export const sanitizeString = (input: string, maxLength?: number): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }

  let sanitized = input.trim()

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Email sanitization
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return ''
  }

  return email.trim().toLowerCase()
}

/**
 * Phone sanitization
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return ''
  }

  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '')
}

/**
 * URL sanitization
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return ''
  }

  try {
    const urlObj = new URL(url)
    // Return the cleaned URL
    return urlObj.toString()
  } catch {
    return ''
  }
}