"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAgentAuthHeaders, getStoredAgentId } from "@/lib/agent-api-headers"
import { parseJsonResponse } from "@/lib/agent-auth-utils"
import { MobilePhotoUpload } from "@/components/ui/mobile-photo-upload"
import { toast } from "sonner"
import { Loader2, Package, BarChart3, ShoppingBag, Check, BarChart2 } from "lucide-react"

const BRAND = "#0E8F3D"
const BRAND_LIGHT = "#35B24A"

const PACKAGE_COPY: Record<
  string,
  { tagline: string; benefit: string; highlight?: boolean }
> = {
  Starter: {
    tagline: "Perfect for getting started",
    benefit: "List up to 20 products on your storefront with MoMo checkout details.",
  },
  Growth: {
    tagline: "Best value for growing sellers",
    benefit: "More listings for a growing catalog and steady sales.",
    highlight: true,
  },
  Ultimate: {
    tagline: "For serious sellers who want insights",
    benefit: "Maximum listings plus analytics to track views and performance.",
  },
}

function packageMeta(name: string) {
  return (
    PACKAGE_COPY[name] ?? {
      tagline: "Sell on your own storefront",
      benefit: "Reach customers directly with offline MoMo payments.",
    }
  )
}

type Package = {
  id: string
  name: string
  max_listings: number
  price: number
  includes_analytics: boolean
}

type Subscription = {
  id: string
  status: string
  expires_at: string | null
  package?: Package
}

type Product = {
  id: string
  title: string
  description: string | null
  price: number
  images: string[]
  momo_number: string | null
  momo_name: string | null
  category: string | null
  is_active: boolean
  view_count: number
}

type Props = { agentId: string }

