"use client"

import { useCallback, useEffect, useState } from "react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import {
  Database,
  ShoppingBag,
  ShoppingBasket,
  Megaphone,
  Award,
  Leaf,
  Banknote,
  RefreshCw,
  Loader2,
  ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const BRAND = "#0E8F3D"

type PendingOrdersPayload = {
  data_orders: unknown[]
  storefront_orders: unknown[]
  grocery_requests: unknown[]
  ad_orders: unknown[]
  influencer_orders: unknown[]
  farm_orders: unknown[]
  withdrawals: unknown[]
  total_pending: number
}

type CategoryCard = {
  key: keyof PendingOrdersPayload
  label: string
  hrefTab: string
  icon: LucideIcon
}

const CATEGORIES: CategoryCard[] = [
  { key: "data_orders", label: "Data Orders", hrefTab: "orders", icon: Database },
  { key: "storefront_orders", label: "Storefront Orders", hrefTab: "storefront-manager", icon: ShoppingBag },
  { key: "grocery_requests", label: "Grocery Requests", hrefTab: "grocery-requests", icon: ShoppingBasket },
  { key: "ad_orders", label: "Advertising", hrefTab: "advertising", icon: Megaphone },
  { key: "influencer_orders", label: "Influencers", hrefTab: "micro-influencers", icon: Award },
  { key: "farm_orders", label: "Farmers Friend", hrefTab: "farmers-friend", icon: Leaf },
  { key: "withdrawals", label: "Withdrawals", hrefTab: "payouts", icon: Banknote },
]

type Props = {
  onNavigateTab?: (tabId: string) => void
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] rounded-xl bg-white/80 border border-slate-100 shadow-sm animate-pulse"
        />
      ))}
    </div>
  )
}

export function PendingOrdersFeed({ onNavigateTab }: Props) {
  const [data, setData] = useState<PendingOrdersPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/pending-orders", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error("[PendingOrdersFeed]", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [load])

  const total = data?.total_pending ?? 0

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Pending orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading && !data ? "Loading…" : `${total} item${total === 1 ? "" : "s"} need attention`}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          aria-label="Refresh pending orders"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4">
        {loading && !data ? (
          <SkeletonCards />
        ) : !data || total === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No pending orders right now.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {CATEGORIES.map(({ key, label, hrefTab, icon: Icon }) => {
              const count = (data[key] as unknown[])?.length ?? 0
              if (count === 0) return null

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onNavigateTab?.(hrefTab)}
                  className="group flex items-center gap-3 w-full text-left rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm hover:shadow-md hover:border-[#0E8F3D]/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8F3D]/40"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${BRAND}14`, color: BRAND }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tap to manage</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ color: BRAND }}
                    >
                      {count}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0E8F3D] transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
