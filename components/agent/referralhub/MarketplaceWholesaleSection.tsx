"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { Trash2, Package } from "lucide-react"
import { WholesaleProductThumb } from "@/components/wholesale/WholesaleProductThumb"

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

  const saveSetting = async (
    productId: string,
    fields: { is_visible: boolean; custom_margin: number },
  ) => {
    const res = await fetch("/api/agent/store-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
      body: JSON.stringify({
        agentId,
        item_id: productId,
        item_type: "wholesale_product",
        ...fields,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to save")
    onSettingsChange()
  }

  const addToStore = async (productId: string, margin: number) => {
    try {
      await saveSetting(productId, { is_visible: true, custom_margin: margin })
      toast.success("Product added to your store")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save")
    }
  }

  const toggleVisibility = async (productId: string, visible: boolean, margin: number) => {
    try {
      await saveSetting(productId, { is_visible: visible, custom_margin: margin })
      toast.success(visible ? "Product visible on store" : "Product hidden from store")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  const updateMargin = async (productId: string, margin: number, visible: boolean) => {
    try {
      await saveSetting(productId, { is_visible: visible, custom_margin: margin })
      toast.success("Markup updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
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
          Same product cards as the agent wholesale shop — add items with your markup for your storefront.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {savedProducts.length > 0 && (
          <div className="space-y-2">
            <Label>On your store ({savedProducts.length})</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {savedProducts.map((p) => {
                const setting = savedSettings.find((s) => s.item_id === p.id)
                const margin = Number(setting?.custom_margin ?? 0)
                const visible = setting?.is_visible ?? true
                return (
                  <Card key={p.id} className="overflow-hidden border-emerald-200 bg-emerald-50/30">
                    <WholesaleProductThumb src={p.image_url} alt={p.name} className="max-h-28" />
                    <CardContent className="p-2.5 space-y-2">
                      <p className="font-medium text-xs line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        ₵{(p.price + margin).toFixed(2)}
                      </p>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">Visible</Label>
                        <Switch
                          checked={visible}
                          onCheckedChange={(v) => toggleVisibility(p.id, v, margin)}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          className="h-7 text-xs flex-1"
                          defaultValue={margin}
                          onBlur={(e) =>
                            updateMargin(p.id, parseFloat(e.target.value) || 0, visible)
                          }
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeFromStore(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => {
              const onStore = savedSettings.some((s) => s.item_id === p.id)
              const margin = Number(margins[p.id] ?? "0")
              return (
                <Card
                  key={p.id}
                  className="overflow-hidden border-emerald-200 bg-white/95 hover:shadow-md transition-shadow"
                >
                  <WholesaleProductThumb src={p.image_url} alt={p.name} />
                  <CardContent className="p-2.5 md:p-3 space-y-2">
                    <h3 className="text-xs md:text-sm font-medium text-emerald-900 line-clamp-2 leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs font-bold text-emerald-600">GH₵{p.price.toFixed(2)}</p>
                    {!onStore ? (
                      <>
                        <div>
                          <Label className="text-[10px]">Markup (₵)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            className="h-8 text-xs"
                            value={margins[p.id] ?? "0"}
                            onChange={(e) => setMargins((m) => ({ ...m, [p.id]: e.target.value }))}
                          />
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => addToStore(p.id, margin)}
                        >
                          Add to store
                        </Button>
                      </>
                    ) : (
                      <p className="text-[10px] text-emerald-700 font-medium text-center py-1">
                        On your store
                      </p>
                    )}
                  </CardContent>
                </Card>
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
