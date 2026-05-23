import type { PublicFarmListing } from "@/lib/farm-types"

export type FarmCartLine = {
  lineId: string
  listing: PublicFarmListing
  quantity: number
}

function globalKey() {
  return "farmersfriend_cart_v1"
}

function storefrontKey(agentId: string) {
  return `storefront_farm_cart_v1_${agentId}`
}

export function loadFarmCart(scope: "global" | { agentId: string }): FarmCartLine[] {
  if (typeof window === "undefined") return []
  const key = scope === "global" ? globalKey() : storefrontKey(scope.agentId)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FarmCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveFarmCart(scope: "global" | { agentId: string }, lines: FarmCartLine[]) {
  if (typeof window === "undefined") return
  const key = scope === "global" ? globalKey() : storefrontKey(scope.agentId)
  try {
    if (lines.length === 0) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, JSON.stringify(lines))
  } catch {
    /* ignore */
  }
}

export function newFarmLineId() {
  return `farm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