export function MarketplaceMyListingsSection({ agentId }: Props) {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Package[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [listingsUsed, setListingsUsed] = useState(0)
  const [maxListings, setMaxListings] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [includesAnalytics, setIncludesAnalytics] = useState(false)
  const [canList, setCanList] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paying, setPaying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    momo_number: "",
    momo_name: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers = getAgentAuthHeaders()
      const [pkgRes, prodRes] = await Promise.all([
        fetch(`/api/agent/listing-packages?agentId=${agentId}`, { headers }),
        fetch(`/api/agent/listing-products?agentId=${agentId}`, { headers }),
      ])
      const pkgData = await pkgRes.json()
      const prodData = await prodRes.json()
      if (!pkgRes.ok) throw new Error(pkgData.error)
      setPackages(pkgData.packages || [])
      setSubscription(pkgData.subscription || null)
      setListingsUsed(pkgData.listings_used ?? 0)
      setMaxListings(pkgData.max_listings ?? 0)
      setDaysRemaining(pkgData.days_remaining ?? 0)
      setIncludesAnalytics(Boolean(pkgData.includes_analytics))
      setCanList(pkgData.can_list_products !== false)
      setProducts(prodData.products || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load listings")
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  const purchasePackage = async (packageId: string) => {
    if (!termsAccepted) {
      toast.error("Accept the Listing Terms before payment")
      return
    }
    const storedAgentId = getStoredAgentId() || agentId
    if (!storedAgentId) {
      toast.error("Please log in again as an agent")
      return
    }

    setPaying(true)
    try {
      const headers = getAgentAuthHeaders()
      const res = await fetch("/api/paystack/listing-package/initialize", {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({
          package_id: packageId,
          terms_accepted: true,
          agentId: storedAgentId,
          agent_id: storedAgentId,
        }),
      })
      const parsed = await parseJsonResponse<{ authorization_url?: string; error?: string }>(res)
      const data = parsed.data
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || "Payment failed")
      }
      window.location.href = data.authorization_url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
      setPaying(false)
    }
  }

  const uploadImage = async (file: File) => {
    if (imageUrls.length >= 2) {
      toast.error("Maximum 2 images per product")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/agent/listing-products/upload", {
        method: "POST",
        headers: getAgentAuthHeaders() as Record<string, string>,
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      setImageUrls((prev) => [...prev, data.url].slice(0, 2))
      toast.success("Image uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const saveProduct = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/agent/listing-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ ...form, price: Number(form.price), images: imageUrls }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Product added")
      setForm({ title: "", description: "", price: "", category: "", momo_number: "", momo_name: "" })
      setImageUrls([])
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const isActive = subscription?.status === "active" && daysRemaining > 0
  const totalViews = products.reduce((s, p) => s + (p.view_count || 0), 0)
  const activeCount = products.filter((p) => p.is_active).length

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
      </div>
    )
  }

  if (!canList) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center text-sm text-red-800">
          Your product listing section has been disabled by admin. Contact support if you believe this is an error.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5" style={{ color: BRAND }} /> Subscription status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {subscription?.status === "pending" && (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Payment received — awaiting admin activation. You can list products once approved.
            </p>
          )}
          {isActive ? (
            <>
              <p>
                <strong>{subscription?.package?.name}</strong> — {listingsUsed}/{maxListings} listings used ·{" "}
                <span className="text-[#0E8F3D] font-medium">{daysRemaining} days left</span>
              </p>
              {subscription?.expires_at && (
                <p className="text-muted-foreground text-xs">
                  Expires {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No active listing package. Purchase one below to sell on your storefront.</p>
          )}
        </CardContent>
      </Card>

      {!isActive && (
        <div className="space-y-5">
          <div
            className="rounded-2xl p-5 sm:p-6 text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
          >
            <h2 className="text-xl sm:text-2xl font-bold">Choose a Listing Package</h2>
            <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl">
              Sell your own products on your storefront. Pick a package that fits your needs — customers pay you
              directly via MoMo after you are approved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const meta = packageMeta(pkg.name)
              const isHighlight = meta.highlight
              return (
                <Card
                  key={pkg.id}
                  className={`relative overflow-hidden flex flex-col h-full transition-shadow hover:shadow-lg ${
                    isHighlight ? "border-2 shadow-md" : "border border-slate-200"
                  }`}
                  style={isHighlight ? { borderColor: BRAND } : undefined}
                >
                  {isHighlight && (
                    <div
                      className="text-center text-[10px] font-bold uppercase tracking-wide text-white py-1"
                      style={{ backgroundColor: BRAND }}
                    >
                      Most popular
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-700">
                      {meta.tagline}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 space-y-4 pt-0">
                    <div>
                      <p className="text-3xl font-bold" style={{ color: BRAND }}>
                        ₵{Number(pkg.price).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">One-time · 30 days after activation</p>
                    </div>

                    <ul className="space-y-2 text-sm text-slate-600 flex-1">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: BRAND }} />
                        <span>
                          <strong>{pkg.max_listings}</strong> product listings
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        {pkg.includes_analytics ? (
                          <BarChart2 className="h-4 w-4 shrink-0 mt-0.5 text-violet-600" />
                        ) : (
                          <Check className="h-4 w-4 shrink-0 mt-0.5 text-slate-300" />
                        )}
                        <span>
                          Analytics:{" "}
                          <strong>{pkg.includes_analytics ? "Included" : "Not included"}</strong>
                        </span>
                      </li>
                      <li className="text-xs leading-relaxed text-slate-500 border-t pt-2">{meta.benefit}</li>
                    </ul>

                    <Button
                      className="w-full text-white h-11"
                      style={{ backgroundColor: BRAND }}
                      disabled={paying}
                      onClick={() => purchasePackage(pkg.id)}
                    >
                      {paying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Pay with Paystack"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardContent className="p-4 flex items-start gap-3">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(c) => setTermsAccepted(c === true)}
                id="listing-terms"
                className="mt-0.5"
              />
              <label htmlFor="listing-terms" className="text-sm cursor-pointer leading-relaxed">
                I agree to the{" "}
                <Link href="/listing-terms" className="underline font-semibold" style={{ color: BRAND }}>
                  Listing Terms and Conditions
                </Link>
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {isActive && (
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">
              <ShoppingBag className="h-4 w-4 mr-1" /> My Products
            </TabsTrigger>
            {includesAnalytics && (
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" /> Analytics
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="products" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add product</CardTitle>
                <CardDescription>Max 2 images per product (compressed automatically)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Price (GHS) *</Label>
                    <Input type="number" min={1} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>MoMo number *</Label>
                    <Input value={form.momo_number} onChange={(e) => setForm((f) => ({ ...f, momo_number: e.target.value }))} />
                  </div>
                  <div>
                    <Label>MoMo account name *</Label>
                    <Input value={form.momo_name} onChange={(e) => setForm((f) => ({ ...f, momo_name: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <MobilePhotoUpload onFile={uploadImage} uploading={uploading} disabled={imageUrls.length >= 2} label="Add photo" />
                  {imageUrls.map((url, i) => (
                    <Image key={i} src={url} alt="" width={56} height={56} className="h-14 w-14 rounded object-cover border" />
                  ))}
                </div>
                <Button onClick={saveProduct} disabled={saving} style={{ backgroundColor: BRAND }} className="text-white">
                  {saving ? "Saving…" : "Save product"}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-3 flex gap-3">
                    {p.images?.[0] && (
                      <Image src={p.images[0]} alt="" width={64} height={64} className="h-16 w-16 rounded object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{p.title}</p>
                      <p className="text-[#0E8F3D] font-medium text-sm">₵{Number(p.price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{p.view_count} views · {p.is_active ? "Active" : "Hidden"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {includesAnalytics && (
            <TabsContent value="analytics" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{totalViews}</p>
                    <p className="text-xs text-muted-foreground">Total product views</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{products.length}</p>
                    <p className="text-xs text-muted-foreground">Total listings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{activeCount}</p>
                    <p className="text-xs text-muted-foreground">Active listings</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}
