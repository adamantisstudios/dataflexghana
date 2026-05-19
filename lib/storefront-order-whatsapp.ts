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

export function metadataValue(meta: Record<string, unknown>, key: string): unknown {
  if (meta[key] !== undefined && meta[key] !== null) return meta[key]

  const customFields = meta.custom_fields
  if (Array.isArray(customFields)) {
    for (const field of customFields) {
      if (field && typeof field === "object") {
        const row = field as { variable_name?: string; display_name?: string; value?: unknown }
        const name = row.variable_name || row.display_name
        if (name === key) return row.value
      }
    }
  }

  return undefined
}

export function parseStorefrontItemsFromMetadata(
  meta: Record<string, unknown>,
): StorefrontCartItemMeta[] {
  const raw = metadataValue(meta, "items_json")
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as StorefrontCartItemMeta[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      /* fall through to legacy single-item */
    }
  }

  const bundleId = metadataValue(meta, "data_bundle_id")
  const customerPhone = metadataValue(meta, "customer_phone")
  if (bundleId && customerPhone) {
    return [
      {
        data_bundle_id: String(bundleId),
        customer_phone: String(customerPhone),
        base_cost: Number(metadataValue(meta, "base_cost") ?? 0),
        agent_markup: Number(metadataValue(meta, "agent_markup") ?? 0),
        total_paid: Number(metadataValue(meta, "total_paid") ?? 0),
        bundle_name: String(metadataValue(meta, "bundle_name") ?? "Data Bundle"),
        network: String(metadataValue(meta, "network") ?? "Unknown"),
        size_gb: Number(metadataValue(meta, "size_gb") ?? 0),
      },
    ]
  }

  return []
}
