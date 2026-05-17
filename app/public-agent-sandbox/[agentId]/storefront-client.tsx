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
import { Phone, MessageCircle, Wifi } from "lucide-react"

interface DataBundle {
  id: string
  name: string
  provider: string
  size_gb: number
  price: number
  custom_margin: number
  final_price: number
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

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful! Your bundle order is being processed.")
    }
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/storefront/public/${agentId}`, { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Store unavailable")
        setProfile(data.profile)
        setBundles(data.dataBundles || [])
        setServices(data.referralServices || [])
        const providers = (data.dataBundles || []).map((b: DataBundle) => normalizeProvider(b.provider))
        if (providers.includes("MTN")) setNetworkTab("MTN")
        else if (providers[0]) setNetworkTab(normalizeProvider(providers[0]))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load store")
      } finally {
        setLoading(false)
      }
    }
    if (agentId) load()
  }, [agentId])

  const accent = profile?.primary_color || "#3B82F6"

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

  const whatsappLink = (message: string) => {
    const num = (profile?.whatsapp_number || profile?.phone_number || "").replace(/\D/g, "")
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground animate-pulse">Loading store…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-slate-600">This storefront is not available.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="text-white px-4 py-10 shadow-lg" style={{ backgroundColor: accent }}>
        <div className="max-w-3xl mx-auto text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight">{profile.store_name || "Data Store"}</h1>
          {profile.business_info && (
            <p className="text-white/90 text-sm mt-3 max-w-xl whitespace-pre-wrap leading-relaxed">
              {profile.business_info}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6 space-y-8">
        <Card className="shadow-lg border-0">
          <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-slate-700">Your phone (for data delivery)</Label>
              <Input
                className="mt-1"
                placeholder="024XXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-slate-700">Email (for Paystack receipt)</Label>
              <Input
                className="mt-1"
                type="email"
                placeholder="you@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {services.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: accent }}>
              Referral services
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-40 bg-slate-100">
                    <Image
                      src={s.image_url || "/placeholder.svg"}
                      alt={s.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{s.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{s.description}</p>
                      <p className="text-lg font-bold mt-2" style={{ color: accent }}>
                        ₵{Number(s.cost).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" className="w-full" asChild>
                        <a href={`tel:${profile.phone_number || ""}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Agent
                        </a>
                      </Button>
                      <Button className="w-full text-white" style={{ backgroundColor: accent }} asChild>
                        <a
                          href={whatsappLink(`Hi, I'm interested in "${s.title}" from your store.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact Agent
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
            <Wifi className="h-5 w-5" />
            Data bundles
          </h2>
          {bundles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bundles available right now.</p>
          ) : (
            <Tabs value={networkTab} onValueChange={setNetworkTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                {NETWORK_TABS.map((n) => (
                  <TabsTrigger key={n.key} value={n.key} disabled={!bundlesByNetwork[n.key]?.length}>
                    {n.label}
                    {bundlesByNetwork[n.key]?.length ? (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                        {bundlesByNetwork[n.key].length}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
              {NETWORK_TABS.map((n) => (
                <TabsContent key={n.key} value={n.key} className="space-y-3 mt-0">
                  {(bundlesByNetwork[n.key] || []).map((b) => (
                    <Card key={b.id} className="overflow-hidden">
                      <CardContent className="p-4 flex gap-4 items-center">
                        {b.image_url ? (
                          <Image
                            src={b.image_url}
                            alt={b.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: accent }}
                          >
                            {b.size_gb}G
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.size_gb} GB · {b.provider}</p>
                          <p className="text-lg font-bold mt-1" style={{ color: accent }}>
                            ₵{Number(b.final_price).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          className="shrink-0 text-white"
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
                    <p className="text-sm text-muted-foreground text-center py-6">No {n.label} bundles listed.</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </section>

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Powered by Referral Powerhouse · Secure Paystack checkout
        </footer>
      </main>
    </div>
  )
}
