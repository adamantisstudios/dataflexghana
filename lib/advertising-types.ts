export const AD_MEDIA_TYPES = ["radio", "tv", "online", "print", "outdoor", "other"] as const
export type AdMediaType = (typeof AD_MEDIA_TYPES)[number]

export const AD_ORDER_STATUSES = ["pending", "booked", "aired", "completed", "cancelled"] as const
export type AdOrderStatus = (typeof AD_ORDER_STATUSES)[number]

export const AD_MEDIA_LABELS: Record<AdMediaType, string> = {
  radio: "Radio",
  tv: "TV",
  online: "Online",
  print: "Print",
  outdoor: "Outdoor",
  other: "Other",
}

export const AD_ORDER_STATUS_LABELS: Record<AdOrderStatus, string> = {
  pending: "Pending",
  booked: "Booked",
  aired: "Aired",
  completed: "Completed",
  cancelled: "Cancelled",
}

export type AdPackage = {
  id: string
  station_name: string
  media_type: AdMediaType
  package_name: string
  description: string | null
  number_of_spots: number | null
  spot_duration: string | null
  price: number
  agent_commission: number
  custom_fields: Record<string, string>
  is_active: boolean
  created_at: string
}

export type AdOrder = {
  id: string
  package_id: string | null
  agent_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_business: string | null
  ad_message: string | null
  total_paid: number
  paystack_reference: string | null
  status: AdOrderStatus
  admin_notes: string | null
  created_at: string
  ad_packages?: AdPackage | null
  agents?: { full_name: string; phone_number: string } | null
}

export type PublicAdPackage = {
  id: string
  station_name: string
  media_type: AdMediaType
  package_name: string
  description: string | null
  number_of_spots: number | null
  spot_duration: string | null
  price: number
  agent_commission: number
  custom_fields: Record<string, string>
}

export function parseCustomFields(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k.trim()) out[k.trim()] = String(v ?? "")
  }
  return out
}

export function customFieldsToRows(fields: Record<string, string>): { key: string; value: string }[] {
  return Object.entries(fields).map(([key, value]) => ({ key, value }))
}

export function rowsToCustomFields(rows: { key: string; value: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const k = row.key.trim()
    if (k) out[k] = row.value.trim()
  }
  return out
}

export function isAdMediaType(v: string): v is AdMediaType {
  return (AD_MEDIA_TYPES as readonly string[]).includes(v)
}

export function isAdOrderStatus(v: string): v is AdOrderStatus {
  return (AD_ORDER_STATUSES as readonly string[]).includes(v)
}
