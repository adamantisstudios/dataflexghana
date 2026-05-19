"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Phone,
  MessageCircle,
  Wifi,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  ShoppingCart,
  Store,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import {
  normalizeGhanaPhoneNumber,
  toTelHref,
  toWhatsAppHref,
} from "@/lib/phone-utils"
import { StorefrontWhatsAppWidget } from "@/components/storefront/StorefrontWhatsAppWidget"
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt"

interface DataBundle {
  id: string
  name: string
  provider: string
  size_gb: number
  base_price: number
  custom_margin: number
  retail_price: number
  image_url?: string | null
}

interface ReferralService {
  id: string
  title: string
  description: string
  cost: number
  image_url?: string | null
}

interface StoreProfile {
  store_name: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
}

const NETWORK_TABS = [
  { key: "MTN", label: "MTN" },
  { key: "Telecel", label: "Telecel" },
  { key: "AirtelTigo", label: "AirtelTigo" },
] as const

const SERVICES_PER_PAGE = 6
const DELIVERY_NOTICE_MS = 30_000

function normalizeProvider(p: string): string {
  const u = p?.toUpperCase() || ""
  if (u.includes("MTN")) return "MTN"
  if (u.includes("TELECEL") || u.includes("VODAFONE")) return "Telecel"
  if (u.includes("AIRTEL") || u.includes("TIGO")) return "AirtelTigo"
  return p
}

type CartLine = {
  lineId: string
  bundle: DataBundle
  phone: string
}

function newLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

import { dispatchStorefrontOrdersChanged } from "@/lib/storefront-events"

type PublicAgentStorefrontProps = {
  agentId?: string
  storeSegment?: string
  initialProfile?: StoreProfile | null
  initialBundles?: DataBundle[]
  initialServices?: ReferralService[]
}

function mapApiBundles(raw: Array<DataBundle & { final_price?: number }>): DataBundle[] {
  return raw.map((b) => ({
    ...b,
    retail_price: Number(b.retail_price ?? b.final_price ?? 0),
  }))
}

function applyStorefrontPayload(
  data: {
    profile?: StoreProfile | null
    bundles?: Array<DataBundle & { final_price?: number }>
    services?: ReferralService[]
    unavailable?: boolean
  },
  setters: {
    setProfile: (p: StoreProfile | null) => void
    setBundles: (b: DataBundle[]) => void
    setServices: (s: ReferralService[]) => void
    setNetworkTab: (t: string) => void
    setMainTab: (t: "bundles" | "services") => void
    setLoadError: (e: string | null) => void
  },
): boolean {
  if (data.unavailable) {
    setters.setLoadError("This store is not available right now.")
    setters.setProfile(null)
    setters.setBundles([])
    setters.setServices([])
    return false
  }

  const apiBundles = mapApiBundles(data.bundles || [])
  const apiServices = data.services || []

  setters.setProfile(data.profile ?? null)
  setters.setBundles(apiBundles)
  setters.setServices(apiServices)
  setters.setLoadError(null)

  const providers = apiBundles.map((b) => normalizeProvider(b.provider))
  if (providers.includes("MTN")) setters.setNetworkTab("MTN")
  else if (providers[0]) setters.setNetworkTab(normalizeProvider(providers[0]))
  if (apiServices.length > 0 && apiBundles.length === 0) setters.setMainTab("services")
  return true
}

