"use client"

import { useCallback, useEffect, useState } from "react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type PendingItem = {
  id: string
  created_at: string
  customer_phone?: string | null
  agent_name?: string
  product?: string
  amount?: number | null
  client_name?: string | null
  href_tab: string
}

type PendingOrdersPayload = {
  data_orders: PendingItem[]
  storefront_orders: PendingItem[]
  grocery_requests: PendingItem[]
  ad_orders: PendingItem[]
  influencer_orders: PendingItem[]
  farm_orders: PendingItem[]
  withdrawals: PendingItem[]
  total_pending: number
}

const CATEGORIES: { key: keyof PendingOrdersPayload; label: string }[] = [
  { key: "data_orders", label: "Data Orders" },
  { key: "storefront_orders", label: "Storefront" },
  { key: "grocery_requests", label: "Grocery" },
  { key: "ad_orders", label: "Advertising" },
  { key: "influencer_orders", label: "Influencers" },
  { key: "farm_orders", label: "Farmers Friend" },
  { key: "withdrawals", label: "Withdrawals" },
]

type Props = {
  onNavigateTab?: (tabId: string) => void
}

function formatAmount(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(Number(amount))) return null
  return `₵${Number(amount).toLocaleString()}`
}

function OrderList({
  items,
  tabId,
  onNavigateTab,
}: {
  items: PendingItem[]
  tabId: string
  onNavigateTab?: (tabId: string) => void
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No pending items in this category.</p>
  }

  return (
    <ul className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <li
          key={item.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-white p-3 text-sm"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium truncate">
              {item.product || "Order"}{" "}
              <span className="text-muted-foreground font-normal">#{String(item.id).slice(0, 8)}</span>
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.agent_name && <span>{item.agent_name}</span>}
              {item.agent_name && item.customer_phone && " · "}
              {item.customer_phone && <span>{item.customer_phone}</span>}
              {item.client_name && <span> · Client: {item.client_name}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.created_at
                ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                : "—"}
              {formatAmount(item.amount) && ` · ${formatAmount(item.amount)}`}
            </p>
          </div>
          {onNavigateTab && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onNavigateTab(tabId)}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Manage
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

export function PendingOrdersFeed({ onNavigateTab }: Props) {
  const [data, setData] = useState<PendingOrdersPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/pending-orders", {
        headers: getAdminAuthHeaders(),
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

  const defaultTab =
    CATEGORIES.find((c) => (data?.[c.key] as PendingItem[] | undefined)?.length)?.key ?? "data_orders"

  return (
    <Card className="border-2 border-indigo-100 shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Pending Orders &amp; Requests</CardTitle>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {loading && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You have{" "}
            <Badge className="bg-indigo-600 text-white align-middle mx-1">
              {data?.total_pending ?? 0}
            </Badge>{" "}
            pending items across all categories.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {data && data.total_pending === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-6">No pending orders right now.</p>
        ) : data ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1">
              {CATEGORIES.map(({ key, label }) => {
                const count = (data[key] as PendingItem[])?.length ?? 0
                if (count === 0) return null
                return (
                  <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
                    {label}
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      {count}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {CATEGORIES.map(({ key, label }) => {
              const items = (data[key] as PendingItem[]) || []
              if (items.length === 0) return null
              const tabId = items[0]?.href_tab || key
              return (
                <TabsContent key={key} value={key} className="mt-3">
                  <OrderList items={items} tabId={tabId} onNavigateTab={onNavigateTab} />
                  {items.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Showing 5 of {items.length} — open {label} for full list
                    </p>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  )
}
