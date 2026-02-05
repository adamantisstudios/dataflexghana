/**
 * UNIFIED COMMISSION CALCULATION SYSTEM
 *
 * Core rules for all commission calculations:
 * 1. Commission = rate * order_amount
 * 2. Round to 2 decimal places AFTER applying caps
 * 3. Minimum commission per order: 0.01 GHS (if calculated > 0)
 * 4. If calculated < 0.01, set to 0.01 to satisfy DB constraint
 */

/**
 * NEW: Unified commission calculation with all business rules enforced
 */
export interface CommissionCalculationInput {
  orderAmount: number
  commissionRate: number
  orderId?: string
}

export interface CommissionCalculationResult {
  rawCommission: number // Calculated before rounding
  roundedCommission: number // After rounding to 2 decimals
  cappedCommission: number // After applying min/max caps
  minCap: number
  maxCap: number
  appliedMinimum: boolean
  appliedMaximum: boolean
}

// Commission business rules - configurable constants
export const COMMISSION_RULES = {
  MIN_COMMISSION: 0.01, // Minimum commission per order
  DECIMAL_PLACES: 2, // Always round to 2 decimal places
}

/**
 * NEW: Main commission calculation function that enforces all business rules
 */
export function calculateCommissionWithCaps(input: CommissionCalculationInput): CommissionCalculationResult {
  const { orderAmount, commissionRate } = input

  // Validate inputs
  if (typeof orderAmount !== "number" || orderAmount < 0) {
    throw new Error(`Invalid order amount: ${orderAmount}. Must be a non-negative number.`)
  }
  if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1) {
    throw new Error(`Invalid commission rate: ${commissionRate}. Must be between 0 and 1.`)
  }

  // Step 1: Calculate raw commission (rate * amount)
  const rawCommission = orderAmount * commissionRate

  // Step 2: Round to 2 decimal places
  const roundedCommission = Math.round(rawCommission * 100) / 100

  // Step 3: Apply minimum and maximum caps
  let cappedCommission = roundedCommission
  let appliedMinimum = false
  let appliedMaximum = false

  // Apply minimum cap: if commission > 0 but less than 0.01, set to 0.01
  if (roundedCommission > 0 && roundedCommission < COMMISSION_RULES.MIN_COMMISSION) {
    cappedCommission = COMMISSION_RULES.MIN_COMMISSION
    appliedMinimum = true
  }

  // Commission can now be any value without upper limit

  return {
    rawCommission,
    roundedCommission,
    cappedCommission,
    minCap: COMMISSION_RULES.MIN_COMMISSION,
    maxCap: Infinity, // No maximum cap anymore
    appliedMinimum,
    appliedMaximum,
  }
}

/**
 * NEW: Convenience wrapper that returns just the final capped commission
 */
export function getCalculatedCommission(orderAmount: number, commissionRate: number): number {
  const result = calculateCommissionWithCaps({
    orderAmount,
    commissionRate,
  })
  return result.cappedCommission
}

/**
 * NEW: Batch calculate commissions for multiple orders
 */
export function batchCalculateCommissions(
  orders: Array<{
    id?: string
    amount: number
    rate: number
  }>,

): Map<string, CommissionCalculationResult> {
  const results = new Map<string, CommissionCalculationResult>()

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const id = order.id || `order_${i}`

    try {
      const result = calculateCommissionWithCaps({
        orderAmount: order.amount,
        commissionRate: order.rate,
        orderId: id,
      })
      results.set(id, result)
    } catch (error) {
      console.error(`Error calculating commission for ${id}:`, error)
      // Skip this order on error
    }
  }

  return results
}

/**
 * NEW: Validate that a commission amount matches the expected calculated value
 */
export function validateCommissionAmount(
  storedCommission: number,
  orderAmount: number,
  commissionRate: number,
): {
  isValid: boolean
  expectedCommission: number
  difference: number
  message: string
} {
  const result = calculateCommissionWithCaps({
    orderAmount,
    commissionRate,
  })

  const expectedCommission = result.cappedCommission
  const difference = Math.abs(storedCommission - expectedCommission)
  const isValid = difference < 0.001 // Allow tiny floating-point differences

  return {
    isValid,
    expectedCommission,
    difference,
    message: isValid
      ? `Commission amount is correct (${storedCommission})`
      : `Commission mismatch: stored ${storedCommission}, expected ${expectedCommission}, difference ${difference}`,
  }
}

/**
 * NEW: Format commission for display with consistent 2 decimal places
 */
export function formatCommissionDisplay(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0.00"
  }
  return Math.max(0, amount).toFixed(2)
}

/**
 * NEW: Format commission with currency symbol
 */
export function formatCommissionCurrency(amount: number | null | undefined): string {
  return `GH₵ ${formatCommissionDisplay(amount)}`
}

/**
 * NEW: Check if commission meets database constraints
 */
export function meetsConstraints(commission: number): {
  valid: boolean
  error?: string
} {
  if (commission < COMMISSION_RULES.MIN_COMMISSION) {
    return {
      valid: false,
      error: `Commission ${commission} is below minimum ${COMMISSION_RULES.MIN_COMMISSION}`,
    }
  }
  // Verify it's rounded to 2 decimal places
  const rounded = Math.round(commission * 100) / 100
  if (Math.abs(commission - rounded) > 0.0001) {
    return {
      valid: false,
      error: `Commission ${commission} is not rounded to 2 decimal places`,
    }
  }
  return { valid: true }
}
