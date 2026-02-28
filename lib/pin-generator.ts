/**
 * Generate a random 5-character alphanumeric PIN for payment verification
 * Format: Uppercase letters and digits, e.g., A9T4K, F2G7M
 */
export function generatePaymentPIN(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let pin = ""
  for (let i = 0; i < 5; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pin
}

/**
 * Validate a payment PIN format
 */
export function isValidPaymentPIN(pin: string): boolean {
  return /^[A-Z0-9]{5}$/.test(pin)
}
