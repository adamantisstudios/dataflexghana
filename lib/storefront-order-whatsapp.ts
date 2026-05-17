import { NO_REGISTRATION_ADMIN_WHATSAPP } from "@/lib/no-registration-order-whatsapp"

export type StorefrontOrderLine = {
  network: string
  bundle_name: string
  size_gb: number
  customer_phone: string
  total_paid: number
}

export function formatStorefrontAdminWhatsAppMessage(params: {
  storeName: string
  items: StorefrontOrderLine[]
  cartTotal: number
  reference: string
}): string {
  const lines = [
    "📦 New Storefront Order",
    `Agent: ${params.storeName}`,
    "Items:",
    ...params.items.map(
      (item) =>
        `- ${item.network} ${item.bundle_name} → ${item.customer_phone} (GH₵ ${item.total_paid.toFixed(2)})`,
    ),
    `Total paid: GH₵ ${params.cartTotal.toFixed(2)}`,
    `Ref: ${params.reference}`,
    "Process all numbers above.",
  ]
  return lines.join("\n")
}

export function buildStorefrontAdminWhatsAppUrl(message: string): string {
  return `https://wa.me/${NO_REGISTRATION_ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`
}

export type StorefrontCartItemMeta = {
  data_bundle_id: string
  customer_phone: string
  base_cost: number
  agent_markup: number
  total_paid: number
  bundle_name: string
  network: string
  size_gb: number
}

export function parseStorefrontItemsFromMetadata(
  meta: Record<string, unknown>,
): StorefrontCartItemMeta[] {
  const raw = meta.items_json
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as StorefrontCartItemMeta[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      /* fall through to legacy single-item */
    }
  }

  if (meta.data_bundle_id && meta.customer_phone) {
    return [
      {
        data_bundle_id: String(meta.data_bundle_id),
        customer_phone: String(meta.customer_phone),
        base_cost: Number(meta.base_cost ?? 0),
        agent_markup: Number(meta.agent_markup ?? 0),
        total_paid: Number(meta.total_paid ?? 0),
        bundle_name: String(meta.bundle_name ?? "Data Bundle"),
        network: String(meta.network ?? "Unknown"),
        size_gb: Number(meta.size_gb ?? 0),
      },
    ]
  }

  return []
}
