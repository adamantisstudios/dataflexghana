"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import {
  getDefaultFreeFeatures,
  getPackageFeatures,
  type ListingFeatures,
} from "@/lib/listing-package-utils"
import { getEnabledFeatureGroups } from "@/lib/listing-package-feature-display"
import { compressImageFile } from "@/lib/image-compression"
import { toast } from "sonner"
import {
  Loader2,
  Package,
  BarChart3,
  ShoppingBag,
  Check,
  Trash2,
  Plus,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Eye,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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

type ListingPackageRow = {
  id: string
  name: string
  max_listings: number
  price: number
  includes_analytics: boolean
  features?: ListingFeatures | Record<string, unknown> | null
}

type Subscription = {
  id: string
  status: string
  expires_at: string | null
  package_id?: string
  package?: ListingPackageRow
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
type Banner = { id: string; image_url: string; order_index: number }
type BlogPost = {
  id: string
  title: string
  content: string
  featured_image_url: string | null
  created_at: string
}
type HeatmapCell = { x: number; y: number; clicks: number }

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-slate-100 text-slate-700 border-slate-200",
  Starter: "bg-amber-50 text-amber-700 border-amber-200",
  Growth: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Ultimate: "bg-violet-50 text-violet-700 border-violet-200",
}

export function MarketplaceMyListingsSection({ agentId }: Props) {
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<ListingPackageRow[]>([])
  const [packagesOpen, setPackagesOpen] = useState(true)
  const packagesSectionRef = useRef<HTMLDivElement>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [listingsUsed, setListingsUsed] = useState(0)
  const [maxListings, setMaxListings] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [includesAnalytics, setIncludesAnalytics] = useState(false)
  const [features, setFeatures] = useState<ListingFeatures>(getDefaultFreeFeatures())
  const [canList, setCanList] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paying, setPaying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [bannerUploading, setBannerUploading] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [blogSaving, setBlogSaving] = useState(false)
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [blogForm, setBlogForm] = useState({ title: "", content: "", featured_image_url: "" })
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
      setFeatures((pkgData.features as ListingFeatures) ?? getDefaultFreeFeatures())
      setCanList(pkgData.can_list_products !== false)
      setProducts(prodData.products || [])
      if (pkgData.features?.banner_slider) {
        const bRes = await fetch("/api/public/storefront/banners?agentId=" + encodeURIComponent(agentId))
        const bData = await bRes.json()
        setBanners(Array.isArray(bData.banners) ? bData.banners : [])
      } else {
        setBanners([])
      }
      if (Number(pkgData.features?.blog_posts ?? 0) !== 0) {
        const blogRes = await fetch("/api/agent/blog", { headers })
        const blogData = await blogRes.json()
        setBlogPosts(Array.isArray(blogData.posts) ? blogData.posts : [])
      } else {
        setBlogPosts([])
      }
      if (pkgData.features?.heatmap) {
        const hRes = await fetch(`/api/storefront/heatmap?agentId=${encodeURIComponent(agentId)}`)
        const hData = await hRes.json()
        setHeatmap(Array.isArray(hData.cells) ? hData.cells : [])
      } else {
        setHeatmap([])
      }
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
    const maxImages = Math.max(1, Number(features.max_images) || 1)
    if (imageUrls.length >= maxImages) {
      toast.error(`Upgrade to ${nextTierName} to add more images.`)
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
      setImageUrls((prev) => [...prev, data.url].slice(0, maxImages))
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

  const uploadBanner = async (file: File) => {
    const maxBannerImages = Math.max(1, Number(features.max_banner_images ?? 3))
    if (banners.length >= maxBannerImages) {
      toast.error(`Maximum ${maxBannerImages} banners on your plan.`)
      return
    }
    setBannerUploading(true)
    try {
      const compressed = await compressImageFile(file)
      const fd = new FormData()
      fd.append("file", new File([compressed], `${Date.now()}-banner.jpg`, { type: "image/jpeg" }))
      const res = await fetch("/api/agent/storefront/banners", {
        method: "POST",
        headers: getAgentAuthHeaders() as Record<string, string>,
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Banner upload failed")
      setBanners((prev) => [...prev, data.banner as Banner])
      toast.success("Banner uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Banner upload failed")
    } finally {
      setBannerUploading(false)
    }
  }

  const deleteBanner = async (id: string) => {
    const res = await fetch(`/api/agent/storefront/banners/${id}`, {
      method: "DELETE",
      headers: getAgentAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Delete failed")
      return
    }
    setBanners((prev) => prev.filter((b) => b.id !== id))
    toast.success("Banner deleted")
  }

  const startNewPost = () => {
    setEditingPostId(null)
    setBlogForm({ title: "", content: "", featured_image_url: "" })
  }

  const editPost = (post: BlogPost) => {
    setEditingPostId(post.id)
    setBlogForm({
      title: post.title,
      content: post.content,
      featured_image_url: post.featured_image_url || "",
    })
  }

  const saveBlogPost = async () => {
    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      toast.error("Title and content are required")
      return
    }
    setBlogSaving(true)
    try {
      const url = editingPostId ? `/api/agent/blog/${editingPostId}` : "/api/agent/blog"
      const method = editingPostId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify(blogForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not save post")
      toast.success(editingPostId ? "Post updated" : "Post created")
      startNewPost()
      const reload = await fetch("/api/agent/blog", { headers: getAgentAuthHeaders() })
      const reloadData = await reload.json()
      setBlogPosts(Array.isArray(reloadData.posts) ? reloadData.posts : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save post")
    } finally {
      setBlogSaving(false)
    }
  }

  const deleteBlogPost = async (id: string) => {
    const res = await fetch(`/api/agent/blog/${id}`, {
      method: "DELETE",
      headers: getAgentAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Delete failed")
      return
    }
    setBlogPosts((prev) => prev.filter((p) => p.id !== id))
    if (editingPostId === id) startNewPost()
    toast.success("Post deleted")
  }

  const isActive = subscription?.status === "active" && daysRemaining > 0
  const planName = subscription?.package?.name || "Free"
  const planBadgeClass = PLAN_COLORS[planName] || PLAN_COLORS.Free
  const nextTierName = planName === "Free" ? "Starter" : planName === "Starter" ? "Growth" : "Ultimate"
  const maxImages = Math.max(1, Number(features.max_images) || 1)
  const hasListingAccess = maxListings > 0
  const totalViews = products.reduce((s, p) => s + (p.view_count || 0), 0)
  const activeCount = products.filter((p) => p.is_active).length
  const maxBannerImages = Math.max(1, Number(features.max_banner_images ?? 3))
  const blogLimit = Number(features.blog_posts ?? 0)
  const hasUnlimitedBlog = blogLimit < 0
  const hasBlogAccess = blogLimit !== 0
  const blogLimitReached = !hasUnlimitedBlog && blogLimit > 0 && blogPosts.length >= blogLimit
  const hasAnalytics = Boolean(features.analytics)
  const isOnBestPlan = isActive && planName === "Ultimate"
  const showUpgradeCta = !isOnBestPlan
  const topProduct =
    products.length > 0
      ? [...products].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0]
      : null

  const scrollToPackages = useCallback(() => {
    setPackagesOpen(true)
    requestAnimationFrame(() => {
      packagesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [])

  useEffect(() => {
    if (loading) return
    const onFreeOrInactive = !isActive || planName === "Free" || planName === "Starter"
    setPackagesOpen(onFreeOrInactive)
  }, [loading, isActive, planName])

  const isCurrentPackage = (pkgId: string) =>
    Boolean(isActive && (subscription?.package_id === pkgId || subscription?.package?.id === pkgId))

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

  const packageCards = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {packages.map((pkg) => {
        const meta = packageMeta(pkg.name)
        const pkgFeatures = getPackageFeatures({
          features: pkg.features,
          name: pkg.name,
          max_listings: pkg.max_listings,
        })
        const featureGroups = getEnabledFeatureGroups(pkgFeatures)
        const isHighlight = meta.highlight
        const isCurrent = isCurrentPackage(pkg.id)
        return (
          <Card
            key={pkg.id}
            className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
              isHighlight ? "border-2 shadow-md ring-1 ring-emerald-100" : "border-slate-200/90"
            } ${isCurrent ? "ring-2 ring-emerald-500/40" : ""}`}
            style={isHighlight ? { borderColor: BRAND } : undefined}
          >
            {isHighlight && (
              <div
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: BRAND }}
              >
                Most popular
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-600">{meta.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 pt-0">
              <div>
                <p className="text-3xl font-bold tabular-nums" style={{ color: BRAND }}>
                  ₵{Number(pkg.price).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">One-time · 30 days after activation</p>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
                  <span>
                    <strong>{pkg.max_listings}</strong> product listings
                  </span>
                </li>
              </ul>
              <div className="flex-1 space-y-3 border-t border-slate-100 pt-3">
                {featureGroups.map((group) => (
                  <div key={`${pkg.id}-${group.label}`}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {group.label}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-snug text-slate-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <Button disabled className="min-h-[44px] w-full" variant="secondary">
                  Current plan
                </Button>
              ) : (
                <Button
                  className="min-h-[44px] w-full text-white shadow-sm transition-opacity hover:opacity-95"
                  style={{ backgroundColor: BRAND }}
                  disabled={paying || !termsAccepted}
                  onClick={() => purchasePackage(pkg.id)}
                >
                  {paying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Choose plan · Paystack"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="w-full space-y-6 px-0 sm:px-0">
      <div className="space-y-1 px-0.5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Listings</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Manage your storefront products, banners, and blog. Customers pay you directly via MoMo.
        </p>
      </div>

      <Card className="rounded-2xl border border-emerald-100/80 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Package className="h-5 w-5" style={{ color: BRAND }} /> Subscription status
            <Badge className={`border ${planBadgeClass}`}>{planName} Plan</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {subscription?.status === "pending" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              Payment received — awaiting admin activation. You can list products once approved.
            </p>
          )}
          <p className="text-slate-700">
            You have used <strong>{listingsUsed}</strong> of <strong>{maxListings}</strong> listings.
          </p>
          {isActive ? (
            <>
              <p>
                <strong>{subscription?.package?.name}</strong> — {listingsUsed}/{maxListings} listings ·{" "}
                <span className="font-medium text-[#0E8F3D]">{daysRemaining} days left</span>
              </p>
              {subscription?.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              You are on the free listing tier. Choose a package below to unlock more listings and premium tools.
            </p>
          )}
          {isOnBestPlan ? (
            <p className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-800">
              <Sparkles className="h-4 w-4 shrink-0" />
              You&apos;re on the best plan — enjoy all premium features.
            </p>
          ) : showUpgradeCta ? (
            <Button
              type="button"
              className="h-11 w-full text-white transition-opacity hover:opacity-95 sm:w-auto"
              style={{ backgroundColor: BRAND }}
              onClick={scrollToPackages}
            >
              Upgrade plan
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {showUpgradeCta && packages.length > 0 && (
        <div ref={packagesSectionRef} id="available-packages-section" className="scroll-mt-4">
          <Collapsible open={packagesOpen} onOpenChange={setPackagesOpen}>
            <div
              className="rounded-2xl p-5 text-white shadow-md sm:p-6"
              style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full min-h-[44px] items-center justify-between gap-3 text-left"
                >
                  <div>
                    <h2 className="text-xl font-bold sm:text-2xl">Available packages</h2>
                    <p className="mt-1 text-sm text-white/90">
                      Compare plans and subscribe with Paystack — activated for 30 days.
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${packagesOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-4 space-y-4">
              {packageCards}
              <Card className="rounded-2xl border border-emerald-100 bg-emerald-50/50 shadow-sm">
                <CardContent className="flex items-start gap-3 p-4">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(c) => setTermsAccepted(c === true)}
                    id="listing-terms"
                    className="mt-1"
                  />
                  <label htmlFor="listing-terms" className="cursor-pointer text-sm leading-relaxed">
                    I agree to the{" "}
                    <Link href="/listing-terms" className="font-semibold underline" style={{ color: BRAND }}>
                      Listing Terms and Conditions
                    </Link>
                  </label>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {hasListingAccess && (
        <Tabs defaultValue="products">
          <TabsList className={`grid h-auto w-full gap-1 ${hasAnalytics ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="products" className="min-h-[44px]">
              <ShoppingBag className="mr-1 h-4 w-4" /> Products
            </TabsTrigger>
            {hasAnalytics && (
              <TabsTrigger value="analytics" className="min-h-[44px]">
                <BarChart3 className="mr-1 h-4 w-4" /> Analytics
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="products" className="mt-4 space-y-4">
            <Card className="mx-auto w-full max-w-lg rounded-2xl border-slate-200/90 shadow-sm sm:max-w-none">
              <CardHeader>
                <CardTitle className="text-base">Add product</CardTitle>
                <CardDescription>
                  Max {maxImages} image{maxImages !== 1 ? "s" : ""} per product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Title *</Label>
                    <Input className="h-11" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Price (GHS) *</Label>
                    <Input className="h-11" type="number" min={1} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Input className="h-11" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>MoMo number *</Label>
                    <Input className="h-11" value={form.momo_number} onChange={(e) => setForm((f) => ({ ...f, momo_number: e.target.value }))} />
                  </div>
                  <div>
                    <Label>MoMo account name *</Label>
                    <Input className="h-11" value={form.momo_name} onChange={(e) => setForm((f) => ({ ...f, momo_name: e.target.value }))} />
                  </div>
                </div>
                {maxImages <= 2 && showUpgradeCta && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    Upgrade to {nextTierName} for more images and premium tools.{" "}
                    <button type="button" className="font-semibold underline" onClick={scrollToPackages}>
                      View packages
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: maxImages }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-2 min-h-[96px] flex items-center justify-center">
                      {imageUrls[i] ? (
                        <Image src={imageUrls[i]} alt="" width={96} height={96} className="h-20 w-20 rounded object-cover border" />
                      ) : (
                        <MobilePhotoUpload
                          onFile={uploadImage}
                          uploading={uploading}
                          disabled={imageUrls.length >= maxImages}
                          label={`Add photo ${i + 1}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={saveProduct} disabled={saving} style={{ backgroundColor: BRAND }} className="text-white w-full min-h-[44px]">
                  {saving ? "Saving…" : "Save product"}
                </Button>
              </CardContent>
            </Card>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <Card key={p.id} className="rounded-2xl border-slate-200/90 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex gap-3 p-3">
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

            {features.banner_slider && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Storefront Banner</CardTitle>
                  <CardDescription>
                    Upload up to {maxBannerImages} banners for your storefront slider.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <MobilePhotoUpload
                      onFile={uploadBanner}
                      uploading={bannerUploading}
                      disabled={banners.length >= maxBannerImages}
                      label={banners.length >= maxBannerImages ? "Banner limit reached" : "Add banner"}
                    />
                    <p className="text-xs text-muted-foreground self-center">
                      Images are compressed automatically for faster mobile loading.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {banners.map((b) => (
                      <div key={b.id} className="relative rounded-lg overflow-hidden border bg-slate-100">
                        <Image
                          src={b.image_url}
                          alt="Banner"
                          width={360}
                          height={180}
                          className="h-20 w-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-8 w-8"
                          onClick={() => deleteBanner(b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {banners.length > 0 && (
                    <div className="rounded-lg border bg-white overflow-x-auto">
                      <div className="flex gap-2 p-2 min-w-[340px]">
                        {banners.map((b) => (
                          <Image
                            key={`preview-${b.id}`}
                            src={b.image_url}
                            alt=""
                            width={260}
                            height={120}
                            className="h-24 w-44 rounded-md object-cover shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {hasBlogAccess && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Blog Posts</CardTitle>
                  <CardDescription>
                    {hasUnlimitedBlog
                      ? "Unlimited posts on your current package."
                      : `${blogPosts.length}/${blogLimit} posts used on this package.`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {blogLimitReached && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      You've reached your blog post limit. Upgrade to add more.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-[44px]"
                      disabled={blogLimitReached}
                      onClick={startNewPost}
                    >
                      <Plus className="h-4 w-4 mr-1" /> New Post
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      className="h-11"
                      placeholder="Post title"
                      value={blogForm.title}
                      onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <Input
                      className="h-11"
                      placeholder="Featured image URL (optional)"
                      value={blogForm.featured_image_url}
                      onChange={(e) =>
                        setBlogForm((prev) => ({ ...prev, featured_image_url: e.target.value }))
                      }
                    />
                    <Textarea
                      className="min-h-[180px]"
                      placeholder="Write your blog post (Markdown/plain text)"
                      value={blogForm.content}
                      onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))}
                    />
                    <Button
                      type="button"
                      className="w-full min-h-[44px]"
                      style={{ backgroundColor: BRAND }}
                      disabled={blogSaving || (!editingPostId && blogLimitReached)}
                      onClick={saveBlogPost}
                    >
                      {blogSaving ? "Saving..." : editingPostId ? "Update Post" : "Publish Post"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {blogPosts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-[44px]"
                            onClick={() => editPost(post)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="min-h-[44px]"
                            onClick={() => deleteBlogPost(post.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {features.heatmap && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Heatmap</CardTitle>
                  <CardDescription>Tap density from storefront visitors (aggregated by grid).</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="min-w-[340px] rounded-xl border p-2 bg-slate-50">
                    <div className="grid grid-cols-20 gap-[2px]">
                      {Array.from({ length: 20 * 20 }).map((_, idx) => {
                        const gx = (idx % 20) * 5
                        const gy = Math.floor(idx / 20) * 5
                        const cell = heatmap.find((h) => h.x === gx && h.y === gy)
                        const clicks = Number(cell?.clicks ?? 0)
                        const level = Math.min(1, clicks / 8)
                        return (
                          <div
                            key={`${gx}-${gy}`}
                            className="h-3 rounded-[2px]"
                            style={{
                              backgroundColor:
                                clicks > 0
                                  ? `rgba(220, 38, 38, ${0.15 + level * 0.75})`
                                  : "rgba(148, 163, 184, 0.18)",
                            }}
                            title={`${gx}%, ${gy}%: ${clicks} clicks`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {hasAnalytics && (
            <TabsContent value="analytics" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <Card className="rounded-2xl border-slate-200/90 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                      <Eye className="h-4 w-4 text-emerald-700" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">{totalViews}</p>
                    <p className="text-xs text-muted-foreground">Total product views</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-200/90 shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                      <Package className="h-4 w-4 text-slate-600" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{products.length}</p>
                    <p className="text-xs text-muted-foreground">Total listings</p>
                    <p className="mt-1 text-[11px] text-emerald-700">{activeCount} active</p>
                  </CardContent>
                </Card>
              </div>
              {topProduct && (
                <Card className="rounded-2xl border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-900">
                      <TrendingUp className="h-4 w-4" />
                      Top performing product
                    </div>
                    <p className="font-medium text-slate-900 line-clamp-2">{topProduct.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {topProduct.view_count} views · ₵{Number(topProduct.price).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Analytics update as customers view your storefront listings.
              </p>
            </TabsContent>
          )}
        </Tabs>
      )}
      {!hasListingAccess && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="py-6 text-sm text-slate-600">
            Listing slots are currently unavailable on your plan.{" "}
            {showUpgradeCta ? (
              <button type="button" className="font-medium text-emerald-700 underline" onClick={scrollToPackages}>
                Upgrade to start listing
              </button>
            ) : (
              "Contact support for assistance."
            )}
            .
          </CardContent>
        </Card>
      )}
    </div>
  )
}
