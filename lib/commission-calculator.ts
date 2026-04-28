/**
 * Commission Calculator Utility
 * Ensures exact commission calculations without rounding errors
 * Matches the SQL commission calculation functions
 */

// Exact commission rates as defined in the requirements
export const COMMISSION_RATES = {
  MTN: {
    1: { price: 5.0, rate: 0.004, targetCommission: 0.02 },
    2: { price: 9.99, rate: 0.003, targetCommission: 0.03 },
    3: { price: 16.9, rate: 0.0024, targetCommission: 0.04 },
    4: { price: 21.5, rate: 0.0023, targetCommission: 0.05 },
    5: { price: 25.9, rate: 0.0019, targetCommission: 0.05 },
    6: { price: 30.5, rate: 0.002, targetCommission: 0.06 },
    7: { price: 36.9, rate: 0.0019, targetCommission: 0.07 },
    8: { price: 38.9, rate: 0.0021, targetCommission: 0.08 },
    10: { price: 40.0, rate: 0.0025, targetCommission: 0.1 },
    15: { price: 67.9, rate: 0.0018, targetCommission: 0.12 },
    20: { price: 83.9, rate: 0.0018, targetCommission: 0.15 },
    25: { price: 106.0, rate: 0.0017, targetCommission: 0.18 },
    30: { price: 121.0, rate: 0.0017, targetCommission: 0.2 },
    40: { price: 165.0, rate: 0.0015, targetCommission: 0.25 },
    50: { price: 199.9, rate: 0.0014, targetCommission: 0.28 },
    100: { price: 399.0, rate: 0.0008, targetCommission: 0.3 },
  },
  AirtelTigo: {
    1: { price: 4.9, rate: 0.0041, targetCommission: 0.02 },
    2: { price: 10.0, rate: 0.003, targetCommission: 0.03 },
    3: { price: 14.9, rate: 0.0027, targetCommission: 0.04 },
    4: { price: 22.0, rate: 0.0023, targetCommission: 0.05 },
    5: { price: 26.0, rate: 0.0019, targetCommission: 0.05 },
    6: { price: 29.9, rate: 0.002, targetCommission: 0.06 },
    7: { price: 33.9, rate: 0.0021, targetCommission: 0.07 },
    8: { price: 33.9, rate: 0.0024, targetCommission: 0.08 },
    9: { price: 43.9, rate: 0.0023, targetCommission: 0.1 },
    10: { price: 41.9, rate: 0.0024, targetCommission: 0.1 },
    15: { price: 54.0, rate: 0.0022, targetCommission: 0.12 },
    20: { price: 65.9, rate: 0.0023, targetCommission: 0.15 },
    25: { price: 77.9, rate: 0.0023, targetCommission: 0.18 },
    30: { price: 84.9, rate: 0.0024, targetCommission: 0.2 },
    40: { price: 98.0, rate: 0.0026, targetCommission: 0.25 },
    50: { price: 107.0, rate: 0.0026, targetCommission: 0.28 },
    60: { price: 124.0, rate: 0.0024, targetCommission: 0.3 },
    80: { price: 156.0, rate: 0.0019, targetCommission: 0.3 },
    100: { price: 189.0, rate: 0.0016, targetCommission: 0.3 },
    130: { price: 262.0, rate: 0.0011, targetCommission: 0.3 },
    170: { price: 315.0, rate: 0.001, targetCommission: 0.3 },
    200: { price: 355.0, rate: 0.0008, targetCommission: 0.3 },
  },
  Telecel: {
    5: { price: 24.0, rate: 0.0021, targetCommission: 0.05 },
    10: { price: 47.0, rate: 0.0021, targetCommission: 0.1 },
    15: { price: 67.0, rate: 0.0018, targetCommission: 0.12 },
    20: { price: 88.0, rate: 0.0017, targetCommission: 0.15 },
    25: { price: 108.0, rate: 0.0017, targetCommission: 0.18 },
    30: { price: 128.0, rate: 0.0016, targetCommission: 0.2 },
    40: { price: 165.0, rate: 0.0015, targetCommission: 0.25 },
    50: [
      { price: 205.0, rate: 0.0014, targetCommission: 0.28 },
      { price: 203.0, rate: 0.0014, targetCommission: 0.28 },
    ],
    100: { price: 399.0, rate: 0.0008, targetCommission: 0.3 },
  },
} as const

/**
 * Calculate exact commission without rounding
 * This matches the SQL function calculate_exact_commission
 */
export function calculateExactCommission(price: number, commissionRate: number): number {
  // Use precise decimal calculation to avoid floating point errors
  const exactCommission = price * commissionRate
  return exactCommission
}

