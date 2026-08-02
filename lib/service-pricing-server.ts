import { getAdminClient } from "@/lib/supabase-base"
import {
  COMPLIANCE_SOLE_PROPRIETORSHIP_AGENT_COMMISSION,
  DEFAULT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE,
} from "@/lib/storefront-catalog"
import {
  DEFAULT_COMPLIANCE_PRICING_ROWS,
  SERVICE_PRICING_KEYS,
  defaultAmountForKey,
} from "@/lib/compliance-form-pricing-defaults"
import type { ServicePricingRow } from "@/lib/service-pricing-types"

export { SERVICE_PRICING_KEYS } from "@/lib/service-pricing-constants"
export type { ServicePricingRow } from "@/lib/service-pricing-types"

function mergeWithDefaults(rows: ServicePricingRow[]): ServicePricingRow[] {
  const map = new Map(DEFAULT_COMPLIANCE_PRICING_ROWS.map((d) => [d.key, { ...d }]))
  for (const row of rows) {
    map.set(row.key, row)
  }
  return DEFAULT_COMPLIANCE_PRICING_ROWS.map((d) => map.get(d.key)!)
}

export async function fetchServicePricingRows(): Promise<ServicePricingRow[]> {
  const db = getAdminClient()
  const { data, error } = await db.from("platform_service_pricing").select("*").order("key")

  if (error) {
    console.warn("fetchServicePricingRows:", error.message)
    return DEFAULT_COMPLIANCE_PRICING_ROWS
  }

  if (!data?.length) return DEFAULT_COMPLIANCE_PRICING_ROWS

  return mergeWithDefaults(
    data.map((row) => ({
      key: String(row.key),
      label: String(row.label ?? ""),
      amount: Number(row.amount ?? 0),
      description: row.description != null ? String(row.description) : null,
      category: String(row.category ?? "compliance"),
      updated_at: row.updated_at ? String(row.updated_at) : undefined,
    })),
  )
}

export async function getPricingAmount(key: string, fallback?: number): Promise<number> {
  const rows = await fetchServicePricingRows()
  const row = rows.find((r) => r.key === key)
  const amount = row?.amount ?? fallback ?? defaultAmountForKey(key) ?? 0
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

export async function getComplianceSoleProprietorshipPrice(): Promise<number> {
  const amount = await getPricingAmount(
    SERVICE_PRICING_KEYS.COMPLIANCE_SOLE,
    DEFAULT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE,
  )
  return amount > 0 ? amount : DEFAULT_COMPLIANCE_SOLE_PROPRIETORSHIP_PRICE
}

export async function getComplianceSoleProprietorshipCommission(): Promise<number> {
  return getPricingAmount(
    SERVICE_PRICING_KEYS.COMPLIANCE_SOLE_COMMISSION,
    COMPLIANCE_SOLE_PROPRIETORSHIP_AGENT_COMMISSION,
  )
}

export function compliancePriceToKobo(priceGhs: number): number {
  return Math.round(priceGhs * 100)
}
