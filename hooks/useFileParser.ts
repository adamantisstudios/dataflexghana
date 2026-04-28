export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "")

  // If it's a 12-digit number starting with 233 (international format)
  if (cleaned.length === 12 && cleaned.startsWith("233")) {
    return "0" + cleaned.slice(3)
  }

  // If it's 9 digits, prepend 0
  if (cleaned.length === 9) {
    return "0" + cleaned
  }

  // If it's already 10 digits starting with 0, use as-is
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return cleaned
  }

  // Return cleaned version (may be invalid, but normalization is done)
  return cleaned.slice(0, 10)
}

export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  if (normalized.length !== 10) return false
  if (!/^0[2345]\d{8}$/.test(normalized)) return false
  return true
}

export function parseCSVLine(line: string): { phone: string; capacity: string } | null {
  const [phone, capacity] = line.split(/[\s,\t]+/).filter(Boolean)
  if (!phone || !capacity) return null
  return { phone, capacity }
}

export function parseTextBulkOrders(text: string): Array<{ phone: string; capacity: string; raw: string }> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((raw) => {
      const parts = raw.split(/[\s,\t]+/).filter(Boolean)
      return {
        phone: parts[0] || "",
        capacity: parts[1] || "",
        raw,
      }
    })
}

export async function parseCSVFile(file: File): Promise<Array<{ phone: string; capacity: string; raw: string }>> {
  const text = await file.text()
  const lines = text.split("\n")

  return lines
    .slice(1) // Skip header
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((raw) => {
      // Split by comma, tab, or multiple spaces
      const parts = raw
        .split(/[,\t;|]+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      return {
        phone: parts[0] || "",
        capacity: parts[1] || "",
        raw,
      }
    })
}

export function detectNetworkType(phone: string): "MTN" | "AirtelTigo" | "Telecel" | "Unknown" {
  const normalized = normalizePhoneNumber(phone)
  const prefix = normalized.substring(0, 3)

  // MTN: 024, 025, 053, 054, 055, 059
  if (["024", "025", "053", "054", "055", "059"].includes(prefix)) {
    return "MTN"
  }

  // AirtelTigo: 026, 027, 056, 057
  if (["026", "027", "056", "057"].includes(prefix)) {
    return "AirtelTigo"
  }

  // Telecel: 020, 050
  if (["020", "050"].includes(prefix)) {
    return "Telecel"
  }

  return "Unknown"
}

export function validateBulkOrderRow(
  phone: string,
  capacity: string,
  network?: string,
): { valid: boolean; phone?: string; capacity?: number; network?: string; error?: string } {
  const normalizedPhone = normalizePhoneNumber(phone)

  if (!validatePhoneNumber(normalizedPhone)) {
    return { valid: false, error: `Invalid phone: ${phone}` }
  }

  const capacityNum = Number.parseFloat(capacity)
  if (isNaN(capacityNum) || capacityNum <= 0) {
    return { valid: false, error: `Invalid capacity: ${capacity}` }
  }

  // If network is provided, validate it
  if (network && !["MTN", "AirtelTigo", "Telecel"].includes(network)) {
    return { valid: false, error: `Invalid network: ${network}` }
  }

  // Auto-detect network if not provided
  const detectedNetwork = network || detectNetworkType(normalizedPhone)

  return { valid: true, phone: normalizedPhone, capacity: capacityNum, network: detectedNetwork }
}
