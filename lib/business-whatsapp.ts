/** Global business WhatsApp (not agent storefront chat). */
export function getBusinessWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_WHATSAPP?.trim() ||
    "233546460945"
  return raw.replace(/\D/g, "")
}

export function getBusinessWhatsAppE164(): string {
  const digits = getBusinessWhatsAppDigits()
  return digits.startsWith("+") ? digits : `+${digits}`
}

export function getBusinessWhatsAppUrl(text?: string): string {
  const phone = getBusinessWhatsAppDigits()
  const base = `https://wa.me/${phone}`
  if (!text?.trim()) return base
  return `${base}?text=${encodeURIComponent(text.trim())}`
}
