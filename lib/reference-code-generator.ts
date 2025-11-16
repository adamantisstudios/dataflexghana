export function generate4CharCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generatePaymentReferenceCode(): string {
  return generate4CharCode()
}

export function generateShortPaymentReference(): string {
  return generate4CharCode()
}

// Export as default for quick imports
export default generate4CharCode