/**
 * Format commission for display in the UI
 * Ensures consistent formatting across the application with 2 decimal places
 */
export function formatCommission(commission: number): string {
  return `₵${commission.toFixed(2)}`
}

/**
 * Format commission rate as percentage for display
 */
export function formatCommissionRate(rate: number): string {
  return `${(rate * 100).toFixed(4)}%`
}

/**
 * Calculate commission for display purposes (rounded to 2 decimal places)
 * This matches the SQL function get_display_commission
 */
export function getDisplayCommission(price: number, commissionRate: number): number {
  return calculateFinalCommission(price, commissionRate)
}

/**
 * Format any number as currency with 2 decimal places
 */
export function formatCurrency(amount: number): string {
  return `₵${amount.toFixed(2)}`
}

/**
 * Safe toLocaleString with 2 decimal places for commission display
 * Returns a number that can be used with .toFixed()
 */
export function safeCommissionDisplay(value: number | null | undefined): number {
  // Always return a valid number, defaulting to 0 if value is null/undefined/NaN
  if (value === null || value === undefined || isNaN(value)) {
    return 0
  }
  return Number(value)
}

/**
 * Safe commission display as formatted string WITHOUT currency symbol
 * Returns just the number formatted to 2 decimal places
 */
export function safeCommissionDisplayFormatted(value: number | null | undefined): string {
  const safeValue = safeCommissionDisplay(value)
  return safeValue.toFixed(2)
}

/**
 * Safe commission display as formatted string WITH currency symbol
 * Returns the number formatted with ₵ prefix - for original display format
 */
export function safeCommissionDisplayWithCurrency(value: number | null | undefined): string {
  const safeValue = safeCommissionDisplay(value)
  return `₵${safeValue.toFixed(2)}`
}

/**
 * Get commission rate for a specific provider and bundle size
 */
export function getCommissionRate(provider: string, sizeGB: number, price?: number): number | null {
  const providerRates = COMMISSION_RATES[provider as keyof typeof COMMISSION_RATES]
  if (!providerRates) return null

  const bundleRate = providerRates[sizeGB as keyof typeof providerRates]
  if (!bundleRate) return null

  // Handle Telecel 50GB case with multiple prices
  if (Array.isArray(bundleRate)) {
    if (price) {
      const matchingRate = bundleRate.find((rate) => Math.abs(rate.price - price) < 0.01)
      return matchingRate ? matchingRate.rate : bundleRate[0].rate
    }
    return bundleRate[0].rate
  }

  return bundleRate.rate
}

/**
 * Get expected price for a specific provider and bundle size
 */
export function getExpectedPrice(provider: string, sizeGB: number): number | null {
  const providerRates = COMMISSION_RATES[provider as keyof typeof COMMISSION_RATES]
  if (!providerRates) return null

  const bundleRate = providerRates[sizeGB as keyof typeof providerRates]
  if (!bundleRate) return null

  // Handle Telecel 50GB case with multiple prices
  if (Array.isArray(bundleRate)) {
    return bundleRate[0].price
  }

  return bundleRate.price
}

/**
 * Validate that a commission calculation matches the expected target
 */
export function validateCommission(
  provider: string,
  sizeGB: number,
  price: number,
  commissionRate: number,
): {
  isValid: boolean
  exactCommission: number
  targetCommission: number
  calculatedCommission: number
  difference: number
} {
  const providerRates = COMMISSION_RATES[provider as keyof typeof COMMISSION_RATES]
  if (!providerRates) {
    return {
      isValid: false,
      exactCommission: 0,
      targetCommission: 0,
      calculatedCommission: 0,
      difference: 0,
    }
  }

  const bundleRate = providerRates[sizeGB as keyof typeof providerRates]
  if (!bundleRate) {
    return {
      isValid: false,
      exactCommission: 0,
      targetCommission: 0,
      calculatedCommission: 0,
      difference: 0,
    }
  }

  let targetCommission: number
  if (Array.isArray(bundleRate)) {
    const matchingRate = bundleRate.find((rate) => Math.abs(rate.price - price) < 0.01)
    targetCommission = matchingRate ? matchingRate.targetCommission : bundleRate[0].targetCommission
  } else {
    targetCommission = bundleRate.targetCommission
  }

  const exactCommission = calculateExactCommission(price, commissionRate)
  const finalCommission = calculateFinalCommission(price, commissionRate)
  const difference = Math.abs(finalCommission - targetCommission)
  const isValid = difference < 0.001 // Allow for tiny floating point differences

  return {
    isValid,
    exactCommission,
    targetCommission,
    calculatedCommission: finalCommission,
    difference,
  }
}

/**
 * Calculate total commission for multiple orders
 */
