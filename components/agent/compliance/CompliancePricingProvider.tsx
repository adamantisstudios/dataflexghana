"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  BIRTH_CERTIFICATE_TIER_META,
  PASSPORT_TIER_META,
  DEFAULT_COMPLIANCE_PRICING_ROWS,
  defaultAmountForKey,
  type ComplianceCostTierMeta,
} from "@/lib/compliance-form-pricing-defaults"
import type { ServicePricingRow } from "@/lib/service-pricing-types"

export type ComplianceCostTier = {
  id: string
  days: string
  cost: number
  delivery: string
  description: string
}

type CompliancePricingContextValue = {
  loaded: boolean
  rows: ServicePricingRow[]
  amount: (key: string, fallback?: number) => number
  birthCertificateTiers: ComplianceCostTier[]
  passportTiers: ComplianceCostTier[]
}

const CompliancePricingContext = createContext<CompliancePricingContextValue | null>(null)

let cache: ServicePricingRow[] | null = null
let inflight: Promise<ServicePricingRow[]> | null = null

async function fetchPricingRows(): Promise<ServicePricingRow[]> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = fetch("/api/service-pricing")
    .then(async (res) => {
      const data = await res.json()
      if (!res.ok || !data.pricing?.length) return DEFAULT_COMPLIANCE_PRICING_ROWS
      cache = data.pricing as ServicePricingRow[]
      return cache
    })
    .catch(() => DEFAULT_COMPLIANCE_PRICING_ROWS)
    .finally(() => {
      inflight = null
    })

  return inflight
}

function buildTiers(meta: ComplianceCostTierMeta[], amountFn: (key: string, fallback: number) => number): ComplianceCostTier[] {
  return meta.map((tier) => ({
    id: tier.id,
    days: tier.days,
    delivery: tier.delivery,
    description: tier.description,
    cost: amountFn(tier.pricingKey, tier.defaultAmount),
  }))
}

function buildValue(rows: ServicePricingRow[], loaded: boolean): CompliancePricingContextValue {
  const map = new Map(rows.map((r) => [r.key, r.amount]))
  const amount = (key: string, fallback?: number) => {
    const v = map.get(key)
    if (v != null && Number.isFinite(v)) return v
    return fallback ?? defaultAmountForKey(key) ?? 0
  }

  return {
    loaded,
    rows,
    amount,
    birthCertificateTiers: buildTiers(BIRTH_CERTIFICATE_TIER_META, amount),
    passportTiers: buildTiers(PASSPORT_TIER_META, amount),
  }
}

export function CompliancePricingProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<ServicePricingRow[]>(cache ?? DEFAULT_COMPLIANCE_PRICING_ROWS)
  const [loaded, setLoaded] = useState(Boolean(cache))

  useEffect(() => {
    let cancelled = false
    fetchPricingRows().then((next) => {
      if (!cancelled) {
        setRows(next)
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => buildValue(rows, loaded), [rows, loaded])
  return <CompliancePricingContext.Provider value={value}>{children}</CompliancePricingContext.Provider>
}

export function useCompliancePricing(): CompliancePricingContextValue {
  const ctx = useContext(CompliancePricingContext)
  if (ctx) return ctx
  return buildValue(DEFAULT_COMPLIANCE_PRICING_ROWS, false)
}

export function invalidateCompliancePricingCache() {
  cache = null
}