export default function PublicAgentStorefront({
  agentId: agentIdProp,
  storeSegment: storeSegmentProp,
  initialProfile,
  initialBundles,
  initialServices,
}: PublicAgentStorefrontProps) {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = (agentIdProp || (params?.agentId as string) || "").trim()
  const storeSegment = (storeSegmentProp || "").trim()

  const hasServerPayload = initialProfile !== undefined || initialBundles !== undefined

  const [loading, setLoading] = useState(!hasServerPayload)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [profile, setProfile] = useState<StoreProfile | null>(initialProfile ?? null)
  const [bundles, setBundles] = useState<DataBundle[]>(initialBundles ?? [])
  const [services, setServices] = useState<ReferralService[]>(initialServices ?? [])
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null)
  const [phoneDraft, setPhoneDraft] = useState("")
  const [lastPhone, setLastPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [networkTab, setNetworkTab] = useState<string>("MTN")
  const [mainTab, setMainTab] = useState<"bundles" | "services">("bundles")
  const [serviceSearch, setServiceSearch] = useState("")
  const [servicePage, setServicePage] = useState(1)
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(true)

  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    const whatsappUrl = searchParams.get("whatsapp_url")
    const reference =
      searchParams.get("ref") || searchParams.get("reference") || searchParams.get("trxref")

    if (paymentStatus !== "success") return

    toast.success("Payment successful! Your bundle orders are being processed.")
    setCart([])

    if (reference) {
      void (async () => {
        try {
          const res = await fetch("/api/paystack/storefront/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference, agent_id: agentId }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            console.error("[storefront] confirm fallback failed:", data.error || res.status)
            toast.error(
              data.error ||
                "Payment received but order sync failed. Contact support with your reference.",
            )
            return
          }
          if (data.insertedCount > 0 || data.alreadyRecorded) {
            dispatchStorefrontOrdersChanged({ agentId, reference: data.reference })
          }
        } catch (err) {
          console.error("[storefront] confirm fallback failed:", err)
          toast.error("Could not confirm your order. Please contact support with your payment reference.")
        }
      })()
    }

    if (whatsappUrl) {
      const timeout = setTimeout(() => {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer")
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [searchParams, agentId])

  useEffect(() => {
    if (!showDeliveryNotice) return
    const t = setTimeout(() => setShowDeliveryNotice(false), DELIVERY_NOTICE_MS)
    return () => clearTimeout(t)
  }, [showDeliveryNotice])

  useEffect(() => {
    if (!agentId) {
      setLoadError("This store link is invalid.")
      setLoading(false)
      return
    }

    if (hasServerPayload) {
      applyStorefrontPayload(
        {
          profile: initialProfile,
          bundles: initialBundles,
          services: initialServices,
        },
        { setProfile, setBundles, setServices, setNetworkTab, setMainTab, setLoadError },
      )
      setLoading(false)
      return
    }

    const load = async () => {
      setLoadError(null)
      try {
        const res = await fetch(`/api/storefront/public/${agentId}`, { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Store unavailable")
        applyStorefrontPayload(data, {
          setProfile,
          setBundles,
          setServices,
          setNetworkTab,
          setMainTab,
          setLoadError,
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load store"
        setLoadError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [
    agentId,
    hasServerPayload,
    initialProfile,
    initialBundles,
    initialServices,
  ])

  const displayProfile: StoreProfile = profile ?? {
    store_name: "Data Store",
    whatsapp_number: null,
    phone_number: null,
    primary_color: "#3B82F6",
    business_info: null,
  }

  const accent = displayProfile.primary_color || "#3B82F6"

  const callPhone = useMemo(
    () => normalizeGhanaPhoneNumber(displayProfile.phone_number),
    [displayProfile.phone_number],
  )

  const whatsappPhone = useMemo(
    () =>
      normalizeGhanaPhoneNumber(
        displayProfile.whatsapp_number || displayProfile.phone_number,
      ),
    [displayProfile.whatsapp_number, displayProfile.phone_number],
  )

  const bundlesByNetwork = useMemo(() => {
    const map: Record<string, DataBundle[]> = { MTN: [], Telecel: [], AirtelTigo: [] }
    for (const b of bundles) {
      const key = normalizeProvider(b.provider)
      if (!map[key]) map[key] = []
      map[key].push(b)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.size_gb - b.size_gb)
    }
    return map
  }, [bundles])

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    if (!q) return services
    return services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q),
    )
  }, [services, serviceSearch])

  const serviceTotalPages = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PER_PAGE))

  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * SERVICES_PER_PAGE
    return filteredServices.slice(start, start + SERVICES_PER_PAGE)
  }, [filteredServices, servicePage])

  useEffect(() => {
    setActiveBundleId(null)
  }, [networkTab])

  useEffect(() => {
    setServicePage(1)
  }, [serviceSearch])

  useEffect(() => {
    if (servicePage > serviceTotalPages) setServicePage(serviceTotalPages)
  }, [servicePage, serviceTotalPages])

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + Number(line.bundle.retail_price), 0),
    [cart],
  )

  const toggleBundle = (bundleId: string) => {
    if (activeBundleId === bundleId) {
      setActiveBundleId(null)
      return
    }
    setActiveBundleId(bundleId)
    setPhoneDraft(lastPhone)
  }

  const addBundleToCart = (bundle: DataBundle) => {
    const phone = phoneDraft.trim()
    if (!phone) {
      toast.error("Enter the phone number for this bundle")
      return
    }

    setCart((prev) => [
      ...prev,
      { lineId: newLineId(), bundle, phone },
    ])
    setLastPhone(phone)
    setActiveBundleId(null)
    setPhoneDraft(phone)
    toast.success("Added to cart")
    setCartOpen(true)
  }

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.lineId !== lineId))
  }

  const checkoutCart = async () => {
    if (cart.length === 0) {
      toast.error("Add at least one bundle to your order")
      return
    }

    const fallbackPhone = cart[0].phone.replace(/\D/g, "")
    const email =
      customerEmail.trim() || `${fallbackPhone || "customer"}@storefront.local`

    setCheckingOut(true)
    try {
      const res = await fetch("/api/paystack/storefront/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          agent_id: agentId,
          store_name: displayProfile.store_name || "Data Store",
          store_segment: storeSegment || undefined,
          items: cart.map((line) => ({
            data_bundle_id: line.bundle.id,
            customer_phone: line.phone,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not start payment")
      window.location.href = data.authorizationUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment")
      setCheckingOut(false)
    }
  }

  const whatsappLink = (message: string) => toWhatsAppHref(whatsappPhone, message) ?? "#"
  const storeTagline =
    "Fast data bundles & trusted referral services — delivered with care."

  if (!agentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Store not available</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
            This storefront link is invalid.
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Store not available</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">{loadError}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center space-y-3">
          <div
            className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
            style={{ borderColor: accent, borderTopColor: "transparent" }}
          />
          <p className="text-muted-foreground text-sm">Loading store…</p>
        </div>
      </div>
    )
  }

  const hasStoreContent = Boolean(profile) || bundles.length > 0 || services.length > 0

  if (!hasStoreContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Store not available yet</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
            This storefront has not been set up yet. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100/90 pb-32">
      {showDeliveryNotice && (
        <div
          className="sticky top-0 z-40 border-b shadow-sm animate-in slide-in-from-top duration-300"
          style={{ backgroundColor: accent, borderColor: `${accent}33` }}
          role="status"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-start gap-3 text-white">
            <Clock className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm flex-1 leading-snug">
              🕒 Data delivery takes between 5 minutes to 1 hour when network is good. Please be
              patient.
            </p>
            <button
              type="button"
              onClick={() => setShowDeliveryNotice(false)}
              className="p-1 rounded-md hover:bg-white/20 shrink-0"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <header
        className="relative overflow-hidden text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}e6 42%, #0f172a 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,white,transparent_50%)]" />
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
          aria-label={`Open cart, ${cart.length} items`}
        >
          <ShoppingCart className="h-5 w-5" />
          {cart.length > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {cart.length > 9 ? "9+" : cart.length}
            </span>
          )}
        </button>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-12 sm:pb-16 pr-16 sm:pr-6">
          <p className="flex items-center gap-2 text-white/75 text-xs uppercase tracking-widest font-semibold mb-3">
            <Store className="h-4 w-4 shrink-0" />
            Official storefront
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            {displayProfile.store_name || "Data Store"}
          </h1>
          <p className="mt-3 text-white/90 text-sm sm:text-base max-w-xl leading-relaxed flex items-start gap-2">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 opacity-90" />
            {storeTagline}
          </p>
          {displayProfile.business_info && (
            <p className="mt-4 text-white/85 text-sm sm:text-[15px] max-w-2xl whitespace-pre-wrap leading-relaxed border-l-2 border-white/35 pl-4">
              {displayProfile.business_info}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {callPhone && (
              <a
                href={toTelHref(callPhone) ?? "#"}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2.5 text-sm font-medium transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call us
              </a>
            )}
            {whatsappPhone && (
              <a
                href={whatsappLink("Hello, I have a question about your store.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                <MessageCircle className="h-4 w-4" style={{ color: accent }} />
                WhatsApp
              </a>
            )}
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-white/65">
            <ShieldCheck className="h-4 w-4" />
            Secure Paystack checkout · Instant order confirmation
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 space-y-8 relative z-10">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: accent }}>
                Shop our catalog
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tap a bundle, enter a phone number, add to cart — checkout when ready.
              </p>
            </div>
          </div>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "bundles" | "services")}>
          <TabsList className="w-full h-auto grid grid-cols-2 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
            <TabsTrigger
              value="bundles"
              className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:text-white transition-colors"
              style={
                mainTab === "bundles"
                  ? { backgroundColor: accent, color: "white" }
                  : undefined
              }
            >
              <Wifi className="h-4 w-4 mr-1.5 inline" />
              Data bundles
              {bundles.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {bundles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:text-white transition-colors"
              style={
                mainTab === "services"
                  ? { backgroundColor: accent, color: "white" }
                  : undefined
              }
            >
              Referral services
              {services.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {services.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bundles" className="mt-4 space-y-4">
            {bundles.length === 0 ? (
              <Card className="border-0 shadow-md rounded-2xl">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No data bundles listed right now.
                </CardContent>
              </Card>
            ) : (
              <Tabs value={networkTab} onValueChange={setNetworkTab}>
                <TabsList className="w-full grid grid-cols-3 h-auto p-1 rounded-xl bg-white shadow-sm border gap-1">
                  {NETWORK_TABS.map((n) => (
                    <TabsTrigger
                      key={n.key}
                      value={n.key}
                      disabled={!bundlesByNetwork[n.key]?.length}
                      className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:shadow-sm"
                      style={
                        networkTab === n.key
                          ? {
                              backgroundColor: accent,
                              color: "white",
                            }
                          : undefined
                      }
                    >
                      {n.label}
                      {bundlesByNetwork[n.key]?.length ? (
                        <span className="ml-1 opacity-80">({bundlesByNetwork[n.key].length})</span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {NETWORK_TABS.map((n) => (
                  <TabsContent key={n.key} value={n.key} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(bundlesByNetwork[n.key] || []).map((b) => {
                      const isActive = networkTab === n.key && activeBundleId === b.id
                      return (
                      <div key={b.id} className="flex flex-col gap-2 min-w-0">
                      <Card
                        className={`rounded-2xl border bg-white shadow-md hover:shadow-lg transition-all flex flex-col ${
                          isActive ? "ring-2 ring-offset-2 border-transparent" : "border-slate-100"
                        }`}
                        style={
                          isActive
                            ? ({ "--tw-ring-color": accent } as CSSProperties)
                            : undefined
                        }
                      >
                        <CardContent className="p-4 flex flex-col flex-1 gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <Badge
                                variant="secondary"
                                className="text-[10px] mb-2"
                                style={{ color: accent, borderColor: `${accent}33` }}
                              >
                                {normalizeProvider(b.provider)}
                              </Badge>
                              <h3 className="font-semibold text-slate-900 line-clamp-2">{b.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{b.size_gb} GB</p>
                            </div>
                            <p className="text-xl font-bold shrink-0 tabular-nums" style={{ color: accent }}>
                              ₵{Number(b.retail_price).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            className="w-full text-white rounded-lg h-10 font-semibold mt-auto"
                            style={{ backgroundColor: accent }}
                            onClick={() => toggleBundle(b.id)}
                          >
                            {isActive ? "Cancel" : "Buy"}
                          </Button>
                        </CardContent>
                      </Card>

                      {isActive && (
                        <div
                          className="rounded-xl border-2 bg-white p-3 shadow-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-200"
                          style={{ borderColor: accent }}
                        >
                          <Label className="text-xs font-medium text-slate-700">
                            Recipient phone number
                          </Label>
                          <Input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            autoFocus
                            className="rounded-lg h-11 text-base"
                            placeholder="024XXXXXXX"
                            value={phoneDraft}
                            onChange={(e) => setPhoneDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addBundleToCart(b)
                            }}
                          />
                          <Button
                            type="button"
                            className="w-full text-white rounded-lg h-11 font-semibold"
                            style={{ backgroundColor: accent }}
                            onClick={() => addBundleToCart(b)}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add to Cart
                          </Button>
                        </div>
                      )}
                      </div>
                    )})}
                    </div>

                    {!bundlesByNetwork[n.key]?.length && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No {n.label} bundles listed.
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-4 space-y-4">
            {services.length === 0 ? (
              <Card className="border-0 shadow-md rounded-2xl">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No referral services listed right now.
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 rounded-xl border-slate-200 shadow-sm h-11"
                    placeholder="Search services…"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                </div>

                {filteredServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No matches found.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedServices.map((s) => (
                      <Card
                        key={s.id}
                        className="border border-slate-100 bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                      >
                        <CardContent className="p-0 flex flex-col flex-1">
                          <div className="relative aspect-square w-full bg-slate-100">
                              <Image
                                src={s.image_url || "/placeholder.svg"}
                                alt={s.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 33vw"
                              />
                            </div>
                            <div className="p-4 flex flex-col flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 line-clamp-2">{s.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-3 mt-2 flex-1 leading-relaxed">
                                {s.description}
                              </p>
                              <p className="text-xl font-bold mt-3" style={{ color: accent }}>
                                ₵{Number(s.cost).toFixed(2)}
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg h-9 text-xs sm:text-sm"
                                  asChild
                                  disabled={!callPhone}
                                >
                                  <a href={toTelHref(callPhone) ?? "#"}>
                                    <Phone className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                    Call
                                  </a>
                                </Button>
                                <Button
                                  size="sm"
                                  className="rounded-lg h-9 text-white text-xs sm:text-sm"
                                  style={{ backgroundColor: accent }}
                                  asChild
                                >
                                  <a
                                    href={whatsappLink(
                                      `Hi, I'm interested in "${s.title}" from your store.`,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                    WhatsApp
                                  </a>
                                </Button>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {filteredServices.length > SERVICES_PER_PAGE && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={servicePage <= 1}
                      onClick={() => setServicePage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {servicePage} / {serviceTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={servicePage >= serviceTotalPages}
                      onClick={() => setServicePage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        </section>

        <footer className="text-center text-xs text-muted-foreground pt-2 pb-4 border-t border-slate-200/80 mt-4">
          Powered by Referral Powerhouse · Secure Paystack checkout
        </footer>
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-[60]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-label="Shopping cart"
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-4 border-b text-white"
              style={{ backgroundColor: accent }}
            >
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your cart
                {cart.length > 0 && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {cart.length}
                  </Badge>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Your cart is empty. Tap a bundle, enter a phone number, and add to cart.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((line) => (
                    <li
                      key={line.lineId}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">
                          {normalizeProvider(line.bundle.provider)} · {line.bundle.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {line.bundle.size_gb} GB · {line.phone}
                        </p>
                        <p className="text-sm font-semibold mt-1" style={{ color: accent }}>
                          ₵{Number(line.bundle.retail_price).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label="Remove item"
                        onClick={() => removeFromCart(line.lineId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t p-4 pb-6 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Total</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: accent }}>
                  ₵{cartTotal.toFixed(2)}
                </span>
              </div>
              {cart.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-600">Email (optional, for receipt)</Label>
                  <Input
                    type="email"
                    className="mt-1 rounded-lg h-10"
                    placeholder="you@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              )}
              <Button
                type="button"
                className="w-full text-white rounded-xl h-12 font-semibold text-base"
                style={{ backgroundColor: accent }}
                disabled={checkingOut || cart.length === 0}
                onClick={checkoutCart}
              >
                {checkingOut
                  ? "Redirecting to Paystack…"
                  : cart.length === 0
                    ? "Proceed to Pay"
                    : `Proceed to Pay · ₵${cartTotal.toFixed(2)}`}
              </Button>
            </div>
          </aside>
        </div>
      )}

      <StorefrontWhatsAppWidget
        whatsappPhone={whatsappPhone}
        storeName={displayProfile.store_name || "Data Store"}
        accentColor={accent}
      />

      <PwaInstallPrompt variant="storefront" />
    </div>
  )
}
