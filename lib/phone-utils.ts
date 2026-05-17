/**
 * Normalize Ghana phone numbers to international E.164 format (+233...).
 */
export function normalizeGhanaPhoneNumber(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null

  const cleaned = raw.trim().replace(/[\s\-().]/g, "")
  if (!cleaned) return null

  if (cleaned.startsWith("+")) {
    return cleaned
  }

  const digits = cleaned.replace(/\D/g, "")
  if (!digits) return null

  if (digits.startsWith("0")) {
    return `+233${digits.slice(1)}`
  }

  if (digits.startsWith("233")) {
    return `+${digits}`
  }

  return `+233${digits}`
}

/** Digits only for https://wa.me/{digits} (no + prefix). */
export function toWhatsAppDigits(normalized: string | null | undefined): string | null {
  if (!normalized) return null
  const digits = normalized.replace(/\D/g, "")
  return digits || null
}

export function toTelHref(normalized: string | null | undefined): string | null {
  if (!normalized) return null
  return `tel:${normalized}`
}

export function toWhatsAppHref(
  normalized: string | null | undefined,
  message?: string,
): string | null {
  const digits = toWhatsAppDigits(normalized)
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`
  }
  return base
}
