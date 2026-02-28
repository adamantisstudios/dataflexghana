/**
 * Currency formatting utilities for Ghanaian Cedi (₵)
 * Provides consistent formatting across the application
 */

export const CURRENCY_SYMBOL = '₵'

/**
 * Format a number as Ghanaian Cedi currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCedi(
  amount: number | string,
  options: {
    showSymbol?: boolean
    decimals?: number
    compact?: boolean
  } = {}
): string {
  const {
    showSymbol = true,
    decimals = 2,
    compact = false
  } = options

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return showSymbol ? `${CURRENCY_SYMBOL}0.00` : '0.00'
  }

  let formatted: string

  if (compact && Math.abs(numAmount) >= 1000) {
    // Format large numbers with K, M, B suffixes
    if (Math.abs(numAmount) >= 1000000000) {
      formatted = (numAmount / 1000000000).toFixed(1) + 'B'
    } else if (Math.abs(numAmount) >= 1000000) {
      formatted = (numAmount / 1000000).toFixed(1) + 'M'
    } else {
      formatted = (numAmount / 1000).toFixed(1) + 'K'
    }
  } else {
    // Standard formatting with commas
    formatted = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted
}

/**
 * Parse a currency string to a number
 * @param currencyString - String like "₵1,234.56" or "1234.56"
 * @returns Parsed number or 0 if invalid
 */
export function parseCedi(currencyString: string): number {
  if (!currencyString) return 0
  
  // Remove currency symbol and commas
  const cleaned = currencyString
    .replace(CURRENCY_SYMBOL, '')
    .replace(/,/g, '')
    .trim()
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format percentage with proper decimal places
 * @param percentage - The percentage to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  if (isNaN(percentage)) return '0.00%'
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Calculate interest amount
 * @param principal - Principal amount
 * @param rate - Annual interest rate (as percentage)
 * @param days - Number of days
 * @returns Interest amount
 */
export function calculateInterest(principal: number, rate: number, days: number): number {
  if (isNaN(principal) || isNaN(rate) || isNaN(days)) return 0
  
  // Daily compound interest calculation
  const dailyRate = rate / 100 / 365
  return principal * Math.pow(1 + dailyRate, days) - principal
}

/**
 * Calculate maturity amount
 * @param principal - Principal amount
 * @param rate - Annual interest rate (as percentage)
 * @param months - Duration in months
 * @returns Maturity amount
 */
export function calculateMaturityAmount(principal: number, rate: number, months: number): number {
  if (isNaN(principal) || isNaN(rate) || isNaN(months)) return principal || 0
  
  const days = months * 30.44 // Average days per month
  return principal + calculateInterest(principal, rate, days)
}

/**
 * Format currency for input fields (without symbol)
 * @param amount - Amount to format
 * @returns Formatted string for input
 */
export function formatCediForInput(amount: number | string): string {
  return formatCedi(amount, { showSymbol: false })
}

/**
 * Format currency for display (with symbol)
 * @param amount - Amount to format
 * @param compact - Whether to use compact notation for large numbers
 * @returns Formatted string for display
 */
export function formatCediForDisplay(amount: number | string, compact: boolean = false): string {
  return formatCedi(amount, { showSymbol: true, compact })
}

/**
 * Validate currency input
 * @param input - Input string to validate
 * @returns Object with validation result and parsed value
 */
export function validateCurrencyInput(input: string): {
  isValid: boolean
  value: number
  error?: string
} {
  if (!input || input.trim() === '') {
    return { isValid: false, value: 0, error: 'Amount is required' }
  }

  const value = parseCedi(input)
  
  if (value <= 0) {
    return { isValid: false, value: 0, error: 'Amount must be greater than zero' }
  }

  if (value > 999999999) {
    return { isValid: false, value: 0, error: 'Amount is too large' }
  }

  return { isValid: true, value }
}

/**
 * Format duration in a human-readable way
 * @param months - Duration in months
 * @returns Human-readable duration string
 */
export function formatDuration(months: number): string {
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  let result = `${years} year${years !== 1 ? 's' : ''}`
  
  if (remainingMonths > 0) {
    result += ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
  }
  
  return result
}

/**
 * Get mobile money network display name
 * @param network - Network code
 * @returns Display name
 */
export function getMobileMoneyNetworkName(network: string): string {
  const networks: Record<string, string> = {
    'mtn': 'MTN Mobile Money',
    'vodafone': 'Vodafone Cash',
    'airteltigo': 'AirtelTigo Money',
    'telecel': 'Telecel Cash'
  }
  
  return networks[network.toLowerCase()] || network
}

/**
 * Format mobile money number for display
 * @param number - Mobile money number
 * @returns Formatted number
 */
export function formatMobileMoneyNumber(number: string): string {
  if (!number) return ''
  
  // Remove any non-digits
  const digits = number.replace(/\D/g, '')
  
  // Format as XXX XXX XXXX for Ghana numbers
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  
  return number
}
