/**
 * Commission Validation Utilities
 * Ensures commission calculations are valid and don't violate database constraints
 */

import { safeCommissionDisplay } from './commission-calculator'

export interface CommissionValidationResult {
  isValid: boolean
  amount: number
  errors: string[]
  warnings: string[]
}

/**
 * Validate commission amount before database operations
 */
export function validateCommissionAmount(amount: number | null | undefined): CommissionValidationResult {
  const result: CommissionValidationResult = {
    isValid: true,
    amount: 0,
    errors: [],
    warnings: []
  }

  // Convert to safe number
  const safeAmount = safeCommissionDisplay(amount)
  result.amount = safeAmount

  // Check for negative amounts
  if (safeAmount < 0) {
    result.isValid = false
    result.errors.push('Commission amount cannot be negative')
  }

  // Check for zero amounts
  if (safeAmount === 0) {
    result.warnings.push('Commission amount is zero')
  }

  // Check for unreasonably large amounts
  if (safeAmount > 999999.99) {
    result.isValid = false
    result.errors.push('Commission amount exceeds maximum allowed value')
  }

  // Check for invalid numbers
  if (!isFinite(safeAmount) || isNaN(safeAmount)) {
    result.isValid = false
    result.errors.push('Commission amount is not a valid number')
  }

  return result
}

/**
 * Validate wallet transaction amount for database insertion
 */
export function validateWalletTransactionAmount(amount: number | null | undefined): CommissionValidationResult {
  const result: CommissionValidationResult = {
    isValid: true,
    amount: 0,
    errors: [],
    warnings: []
  }

  // Convert to safe number
  const safeAmount = safeCommissionDisplay(amount)
  result.amount = safeAmount

  // Wallet transactions must be positive (constraint requirement)
  if (safeAmount <= 0) {
    result.isValid = false
    result.errors.push('Wallet transaction amount must be positive')
  }

  // Check for unreasonably large amounts
  if (safeAmount > 999999.99) {
    result.isValid = false
    result.errors.push('Transaction amount exceeds maximum allowed value')
  }

  // Check for invalid numbers
  if (!isFinite(safeAmount) || isNaN(safeAmount)) {
    result.isValid = false
    result.errors.push('Transaction amount is not a valid number')
  }

  // Check for precision (max 2 decimal places)
  const decimalPlaces = (safeAmount.toString().split('.')[1] || '').length
  if (decimalPlaces > 2) {
    result.warnings.push('Amount will be rounded to 2 decimal places')
    result.amount = Math.round(safeAmount * 100) / 100
  }

  return result
}

/**
 * Validate commission rate (percentage)
 */
export function validateCommissionRate(rate: number | null | undefined): CommissionValidationResult {
  const result: CommissionValidationResult = {
    isValid: true,
    amount: 0,
    errors: [],
    warnings: []
  }

  const safeRate = safeCommissionDisplay(rate)
  result.amount = safeRate

  // Commission rate should be between 0 and 1 (0% to 100%)
  if (safeRate < 0) {
    result.isValid = false
    result.errors.push('Commission rate cannot be negative')
  }

  if (safeRate > 1) {
    result.warnings.push('Commission rate is greater than 100%')
  }

  // Check for invalid numbers
  if (!isFinite(safeRate) || isNaN(safeRate)) {
    result.isValid = false
    result.errors.push('Commission rate is not a valid number')
  }

  return result
}

/**
 * Validate order data before commission calculation
 */
export function validateOrderForCommission(order: {
  price?: number | null
  commission_rate?: number | null
  agent_id?: string | null
}): CommissionValidationResult {
  const result: CommissionValidationResult = {
    isValid: true,
    amount: 0,
    errors: [],
    warnings: []
  }

  // Validate price
  const priceValidation = validateCommissionAmount(order.price)
  if (!priceValidation.isValid) {
    result.isValid = false
    result.errors.push(...priceValidation.errors.map(e => `Price: ${e}`))
  }

  // Validate commission rate
  const rateValidation = validateCommissionRate(order.commission_rate)
  if (!rateValidation.isValid) {
    result.isValid = false
    result.errors.push(...rateValidation.errors.map(e => `Commission rate: ${e}`))
  }

  // Validate agent ID
  if (!order.agent_id || typeof order.agent_id !== 'string') {
    result.isValid = false
    result.errors.push('Valid agent ID is required')
  }

  // Calculate commission if all validations pass
  if (result.isValid) {
    const commission = priceValidation.amount * rateValidation.amount
    const commissionValidation = validateWalletTransactionAmount(commission)
    
    if (!commissionValidation.isValid) {
      result.isValid = false
      result.errors.push(...commissionValidation.errors.map(e => `Calculated commission: ${e}`))
    } else {
      result.amount = commissionValidation.amount
    }
  }

  // Combine warnings
  result.warnings.push(...priceValidation.warnings, ...rateValidation.warnings)

  return result
}

/**
 * Safe commission calculation with validation
 */
export function calculateValidatedCommission(
  price: number | null | undefined,
  rate: number | null | undefined
): CommissionValidationResult {
  const result: CommissionValidationResult = {
    isValid: true,
    amount: 0,
    errors: [],
    warnings: []
  }

  const priceValidation = validateCommissionAmount(price)
  const rateValidation = validateCommissionRate(rate)

  if (!priceValidation.isValid || !rateValidation.isValid) {
    result.isValid = false
    result.errors.push(...priceValidation.errors, ...rateValidation.errors)
    return result
  }

  const commission = priceValidation.amount * rateValidation.amount
  const commissionValidation = validateWalletTransactionAmount(commission)

  result.isValid = commissionValidation.isValid
  result.amount = commissionValidation.amount
  result.errors = commissionValidation.errors
  result.warnings.push(...priceValidation.warnings, ...rateValidation.warnings, ...commissionValidation.warnings)

  return result
}
