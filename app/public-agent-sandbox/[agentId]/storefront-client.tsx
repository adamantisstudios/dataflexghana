"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Phone, MessageCircle, Wifi, X, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import {
  normalizeGhanaPhoneNumber,
  toTelHref,
  toWhatsAppHref,
} from "@/lib/phone-utils"
import { StorefrontWhatsAppWidget } from "@/components/storefront/StorefrontWhatsAppWidget"

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

export default function PublicAgentStorefront() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = params.agentId as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StoreProfile | null>(null)
  const [bundles, setBundles] = useState<DataBundle[]>([])
  const [services, setServices] = useState<ReferralService[]>([])
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [payingId, setPayingId] = useState<string | null>(null)
  const [networkTab, setNetworkTab] = useState<string>("MTN")
  const [mainTab, setMainTab] = useState<"bundles" | "services">("bundles")
  const [serviceSearch, setServiceSearch] = useState("")
  const [servicePage, setServicePage] = useState(1)
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(true)

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful! Your bundle order is being processed.")
    }
  }, [searchParams])

  useEffect(() => {
    if (!showDeliveryNotice) return
    const t = setTimeout(() => setShowDeliveryNotice(false), DELIVERY_NOTICE_MS)
    return () => clearTimeout(t)
  }, [showDeliveryNotice])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/storefront/public/${agentId}`, { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Store unavailable")

        const apiBundles: DataBundle[] = (data.bundles || []).map(
          (b: DataBundle & { final_price?: number }) => ({
            ...b,
            retail_price: Number(b.retail_price ?? b.final_price ?? 0),
          }),
        )
        const apiServices: ReferralService[] = data.services || []

        setProfile(data.profile ?? null)
        setBundles(apiBundles)
        setServices(apiServices)

        const providers = apiBundles.map((b) => normalizeProvider(b.provider))
        if (providers.includes("MTN")) setNetworkTab("MTN")
        else if (providers[0]) setNetworkTab(normalizeProvider(providers[0]))

        if (apiServices.length > 0 && apiBundles.length === 0) setMainTab("services")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load store")
      } finally {
        setLoading(false)
      }
    }
    if (agentId) load()
  }, [agentId])

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
    setServicePage(1)
  }, [serviceSearch])

  useEffect(() => {
    if (servicePage > serviceTotalPages) setServicePage(serviceTotalPages)
  }, [servicePage, serviceTotalPages])

  const buyBundle = async (bundle: DataBundle) => {
    if (!customerPhone.trim()) {
      toast.error("Enter your phone number for delivery")
      return
    }
    const email = customerEmail.trim() || `${customerPhone.replace(/\D/g, "")}@storefront.local`
    setPayingId(bundle.id)
    try {
      const res = await fetch("/api/paystack/storefront/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          agent_id: agentId,
          data_bundle_id: bundle.id,
          customer_phone: customerPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.authorizationUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment")
      setPayingId(null)
    }
  }

  const whatsappLink = (message: string) => toWhatsAppHref(whatsappPhone, message) ?? "#"

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28">
      {showDeliveryNotice && (
        <div
          className="sticky top-0 z-40 border-b shadow-sm animate-in slide-in-from-top duration-300"
          style={{ backgroundColor: accent, borderColor: `${accent}33` }}
          role="status"
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-start gap-3 text-white">
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
        className="text-white px-4 py-10 shadow-md"
        style={{ backgroundColor: accent }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium mb-1">
            Official store
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {displayProfile.store_name || "Data Store"}
          </h1>
          {displayProfile.business_info && (
            <p className="text-white/90 text-sm mt-3 max-w-xl whitespace-pre-wrap leading-relaxed">
              {displayProfile.business_info}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-5 space-y-6 relative z-10">
        <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-slate-700 font-medium">Your phone (for data delivery)</Label>
              <Input
                className="mt-1.5 rounded-lg"
                placeholder="024XXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-slate-700 font-medium">Email (for Paystack receipt)</Label>
              <Input
                className="mt-1.5 rounded-lg"
                type="email"
                placeholder="you@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "bundles" | "services")}>
          <TabsList className="w-full h-auto grid grid-cols-2 p-1 rounded-xl bg-slate-100 shadow-inner">
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
                  <TabsContent key={n.key} value={n.key} className="space-y-3 mt-3">
                    {(bundlesByNetwork[n.key] || []).map((b) => (
                      <Card key={b.id} className="border-0 shadow-md rounded-xl overflow-hidden">
                        <CardContent className="p-4 flex gap-4 items-center">
                          {b.image_url ? (
                            <Image
                              src={b.image_url}
                              alt={b.name}
                              width={52}
                              height={52}
                              className="rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: accent }}
                            >
                              {b.size_gb}G
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{b.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.size_gb} GB · {b.provider}
                            </p>
                            <p className="text-lg font-bold mt-1" style={{ color: accent }}>
                              ₵{Number(b.retail_price).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            className="shrink-0 text-white rounded-lg px-4"
                            style={{ backgroundColor: accent }}
                            disabled={payingId === b.id}
                            onClick={() => buyBundle(b)}
                          >
                            {payingId === b.id ? "…" : "Buy"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    {paginatedServices.map((s) => (
                      <Card
                        key={s.id}
                        className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-0">
                          <div className="flex gap-0 sm:flex-col">
                            <div className="relative w-24 sm:w-full h-24 sm:h-36 shrink-0 bg-slate-100">
                              <Image
                                src={s.image_url || "/placeholder.svg"}
                                alt={s.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 96px, 50vw"
                              />
                            </div>
                            <div className="p-4 flex-1 flex flex-col min-w-0">
                              <h3 className="font-semibold text-slate-900 line-clamp-2">{s.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">
                                {s.description}
                              </p>
                              <p className="text-lg font-bold mt-2" style={{ color: accent }}>
                                ₵{Number(s.cost).toFixed(2)}
                              </p>
                              <div className="flex flex-col gap-2 mt-3">
                                <Button variant="outline" size="sm" className="w-full rounded-lg" asChild>
                                  <a href={toTelHref(callPhone) ?? "#"}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Agent
                                  </a>
                                </Button>
                                <Button
                                  size="sm"
                                  className="w-full text-white rounded-lg"
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
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Contact Agent
                                  </a>
                                </Button>
                              </div>
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

        <footer className="text-center text-xs text-muted-foreground pt-2 pb-4">
          Powered by Referral Powerhouse · Secure Paystack checkout
        </footer>
      </main>

      <StorefrontWhatsAppWidget
        whatsappPhone={whatsappPhone}
        storeName={displayProfile.store_name || "Data Store"}
        accentColor={accent}
      />
    </div>
  )
}
