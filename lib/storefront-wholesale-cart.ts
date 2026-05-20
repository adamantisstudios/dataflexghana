import type { PublicWholesaleProduct } from "@/lib/storefront-catalog"

export type StoredWholesaleCartLine = {
  lineId: string
  product: PublicWholesaleProduct
  quantity: number
}

function storageKey(agentId: string) {
  return `storefront_wholesale_cart_v1_${agentId}`
}

export function loadWholesaleCart(agentId: string): StoredWholesaleCartLine[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(storageKey(agentId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredWholesaleCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveWholesaleCart(agentId: string, lines: StoredWholesaleCartLine[]) {
  if (typeof window === "undefined") return
  try {
    if (lines.length === 0) {
      localStorage.removeItem(storageKey(agentId))
      return
    }
    localStorage.setItem(storageKey(agentId), JSON.stringify(lines))
  } catch {
    /* ignore quota errors */
  }
}
