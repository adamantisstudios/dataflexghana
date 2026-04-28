/**
 * Currency formatting utilities for Ghana Cedis (GHS)
 * Handles proper formatting, validation, and business rules
 */

export interface CurrencyFormatOptions {
  showSymbol?: boolean
  decimals?: number
  locale?: string
}

/**
 * Format amount as Ghana Cedis currency
 */
export function formatCurrency(amount: number | null | undefined, options: CurrencyFormatOptions = {}): string {
  const { showSymbol = true, decimals = 2, locale = "en-GH" } = options

  // Handle null/undefined amounts
  if (amount === null || amount === undefined) {
    return showSymbol ? "GH₵ 0.00" : "0.00"
  }

  // Handle invalid numbers
  if (isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? "GH₵ 0.00" : "0.00"
  }

  // Ensure non-negative for display
  const safeAmount = Math.max(0, amount)

  try {
    // Use Intl.NumberFormat for proper formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? "currency" : "decimal",
      currency: "GHS",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })

    let formatted = formatter.format(safeAmount)

    // Replace currency symbol with Ghana Cedis symbol if needed
    if (showSymbol && formatted.includes("GHS")) {
      formatted = formatted.replace("GHS", "GH₵")
    }

    return formatted
  } catch (error) {
    // Fallback formatting
    const fixed = safeAmount.toFixed(decimals)
    return showSymbol ? `GH₵ ${fixed}` : fixed
  }
}

/**
 * Validate if a price is valid for business rules
 */
export function isValidPrice(price: number | null | undefined): boolean {
  if (price === null || price === undefined) {
    return false
  }

  if (isNaN(price) || !isFinite(price)) {
    return false
  }

  // Allow 0 prices (free bundles, promotions)
  return price >= 0
}

/**
 * Calculate commission amount
 */
export function calculateCommission(price: number, commissionRate: number): number {
  const { getCalculatedCommission } = require("./commission-calculation")

  if (!isValidPrice(price) || !isValidPrice(commissionRate)) {
    return 0
  }

  return getCalculatedCommission(price, commissionRate)
}

/**
 * Business rules for bundle pricing
 */
export const PRICING_RULES = {
  MIN_PRICE: 0, // Allow free bundles
  MAX_PRICE: 1000, // Maximum bundle price in GHS
  DEFAULT_COMMISSION_RATE: 0.1, // 10% default commission
  CURRENCY_CODE: "GHS",
  CURRENCY_SYMBOL: "GH₵",
} as const

/**
 * Validate bundle price against business rules
 */
export function validateBundlePrice(price: number | null | undefined): {
  isValid: boolean
  error?: string
} {
  if (price === null || price === undefined) {
    return {
      isValid: false,
      error: "Price is required",
    }
  }

  if (isNaN(price) || !isFinite(price)) {
    return {
      isValid: false,
      error: "Price must be a valid number",
    }
  }

  if (price < PRICING_RULES.MIN_PRICE) {
    return {
      isValid: false,
      error: `Price cannot be less than ${formatCurrency(PRICING_RULES.MIN_PRICE)}`,
    }
  }

  if (price > PRICING_RULES.MAX_PRICE) {
    return {
      isValid: false,
      error: `Price cannot exceed ${formatCurrency(PRICING_RULES.MAX_PRICE)}`,
    }
  }

  return { isValid: true }
}
