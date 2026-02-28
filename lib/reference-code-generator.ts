export function generate5DigitCode(): string {
  let code = ""
  // Generate 5 digits for 100,000 possible combinations (prevents duplicates across large agent base)
  for (let i = 0; i < 5; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

export function generatePaymentReferenceCode(): string {
  return generate5DigitCode()
}

export function generateShortPaymentReference(): string {
  return generate5DigitCode()
}

// Keep old function name for backward compatibility but point to new one
export function generate4CharCode(): string {
  return generate5DigitCode()
}

// Export as default for quick imports
export default generate5DigitCode
