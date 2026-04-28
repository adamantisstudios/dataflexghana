export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") return "***@***.***"
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return "***@***.***"

  const localFirstChar = localPart.charAt(0)
  const domainParts = domain.split(".")
  const extension = domainParts[domainParts.length - 1] || "com"

  return `${localFirstChar}****@***.${extension}`
}

export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== "string") return "****-****"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length < 4) return "****"
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-1)}`
}

export function maskName(name: string): string {
  if (!name || typeof name !== "string") return "***"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "***"

  const firstName = parts[0]
  const lastName = parts[parts.length - 1]

  if (parts.length === 1) {
    return `${firstName.charAt(0)}${"*".repeat(firstName.length - 1)}`
  }

  return `${firstName.charAt(0)}**** ${lastName.charAt(0)}****`
}

// Prevent XSS and data extraction attempts
export function sanitizeDisplay(value: string): string {
  if (!value) return "***"
  return String(value).replace(/[<>"']/g, "")
}
