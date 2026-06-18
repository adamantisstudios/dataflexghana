/** Storefront catalog types — sandbox tables only. */

export const STORE_ITEM_TYPES = [
  "data_bundle",
  "referral_service",
  "wholesale_product",
  "compliance_form",
  "ad_package",
  "writing_service",
  "property",
] as const

export type StoreItemType = (typeof STORE_ITEM_TYPES)[number]

export const COMPLIANCE_FORM_SOLE_PROPRIETORSHIP = "sole_proprietorship" as const

/** Stable UUID for agent_store_settings.item_id (Postgres UUID column). */
export const COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID =
  "c0ffee00-0001-4001-8001-000000000001"

const LEGACY_COMPLIANCE_ITEM_IDS = new Set([
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
  "sole_proprietorship",
])

export function normalizeStoreItemId(itemId: string, itemType: StoreItemType): string {
  if (itemType === "compliance_form") {
    return COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID
  }
  return itemId
}

export function isComplianceFormSettingItemId(itemId: string): boolean {
  return (
    itemId === COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID ||
    LEGACY_COMPLIANCE_ITEM_IDS.has(itemId)
  )
}

/** Fixed agent commission (GHS) when a customer pays for Sole Proprietorship on the storefront. */
export const COMPLIANCE_SOLE_PROPRIETORSHIP_AGENT_COMMISSION = 50

/** Admin base price (GHS) — override via env on server. */
export const DEFAULT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE = 530

/** GH₵530.00 → Paystack amount in kobo */
export const COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO = 530 * 100

export type PublicWholesaleProduct = {
  id: string
  name: string
  description: string | null
  base_price: number
  custom_margin: number
  retail_price: number
  image_url: string | null
  category: string | null
}

export type PublicComplianceForm = {
  form_type: typeof COMPLIANCE_FORM_SOLE_PROPRIETORSHIP
  title: string
  description: string
  admin_price: number
}

export type BuyerDetails = {
  full_name: string
  location: string
  address: string
  contact_number: string
  extra_notes?: string
}

export function complianceFormAdminPrice(): number {
  const raw = process.env.STOREFRONT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE
  const n = raw ? Number(raw) : DEFAULT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE
}

export function complianceFormAgentCommission(): number {
  const raw = process.env.STOREFRONT_COMPLIANCE_SOLE_PROPRIETORSHIP_AGENT_COMMISSION
  const n = raw ? Number(raw) : COMPLIANCE_SOLE_PROPRIETORSHIP_AGENT_COMMISSION
  return Number.isFinite(n) && n >= 0 ? n : COMPLIANCE_SOLE_PROPRIETORSHIP_AGENT_COMMISSION
}

export function isStoreItemType(value: string): value is StoreItemType {
  return (STORE_ITEM_TYPES as readonly string[]).includes(value)
}

export function marginForItemType(itemType: StoreItemType, customMargin: number): number {
  if (
    itemType === "referral_service" ||
    itemType === "compliance_form" ||
    itemType === "ad_package" ||
    itemType === "writing_service" ||
    itemType === "property"
  ) {
    return 0
  }
  return Number(customMargin ?? 0)
}
