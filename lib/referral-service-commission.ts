/** Agent earnings (GHS) for a catalog referral service in Referral Hub / storefront. */
export function referralServiceAgentCommission(service: {
  commission_amount?: number | null
  product_cost?: number | null
  commission_rate?: number | null
}): number {
  const fixed = Number(service.commission_amount ?? 0)
  if (Number.isFinite(fixed) && fixed > 0) return fixed

  const cost = Number(service.product_cost ?? 0)
  const rate = Number(service.commission_rate ?? 0)
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return 0
  }

  if (rate <= 1) return cost * rate
  if (rate <= 100) return cost * (rate / 100)
  return rate
}
