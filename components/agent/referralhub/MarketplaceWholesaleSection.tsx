"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { Trash2, Package } from "lucide-react"

interface WholesaleProduct {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
  custom_margin: number
}

interface Props {
  agentId: string
  settings: StoreSetting[]
  savedProducts: WholesaleProduct[]
  onSettingsChange: () => void
}

export function MarketplaceWholesaleSection({
  agentId,
  settings,
  savedProducts,
  onSettingsChange,
}: Props) {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<WholesaleProduct[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [margins, setMargins] = useState<Record<string, string>>({})

  const savedSettings = settings.filter((s) => s.item_type === "wholesale_product")

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), limit: "12" })
      if (search.trim()) q.set("search", search.trim())
      const res = await fetch(`/api/agent/store-wholesale-products?${q}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addToStore = async (productId: string, margin: number) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: productId,
          item_type: "wholesale_product",
          is_visible: true,
          custom_margin: margin,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Product added to your store")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save")
    }
  }

  const removeFromStore = async (productId: string) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: productId,
          item_type: "wholesale_product",
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Removed from store")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove")
    }
  }

  return (
    <Card id="wholesale-products-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Wholesale products
        </CardTitle>
        <CardDescription>
          Add products to your storefront with your markup. Customers pay via Paystack; you fulfill delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {savedProducts.length > 0 && (
          <div className="space-y-2">
            <Label>On your store ({savedProducts.length})</Label>
            <div className="grid gap-2">
              {savedProducts.map((p) => {
                const setting = savedSettings.find((s) => s.item_id === p.id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 border rounded-lg p-3 bg-emerald-50/50"
                  >
                    {p.image_url && (
                      <Image src={p.image_url} alt="" width={48} height={48} className="rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Base ₵{p.price.toFixed(2)} + markup ₵{Number(setting?.custom_margin ?? 0).toFixed(2)} = ₵
                        {(p.price + Number(setting?.custom_margin ?? 0)).toFixed(2)}
                      </p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => removeFromStore(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchProducts())}
          />
          <Button variant="outline" onClick={() => { setPage(1); fetchProducts() }}>
            Search
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {products.map((p) => {
              const onStore = savedSettings.some((s) => s.item_id === p.id)
              const margin = Number(margins[p.id] ?? "0")
              return (
                <div key={p.id} className="border rounded-xl p-3 space-y-2">
                  {p.image_url && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                      <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                    </div>
                  )}
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  <p className="text-sm font-semibold">Base: ₵{p.price.toFixed(2)}</p>
                  {!onStore ? (
                    <>
                      <div>
                        <Label className="text-xs">Your markup (₵)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={margins[p.id] ?? "0"}
                          onChange={(e) => setMargins((m) => ({ ...m, [p.id]: e.target.value }))}
                        />
                      </div>
                      <Button size="sm" className="w-full" onClick={() => addToStore(p.id, margin)}>
                        Add to store
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-emerald-700 font-medium">Already on your store</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
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
      </CardContent>
    </Card>
  )
}
