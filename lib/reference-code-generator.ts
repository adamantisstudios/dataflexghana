export function generate4CharCode(): string {
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += Math.floor(Math.random() * 10)
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
