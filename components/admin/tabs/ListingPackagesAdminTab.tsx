"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import { Loader2, RefreshCw, ChevronDown, Settings2 } from "lucide-react"
import { getPackageFeatures, type ListingFeatures } from "@/lib/listing-package-utils"

type Pkg = {
  id: string
  name: string
  max_listings: number
  price: number
  includes_analytics: boolean
  is_active: boolean
  features?: ListingFeatures | null
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

const FEATURE_GROUPS: {
  label: string
  keys: (keyof ListingFeatures)[]
}[] = [
  {
    label: "Storefront widgets",
    keys: ["whatsapp_button", "whatsapp_widget", "social_share", "whatsapp_group"],
  },
  {
    label: "Product enhancements",
    keys: [
      "featured_badge",
      "priority",
      "reviews",
      "qr_code",
      "video_embed",
      "sold_badge",
      "limited_offer_badge",
      "product_boost",
      "coupon_codes",
    ],
  },
  {
    label: "Analytics & tools",
    keys: ["analytics", "heatmap"],
  },
  {
    label: "Premium add-ons",
    keys: [
      "inquiry_form",
      "stock_counter",
      "related_products",
      "affiliate_share_link",
      "custom_slug",
      "verified_seller_badge",
      "pdf_brochure",
      "banner_slider",
      "email_support",
    ],
  },
]

const FEATURE_LABELS: Record<keyof ListingFeatures, string> = {
  whatsapp_button: "WhatsApp buy button",
  whatsapp_widget: "WhatsApp floating widget",
  social_share: "Social share buttons",
  whatsapp_group: "WhatsApp group link",
  featured_badge: "Featured badge",
  priority: "Priority placement",
  reviews: "Reviews & ratings",
  qr_code: "QR code on product",
  custom_slug: "Custom storefront slug",
  video_embed: "Video embed on listing",
  email_support: "Email support button",
  blog_posts: "Blog posts limit",
  banner_slider: "Homepage banner slider",
  sold_badge: "Sold badge",
  inquiry_form: "Inquiry form",
  stock_counter: "Stock counter on listing",
  related_products: "Related products block",
  limited_offer_badge: "Limited-time offer badge",
  product_boost: "Product boost",
  coupon_codes: "Coupon codes",
  affiliate_share_link: "Share & earn affiliate link",
  verified_seller_badge: "Verified seller badge",
  pdf_brochure: "PDF brochure download",
  analytics: "Listing analytics",
  heatmap: "Click heatmap analytics",
  max_images: "Max images per product",
  max_banner_images: "Max banner images (slider)",
  max_listings: "Max listings (column)",
}

function featuresFromPkg(pkg: Pkg): ListingFeatures {
  return getPackageFeatures({
    features: pkg.features as unknown,
    name: pkg.name,
    max_listings: pkg.max_listings,
  })
}

export default function ListingPackagesAdminTab() {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Pkg[]>([])
  const [featureDrafts, setFeatureDrafts] = useState<Record<string, ListingFeatures>>({})
  const [openFeatures, setOpenFeatures] = useState<Record<string, boolean>>({})
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [products, setProducts] = useState<Prod[]>([])
  const [agentIdDisable, setAgentIdDisable] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/listing-packages", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const pkgs = (data.packages || []) as Pkg[]
      setPackages(pkgs)
      const drafts: Record<string, ListingFeatures> = {}
      for (const p of pkgs) {
        drafts[p.id] = featuresFromPkg(p)
      }
      setFeatureDrafts(drafts)
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

  const updateDraft = (pkgId: string, patch: Partial<ListingFeatures>) => {
    setFeatureDrafts((prev) => ({
      ...prev,
      [pkgId]: { ...prev[pkgId], ...patch },
    }))
  }

  const savePackage = async (pkg: Pkg) => {
    const base = featureDrafts[pkg.id] ?? featuresFromPkg(pkg)
    const features: ListingFeatures = { ...base, max_listings: pkg.max_listings }
    const res = await fetch("/api/admin/listing-packages", {
      method: "PATCH",
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        max_listings: pkg.max_listings,
        includes_analytics: pkg.includes_analytics,
        is_active: pkg.is_active,
        features,
      }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else {
      toast.success("Package updated")
      setPackages((list) =>
        list.map((p) => (p.id === pkg.id ? { ...p, features } : p)),
      )
      setFeatureDrafts((prev) => ({ ...prev, [pkg.id]: features }))
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Manage listing packages, activate subscriptions, review products, and toggle agent listing access.
        </p>
        <div className="flex gap-2 shrink-0">
          <Link href="/admin/listing-packages">
            <Button variant="outline" size="sm">
              Full page
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="agents">Agent access</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4 space-y-3">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label>Name</Label>
                    <Input
                      value={pkg.name}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((p) => (p.id === pkg.id ? { ...p, name: e.target.value } : p)),
                        )
                      }
                      className="h-11"
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
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label>Max listings</Label>
                    <Input
                      type="number"
                      value={pkg.max_listings}
                      onChange={(e) => {
                        const max_listings = parseInt(e.target.value, 10) || 0
                        setPackages((list) =>
                          list.map((p) => (p.id === pkg.id ? { ...p, max_listings } : p)),
                        )
                        updateDraft(pkg.id, { max_listings })
                      }}
                      className="h-11"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                    <div className="flex items-center gap-2 min-h-[44px]">
                      <Switch
                        checked={pkg.includes_analytics}
                        onCheckedChange={(v) =>
                          setPackages((list) =>
                            list.map((p) => (p.id === pkg.id ? { ...p, includes_analytics: v } : p)),
                          )
                        }
                      />
                      <span className="text-xs">Legacy analytics</span>
                    </div>
                    <div className="flex items-center gap-2 min-h-[44px]">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={(v) =>
                          setPackages((list) =>
                            list.map((p) => (p.id === pkg.id ? { ...p, is_active: v } : p)),
                          )
                        }
                      />
                      <span className="text-xs">Active</span>
                    </div>
                  </div>
                </div>
                <Collapsible
                  open={openFeatures[pkg.id]}
                  onOpenChange={(open) => setOpenFeatures((prev) => ({ ...prev, [pkg.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full min-h-[44px] gap-2">
                      <Settings2 className="h-4 w-4" />
                      Edit features
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openFeatures[pkg.id] ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 pb-4">
                    <PackageFeatureEditor
                      features={featureDrafts[pkg.id] ?? featuresFromPkg(pkg)}
                      onChange={(patch) => updateDraft(pkg.id, patch)}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <Button onClick={() => savePackage(pkg)} className="w-full min-h-[44px]">
                  Save package
                </Button>
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
                    <Button size="sm" className="min-h-[44px]" onClick={() => activateSub(s.id)}>
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
                  <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => toggleProduct(p.id, !p.is_active)}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" className="min-h-[44px]" onClick={() => deleteProduct(p.id)}>
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
                className="flex-1 font-mono text-sm min-h-[44px]"
              />
              <Button variant="destructive" className="min-h-[44px]" onClick={() => disableAgentListings(false)}>
                Disable listings
              </Button>
              <Button className="min-h-[44px]" onClick={() => disableAgentListings(true)}>Enable listings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PackageFeatureEditor({
  features,
  onChange,
}: {
  features: ListingFeatures
  onChange: (patch: Partial<ListingFeatures>) => void
}) {
  const setBool = (key: keyof ListingFeatures, value: boolean) => {
    onChange({ [key]: value })
  }

  const setNum = (key: "blog_posts" | "max_images" | "max_banner_images", value: number) => {
    onChange({ [key]: value })
  }

  return (
    <div className="rounded-lg border bg-slate-50/80 p-3 sm:p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      {FEATURE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{group.label}</p>
          <ul className="space-y-2">
            {group.keys.map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-3 min-h-[44px] py-1.5 px-1 rounded-md hover:bg-white/60"
              >
                <Label
                  htmlFor={`feat-${String(key)}`}
                  className="text-sm font-normal flex-1 pr-2 cursor-pointer leading-snug"
                >
                  {FEATURE_LABELS[key]}
                </Label>
                <Switch
                  id={`feat-${String(key)}`}
                  checked={Boolean(features[key])}
                  onCheckedChange={(v) => setBool(key, v)}
                  className="shrink-0 scale-110"
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
        <div>
          <Label htmlFor="feat-max-images">Max images per product</Label>
          <Input
            id="feat-max-images"
            type="number"
            min={1}
            max={20}
            value={features.max_images ?? 1}
            onChange={(e) => setNum("max_images", parseInt(e.target.value, 10) || 1)}
            className="h-11"
          />
        </div>
        <div>
          <Label htmlFor="feat-blog-posts">Blog posts (-1 = unlimited)</Label>
          <Input
            id="feat-blog-posts"
            type="number"
            value={features.blog_posts ?? 0}
            onChange={(e) => setNum("blog_posts", parseInt(e.target.value, 10) || 0)}
            className="h-11"
          />
        </div>
        <div>
          <Label htmlFor="feat-max-banner">Max banner images (slider)</Label>
          <Input
            id="feat-max-banner"
            type="number"
            min={0}
            max={10}
            value={features.max_banner_images ?? 0}
            onChange={(e) => setNum("max_banner_images", parseInt(e.target.value, 10) || 0)}
            className="h-11"
          />
        </div>
      </div>
    </div>
  )
}