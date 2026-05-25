"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"

type Pkg = {
  id: string
  name: string
  max_listings: number
  price: number
  includes_analytics: boolean
  is_active: boolean
}

type Sub = {
  id: string
  agent_id: string
  status: string
  paystack_reference: string | null
  expires_at: string | null
  created_at: string
  package?: { name: string; max_listings: number }
}

type Prod = {
  id: string
  agent_id: string
  title: string
  price: number
  is_active: boolean
  view_count: number
}

export default function ListingPackagesAdminTab() {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Pkg[]>([])
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [products, setProducts] = useState<Prod[]>([])
  const [agentIdDisable, setAgentIdDisable] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/listing-packages", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPackages(data.packages || [])
      setSubscriptions(data.subscriptions || [])
      setProducts(data.products || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const savePackage = async (pkg: Pkg) => {
    const res = await fetch("/api/admin/listing-packages", {
      method: "PATCH",
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(pkg),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else toast.success("Package updated")
  }

  const activateSub = async (id: string) => {
    const res = await fetch("/api/admin/listing-packages/subscriptions", {
      method: "PATCH",
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "activate" }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else {
      toast.success("Subscription activated (30 days)")
      load()
    }
  }

  const toggleProduct = async (id: string, is_active: boolean) => {
    const res = await fetch("/api/admin/listing-packages/products", {
      method: "PATCH",
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    })
    if (!res.ok) toast.error("Update failed")
    else load()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return
    const res = await fetch(`/api/admin/listing-packages/products?id=${id}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    })
    if (!res.ok) toast.error("Delete failed")
    else {
      toast.success("Deleted")
      load()
    }
  }

  const disableAgentListings = async (can_list_products: boolean) => {
    if (!agentIdDisable.trim()) {
      toast.error("Enter agent ID")
      return
    }
    const res = await fetch("/api/admin/listing-packages/agents", {
      method: "PATCH",
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentIdDisable.trim(), can_list_products }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else toast.success(can_list_products ? "Listings enabled" : "Listings disabled")
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="agents">Agent access</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4 space-y-3">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={pkg.name}
                    onChange={(e) =>
                      setPackages((list) =>
                        list.map((p) => (p.id === pkg.id ? { ...p, name: e.target.value } : p)),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Price (GHS)</Label>
                  <Input
                    type="number"
                    value={pkg.price}
                    onChange={(e) =>
                      setPackages((list) =>
                        list.map((p) => (p.id === pkg.id ? { ...p, price: Number(e.target.value) } : p)),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Max listings</Label>
                  <Input
                    type="number"
                    value={pkg.max_listings}
                    onChange={(e) =>
                      setPackages((list) =>
                        list.map((p) =>
                          p.id === pkg.id ? { ...p, max_listings: parseInt(e.target.value, 10) } : p,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pkg.includes_analytics}
                    onCheckedChange={(v) =>
                      setPackages((list) =>
                        list.map((p) => (p.id === pkg.id ? { ...p, includes_analytics: v } : p)),
                      )
                    }
                  />
                  <span className="text-xs">Analytics</span>
                </div>
                <Button onClick={() => savePackage(packages.find((p) => p.id === pkg.id)!)}>Save</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4 space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : (
            subscriptions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{s.package?.name || "Package"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.agent_id}</p>
                    <Badge className="mt-1">{s.status}</Badge>
                    {s.expires_at && (
                      <p className="text-xs mt-1">Expires {new Date(s.expires_at).toLocaleString()}</p>
                    )}
                  </div>
                  {s.status === "pending" && (
                    <Button size="sm" onClick={() => activateSub(s.id)}>
                      Activate (30 days)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-2">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs font-mono text-muted-foreground">{p.agent_id}</p>
                  <p>₵{Number(p.price).toFixed(2)} · {p.view_count} views</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleProduct(p.id, !p.is_active)}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disable / enable agent listings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Agent UUID"
                value={agentIdDisable}
                onChange={(e) => setAgentIdDisable(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button variant="destructive" onClick={() => disableAgentListings(false)}>
                Disable listings
              </Button>
              <Button onClick={() => disableAgentListings(true)}>Enable listings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