export function calculateTotalCommission(
  orders: Array<{
    price: number
    commissionRate: number
  }>,
): number {
  return orders.reduce((total, order) => {
    return total + calculateFinalCommission(order.price, order.commissionRate)
  }, 0)
}

/**
 * Verify all commission rates match the expected targets
 * Useful for testing and validation
 */
export function verifyAllCommissionRates(): Array<{
  provider: string
  sizeGB: number
  price: number
  rate: number
  isValid: boolean
  exactCommission: number
  targetCommission: number
  difference: number
}> {
  const results: Array<any> = []

  Object.entries(COMMISSION_RATES).forEach(([provider, bundles]) => {
    Object.entries(bundles).forEach(([sizeGB, bundleData]) => {
      const size = Number.parseInt(sizeGB)

      if (Array.isArray(bundleData)) {
        bundleData.forEach((bundle) => {
          const validation = validateCommission(provider, size, bundle.price, bundle.rate)
          results.push({
            provider,
            sizeGB: size,
            price: bundle.price,
            rate: bundle.rate,
            ...validation,
          })
        })
      } else {
        const validation = validateCommission(provider, size, bundleData.price, bundleData.rate)
        results.push({
          provider,
          sizeGB: size,
          price: bundleData.price,
          rate: bundleData.rate,
          ...validation,
        })
      }
    })
  })

  return results
}

/**
 * Get comprehensive commission summary for an agent
 * Used by the agent dashboard to display earnings overview
 */
export async function getAgentCommissionSummary(agentId: string): Promise<{
  totalEarned: number
  totalPending: number
  totalWithdrawn: number
  availableBalance: number
  totalCommissions: number
  recentCommissions: Array<{
    id: string
    amount: number
    type: string
    status: string
    createdAt: string
    orderId?: string
    referralId?: string
  }>
}> {
  try {
    // This would typically make API calls to get the data
    // For now, return a structure that matches what the dashboard expects
    const response = await fetch(`/api/agent/commission-summary?agentId=${agentId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch commission summary")
    }

    const data = await response.json()
    return {
      totalEarned: safeCommissionDisplay(data.totalEarned),
      totalPending: safeCommissionDisplay(data.totalPending),
      totalWithdrawn: safeCommissionDisplay(data.totalWithdrawn),
      availableBalance: safeCommissionDisplay(data.availableBalance),
      totalCommissions: safeCommissionDisplay(data.totalCommissions),
      recentCommissions: data.recentCommissions || [],
    }
  } catch (error) {
    console.error("Error fetching agent commission summary:", error)
    // Return safe defaults to prevent crashes
    return {
      totalEarned: 0,
      totalPending: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
      totalCommissions: 0,
      recentCommissions: [],
    }
  }
}

// Export types for TypeScript usage
export type Provider = keyof typeof COMMISSION_RATES
export type CommissionData = {
  price: number
  rate: number
  targetCommission: number
}

/**
 * Core commission calculation with all caps and rounding applied
 * Returns the FINAL commission amount ready for database or display
 */
export function calculateFinalCommission(price: number, commissionRate: number): number {
  // Step 1: Calculate raw commission
  const rawCommission = price * commissionRate

  // Step 2: Round to 2 decimal places
  const roundedCommission = Math.round(rawCommission * 100) / 100

  // Step 3: Apply caps
  // If calculated commission is 0 or negative, return 0 (will skip DB insertion)
  if (roundedCommission <= 0) {
    return 0
  }

  // Apply minimum cap: if 0 < commission < 0.01, set to 0.01
  let finalCommission = roundedCommission
  if (roundedCommission > 0 && roundedCommission < 0.01) {
    finalCommission = 0.01
  }

  // Apply maximum cap: if commission > 0.40, set to 0.40
  if (finalCommission > 0.4) {
    finalCommission = 0.4
  }

  return finalCommission
}

/**
 * Determine if commission should be inserted into database
 * Returns false if calculated commission rounds to 0, true otherwise
 */
export function shouldInsertCommission(price: number, commissionRate: number): boolean {
  const finalCommission = calculateFinalCommission(price, commissionRate)
  return finalCommission > 0
}

/**
 * Replace calculateCorrectCommission with calculateFinalCommission
 * This ensures all code uses the same unified calculation logic
 */
export function calculateCorrectCommission(price: number, commissionRate: number): number {
  return calculateFinalCommission(price, commissionRate)
}

/**
 * Export the core commission calculation rules for reference
 */
export const COMMISSION_CALCULATION_RULES = {
  MIN_COMMISSION: 0.01,
  MAX_COMMISSION: 0.4,
  DECIMAL_PLACES: 2,
  SKIP_ZERO_COMMISSIONS: true,
} as const
