"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import { Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react"
import type { EProduct } from "@/lib/voucher-products"

type EditableProduct = EProduct & { _dirty?: boolean }

export default function VoucherProductsAdminTab() {
  const [products, setProducts] = useState<EditableProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    image_url: "",
    price: "",
    quantity: "100",
    status: "published",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/voucher-products", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setProducts(data.products || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load voucher products")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const seedDefaults = async () => {
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/voucher-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ action: "seed" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Import failed")
      setProducts(data.products || [])
      toast.success(
        data.inserted > 0
          ? `Imported ${data.inserted} default products`
          : "Products already exist in database",
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed")
    } finally {
      setSeeding(false)
    }
  }

  const updateLocal = (id: string, field: keyof EProduct, value: string | number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value, _dirty: true } : p)),
    )
  }

  const saveProduct = async (product: EditableProduct) => {
    setSavingId(product.id)
    try {
      const res = await fetch(`/api/admin/voucher-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          image_url: product.image_url,
          price: product.price,
          quantity: product.quantity,
          status: product.status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...data.product, _dirty: false } : p)),
      )
      toast.success("Product saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingId(null)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this voucher product?")) return
    try {
      const res = await fetch(`/api/admin/voucher-products/${id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success("Product deleted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const addProduct = async () => {
    const price = Number(newProduct.price)
    if (!newProduct.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid price")
      return
    }
    try {
      const res = await fetch("/api/admin/voucher-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({
          title: newProduct.title,
          description: newProduct.description,
          image_url: newProduct.image_url,
          price,
          quantity: Number(newProduct.quantity) || 0,
          status: newProduct.status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Create failed")
      setProducts((prev) => [...prev, data.product])
      setNewProduct({
        title: "",
        description: "",
        image_url: "",
        price: "",
        quantity: "100",
        status: "published",
      })
      setShowAdd(false)
      toast.success("Product added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading voucher products…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Voucher &amp; educational products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prices shown on the public /voucher page. Agent registration fees are not managed here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={seedDefaults} disabled={seeding}>
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Import defaults
          </Button>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" />
            Add product
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New product</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Image URL</Label>
              <Input
                value={newProduct.image_url}
                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (GHS)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stock quantity</Label>
              <Input
                type="number"
                min="0"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={addProduct}>Create</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No products in the database yet. Click &quot;Import defaults&quot; to load the built-in catalog, or add
            products manually.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 md:col-span-2 lg:col-span-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={product.status === "published" ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                    {product._dirty ? <Badge variant="outline">Unsaved</Badge> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveProduct(product)}
                      disabled={savingId === product.id}
                    >
                      {savingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={product.title} onChange={(e) => updateLocal(product.id, "title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price (GHS)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => updateLocal(product.id, "price", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={product.description}
                    onChange={(e) => updateLocal(product.id, "description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={product.quantity}
                    onChange={(e) => updateLocal(product.id, "quantity", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Image URL</Label>
                  <Input
                    value={product.image_url}
                    onChange={(e) => updateLocal(product.id, "image_url", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={product.status}
                    onValueChange={(v) => updateLocal(product.id, "status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
