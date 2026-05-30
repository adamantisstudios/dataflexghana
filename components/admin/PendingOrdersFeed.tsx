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
  FileText,
  Shield,
  RefreshCw,
  ChevronRight,
  Package,
  Home,
  MessageCircle,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PendingOrdersCategoryKey, PendingOrdersPayload } from "@/lib/admin-pending-orders"

const BRAND = "#0E8F3D"

type CategoryCard = {
  key: PendingOrdersCategoryKey
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
  { key: "writing_orders", label: "Writing Orders", hrefTab: "professional-writing", icon: FileText },
  { key: "compliance_orders", label: "Storefront Compliance", hrefTab: "compliance", icon: Shield },
  { key: "form_submissions", label: "Compliance Forms", hrefTab: "compliance", icon: FileText },
  { key: "bulk_orders", label: "Bulk Orders", hrefTab: "bulk-orders", icon: Package },
  { key: "mtnafa_registrations", label: "AFA Registrations", hrefTab: "bulk-orders", icon: Package },
  { key: "wholesale_orders", label: "Wholesale Orders", hrefTab: "wholesale", icon: ShoppingBag },
  { key: "property_requests", label: "Property Requests", hrefTab: "properties", icon: Home },
  { key: "referrals", label: "Referrals", hrefTab: "referrals", icon: MessageCircle },
  { key: "wallet_topups", label: "Wallet Top-ups", hrefTab: "wallets", icon: Wallet },
  { key: "professional_writing_submissions", label: "Writing (Legacy)", hrefTab: "professional-writing", icon: FileText },
  { key: "withdrawals", label: "Withdrawals", hrefTab: "payouts", icon: Banknote },
]

type Props = {
  onNavigateTab?: (tabId: string) => void
  onTotalChange?: (total: number) => void
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

function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold tabular-nums leading-none shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function PendingOrdersFeed({ onNavigateTab, onTotalChange }: Props) {
  const [data, setData] = useState<PendingOrdersPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/pending-orders", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      if (res.ok) {
        const json = (await res.json()) as PendingOrdersPayload
        setData(json)
        onTotalChange?.(json.total_pending ?? 0)
        window.dispatchEvent(
          new CustomEvent("admin-pending-orders-total", { detail: json.total_pending ?? 0 }),
        )
      }
    } catch (e) {
      console.error("[PendingOrdersFeed]", e)
    } finally {
      setLoading(false)
    }
  }, [onTotalChange])

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

  const getCategoryCount = (key: PendingOrdersCategoryKey) =>
    data?.counts?.[key] ?? (data?.[key] as unknown[] | undefined)?.length ?? 0

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Pending orders</h2>
            {!loading && total > 0 && <PendingBadge count={total} />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading && !data ? "Loading…" : `${total} item${total === 1 ? "" : "s"} need attention`}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
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
              const count = getCategoryCount(key)
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
