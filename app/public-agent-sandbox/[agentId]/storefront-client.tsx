"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Phone, MessageCircle, ShoppingBag } from "lucide-react"

interface DataBundle {
  id: string
  name: string
  provider: string
  size_gb: number
  price: number
  custom_margin: number
  final_price: number
}

interface ReferralService {
  id: string
  title: string
  description: string
  cost: number
}

interface StoreProfile {
  store_name: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
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

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful! Your order is being processed.")
    }
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/storefront/public/${agentId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Store unavailable")
        setProfile(data.profile)
        setBundles(data.dataBundles || [])
        setServices(data.referralServices || [])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load store")
      } finally {
        setLoading(false)
      }
    }
    if (agentId) load()
  }, [agentId])

  const accent = profile?.primary_color || "#3B82F6"

  const buyBundle = async (bundle: DataBundle) => {
    if (!customerPhone.trim()) {
      toast.error("Enter your phone number first")
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
      toast.error(e instanceof Error ? e.message : "Payment failed to start")
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
        <p className="text-muted-foreground">Loading store…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <p>This storefront is not available.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="text-white px-4 py-8" style={{ backgroundColor: accent }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">{profile.store_name || "Data Store"}</h1>
          {profile.business_info && (
            <p className="text-white/90 text-sm mt-2 whitespace-pre-wrap">{profile.business_info}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Phone (for bundle delivery)</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="024XXXXXXX" />
            </div>
            <div>
              <Label>Email (for payment)</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="optional"
              />
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" style={{ color: accent }} />
            Data bundles
          </h2>
          {bundles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bundles listed yet.</p>
          ) : (
            <div className="grid gap-4">
              {bundles.map((b) => (
                <Card key={b.id}>
                  <CardContent className="pt-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.provider} · {b.size_gb}GB
                      </p>
                      <p className="text-lg font-bold mt-1" style={{ color: accent }}>
                        ₵{Number(b.final_price).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      style={{ backgroundColor: accent }}
                      className="text-white"
                      disabled={payingId === b.id}
                      onClick={() => buyBundle(b)}
                    >
                      {payingId === b.id ? "Redirecting…" : "Buy"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Referral services</h2>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services listed yet.</p>
          ) : (
            <div className="grid gap-4">
              {services.map((s) => (
                <Card key={s.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                      <Badge variant="outline" className="mt-1">
                        ₵{Number(s.cost).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <a href={`tel:${profile.phone_number || ""}`}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call Agent
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a
                          href={whatsappLink(`Hi, I'm interested in ${s.title} from your store.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Contact Agent
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
