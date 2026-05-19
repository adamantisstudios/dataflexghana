"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { STOREFRONT_ORDERS_CHANGED_EVENT } from "@/lib/storefront-events"
import { Loader2, Wallet } from "lucide-react"

interface StorefrontOrder {
  id: string
  customer_phone: string
  total_paid: number
  agent_markup: number
  status: string
  created_at: string
  data_bundles?: { name: string; provider: string } | null
}

interface Props {
  agentId: string
  commissionBalance: number
  onBalanceChange?: () => void
}

export function StorefrontOrdersSection({ agentId, commissionBalance, onBalanceChange }: Props) {
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const requestPayout = async () => {
    if (commissionBalance <= 0) {
      toast.error("No commission balance to withdraw")
      return
    }
    if (!confirm(`Request payout of ₵${commissionBalance.toFixed(2)}? This will notify admin.`)) return
    setRequestingPayout(true)
    try {
      const res = await fetch("/api/agent/storefront/request-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ agentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.data?.message || "Payout requested")
      onBalanceChange?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed")
    } finally {
      setRequestingPayout(false)
    }
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const headers = getAgentAuthHeaders()
      const res = await fetch(
        `/api/agent/storefront-orders?agentId=${agentId}&page=${page}&limit=20`,
        { headers },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders(data.orders || [])
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [agentId, page])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 10000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") load(true)
    }
    const onOrdersChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ agentId?: string }>).detail
      if (!detail?.agentId || detail.agentId === agentId) load(true)
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener(STOREFRONT_ORDERS_CHANGED_EVENT, onOrdersChanged)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener(STOREFRONT_ORDERS_CHANGED_EVENT, onOrdersChanged)
    }
  }, [load, agentId])

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Wallet className="h-8 w-8 text-emerald-700 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Storefront commission balance</p>
              <p className="text-2xl font-bold text-emerald-800">
                ₵{Number(commissionBalance).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Request payout — admin pays via MoMo and marks it in Payouts.
              </p>
            </div>
          </div>
          <Button
            onClick={requestPayout}
            disabled={requestingPayout || commissionBalance <= 0}
            className="bg-emerald-700 hover:bg-emerald-800 shrink-0"
          >
            {requestingPayout ? "Submitting…" : "Request Payout"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storefront orders</CardTitle>
          <CardDescription>Customer purchases through your public store</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customer orders yet.</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundle</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Markup</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          {o.data_bundles?.name || "—"}
                          <span className="block text-xs text-muted-foreground">
                            {o.data_bundles?.provider}
                          </span>
                        </TableCell>
                        <TableCell>{o.customer_phone}</TableCell>
                        <TableCell>₵{Number(o.total_paid).toFixed(2)}</TableCell>
                        <TableCell>₵{Number(o.agent_markup).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden flex flex-col gap-3">
                {orders.map((o) => (
                  <div key={o.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">{o.data_bundles?.name || "Order"}</p>
                        <p className="text-xs text-muted-foreground">{o.data_bundles?.provider}</p>
                      </div>
                      <Badge variant="outline">{o.status}</Badge>
                    </div>
                    <p className="text-sm">{o.customer_phone}</p>
                    <div className="flex justify-between text-sm">
                      <span>Total ₵{Number(o.total_paid).toFixed(2)}</span>
                      <span className="text-emerald-700">Markup ₵{Number(o.agent_markup).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm self-center">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
