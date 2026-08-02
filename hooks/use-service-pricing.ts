"use client"

import { useEffect, useState } from "react"
import {
  complianceFormAdminPrice,
  complianceFormAgentCommission,
} from "@/lib/storefront-catalog"
import { SERVICE_PRICING_KEYS } from "@/lib/service-pricing-constants"

type ServicePricingState = {
  compliancePrice: number
  complianceCommission: number
  loaded: boolean
}

let cache: ServicePricingState | null = null
let inflight: Promise<ServicePricingState> | null = null

async function fetchPricing(): Promise<ServicePricingState> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = fetch("/api/service-pricing")
    .then(async (res) => {
      const data = await res.json()
      if (!res.ok || !data.pricing) {
        return {
          compliancePrice: complianceFormAdminPrice(),
          complianceCommission: complianceFormAgentCommission(),
          loaded: true,
        }
      }
      const priceRow = data.pricing.find(
        (r: { key: string }) => r.key === SERVICE_PRICING_KEYS.COMPLIANCE_SOLE,
      )
      const commissionRow = data.pricing.find(
        (r: { key: string }) => r.key === SERVICE_PRICING_KEYS.COMPLIANCE_SOLE_COMMISSION,
      )
      const next = {
        compliancePrice: Number(priceRow?.amount ?? complianceFormAdminPrice()),
        complianceCommission: Number(commissionRow?.amount ?? complianceFormAgentCommission()),
        loaded: true,
      }
      cache = next
      return next
    })
    .catch(() => ({
      compliancePrice: complianceFormAdminPrice(),
      complianceCommission: complianceFormAgentCommission(),
      loaded: true,
    }))
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function useServicePricing() {
  const [state, setState] = useState<ServicePricingState>(
    cache ?? {
      compliancePrice: complianceFormAdminPrice(),
      complianceCommission: complianceFormAgentCommission(),
      loaded: false,
    },
  )

  useEffect(() => {
    let cancelled = false
    fetchPricing().then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export function invalidateServicePricingCache() {
  cache = null
}
