export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 12 && cleaned.startsWith("233")) {
    return "0" + cleaned.slice(3)
  }

  if (cleaned.length === 9) {
    return "0" + cleaned
  }

  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return cleaned
  }

  return cleaned.slice(0, 10)
}

export function validateGhanaCard(card: string): boolean {
  // Format: GHA-XXXXXXXXXX-X
  // const pattern = /^GHA-\d{10}-\d$/
  // return pattern.test(card.toUpperCase())
  return card.trim().length > 0
}

export function validatePhoneNumber(phone: string): boolean {
  if (phone.length !== 10) return false
  if (!/^0[2345]\d{8}$/.test(phone)) return false
  return true
}

export function detectNetworkByPrefix(phone: string): string {
  const normalized = normalizePhoneNumber(phone)

  if (!normalized || normalized.length < 3) {
    return ""
  }

  const prefix = normalized.substring(0, 3)

  // MTN prefixes: 024, 025, 053, 054, 055, 059
  if (["024", "025", "053", "054", "055", "059"].includes(prefix)) {
    return "MTN"
  }

  // AirtelTigo prefixes: 026, 027, 056, 057
  if (["026", "027", "056", "057"].includes(prefix)) {
    return "AirtelTigo"
  }

  // Telecel prefixes: 020, 050
  if (["020", "050"].includes(prefix)) {
    return "Telecel"
  }

  return ""
}
