/** Admin WhatsApp for no-registration data bundle orders */
import { getBusinessWhatsAppDigits } from "@/lib/business-whatsapp"

export const NO_REGISTRATION_ADMIN_WHATSAPP = getBusinessWhatsAppDigits()

export type NoRegistrationOrderDetails = {
  phone: string
  network: string
  bundle: string
  amount: number
  reference: string
  timestamp?: Date
  paymentMethod?: "paystack" | "manual"
}

export function formatNoRegistrationDataBundleMessage(
  details: NoRegistrationOrderDetails,
): string {
  const ts = details.timestamp ?? new Date()
  const timeStr = ts
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "")

  const lines = [
    "📦 New No-Registration Order",
    `Phone: ${details.phone}`,
    `Network: ${details.network}`,
    `Bundle: ${details.bundle}`,
    `Amount: GHS ${details.amount.toFixed(2)}`,
    `Ref: ${details.reference}`,
    `Time: ${timeStr}`,
  ]

  if (details.paymentMethod === "manual") {
    lines.push(
      "",
      "✅ PAYMENT CONFIRMED (Manual MoMo)",
      "Payment Name: Adamantis Solutions (Francis Ani-Johnson .K)",
      "Payment Line: 0557943392",
    )
  } else {
    lines.push("", "✅ Payment confirmed via Paystack")
  }

  lines.push("", "Please process this data bundle for the customer.")

  return lines.join("\n")
}

export function buildAdminWhatsAppUrl(message: string): string {
  return `https://wa.me/${NO_REGISTRATION_ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`
}

export function isNoRegistrationPaystackMetadata(
  metadata: Record<string, unknown>,
): boolean {
  const source = metadata.source as string | undefined
  const orderType = metadata.order_type as string | undefined
  return (
    source === "no_registration_data_bundle" ||
    orderType === "no_registration" ||
    orderType === "no_registration_data_bundle"
  )
}

function parseNetworkFromService(service: string): string {
  const trimmed = service.trim()
  if (!trimmed) return ""

  const parenMatch = trimmed.match(/\((MTN|Telecel|AirtelTigo)\)/i)
  if (parenMatch) return normalizeNetwork(parenMatch[1])

  const prefixMatch = trimmed.match(/^(MTN|Telecel|AirtelTigo)\b/i)
  if (prefixMatch) return normalizeNetwork(prefixMatch[1])

  if (/^Data Bundle:\s*/i.test(trimmed)) {
    const inner = trimmed.replace(/^Data Bundle:\s*/i, "")
    const innerParen = inner.match(/\((MTN|Telecel|AirtelTigo)\)/i)
    if (innerParen) return normalizeNetwork(innerParen[1])
  }

  return ""
}

function normalizeNetwork(value: string): string {
  const lower = value.toLowerCase()
  if (lower === "mtn") return "MTN"
  if (lower === "telecel") return "Telecel"
  if (lower === "airteltigo") return "AirtelTigo"
  return value
}

export function extractOrderDetailsFromPaystackMetadata(
  metadata: Record<string, unknown>,
  reference: string,
  amount: number,
): NoRegistrationOrderDetails {
  const service = String(metadata.service || "")
  const network =
    String(metadata.orderNetwork || "").trim() || parseNetworkFromService(service)
  const bundle =
    String(metadata.orderDataBundle || "").trim() ||
    service.replace(/^Data Bundle:\s*/i, "").trim() ||
    "Data Bundle"

  return {
    phone: String(metadata.phone || ""),
    network: network || "Unknown",
    bundle,
    amount,
    reference,
    paymentMethod: "paystack",
  }
}
