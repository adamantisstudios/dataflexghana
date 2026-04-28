/**
 * Generate a random 5-digit numeric PIN for payment verification
 * Format: Exactly 5 digits (e.g., 12345, 00987, 45001)
 * Length: Exactly 5 digits to match database varchar(5) constraint
 */
export function generatePaymentPIN(): string {
  // Generate a random number between 0 and 99999, then pad to 5 digits
  const randomNum = Math.floor(Math.random() * 100000) // 0 to 99999
  return randomNum.toString().padStart(5, '0')
}

/**
 * Validate a payment PIN format
 * Must be exactly 5 numeric digits
 */
export function isValidPaymentPIN(pin: string): boolean {
  return /^\d{5}$/.test(pin)
}