"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Radio,
  Tv,
  Globe,
  Newspaper,
  MapPin,
  Megaphone,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import type { PublicAdPackage } from "@/lib/advertising-types"
import { AD_MEDIA_LABELS, type AdMediaType } from "@/lib/advertising-types"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"

const MEDIA_TABS: { id: AdMediaType | "all"; label: string; icon: typeof Radio }[] = [
  { id: "all", label: "All", icon: Megaphone },
  { id: "radio", label: "Radio", icon: Radio },
  { id: "tv", label: "TV", icon: Tv },
  { id: "online", label: "Online", icon: Globe },
  { id: "print", label: "Print", icon: Newspaper },
  { id: "outdoor", label: "Outdoor", icon: MapPin },
]

type Props = {
  agentId: string
  storeSegment: string
  accent: string
  packages: PublicAdPackage[]
}

export function StorefrontAdvertisingTab({ agentId, storeSegment, accent, packages }: Props) {
  const searchParams = useSearchParams()
  const [mediaFilter, setMediaFilter] = useState<AdMediaType | "all">("all")
  const [selected, setSelected] = useState<PublicAdPackage | null>(null)
  const [paying, setPaying] = useState(false)
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_business: "",
    ad_message: "",
  })

  const adPaidRef = searchParams.get("ref")
  const adPaymentSuccess = searchParams.get("ad_payment") === "success"

  useEffect(() => {
    if (adPaymentSuccess && adPaidRef) {
      toast.success(`Advertising order confirmed. Reference: ${adPaidRef}`)
    }
  }, [adPaymentSuccess, adPaidRef])

  const filtered = useMemo(() => {
    if (mediaFilter === "all") return packages
    return packages.filter((p) => p.media_type === mediaFilter)
  }, [packages, mediaFilter])

  const startCheckout = async () => {
    if (!selected) return
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast.error("Name and phone are required")
      return
    }
    setPaying(true)
    try {
      const res = await fetch("/api/paystack/advertising/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          package_id: selected.id,
          store_segment: storeSegment,
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Payment failed to start")
      window.location.href = data.authorization_url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed")
      setPaying(false)
    }
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, #0A5C2A 55%, #063d1c 100%)`,
        }}
      >
        <p className="text-xs uppercase tracking-widest text-white/80 font-medium">Media partners</p>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
          Advertise Your Business on Radio, TV &amp; More
        </h2>
        <p className="mt-3 text-white/90 max-w-2xl text-sm sm:text-base">
          Reach thousands through trusted media partners. Choose a package, submit your message, and pay securely.
        </p>
      </section>

      {adPaymentSuccess && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Payment received — thank you!</p>
            <p className="text-sm mt-1">
              Your advertising request is being processed.
              {adPaidRef && (
                <span className="block font-mono text-xs mt-1">Reference: {adPaidRef}</span>
              )}
            </p>
          </div>
        </div>
      )}

      <Tabs value={mediaFilter} onValueChange={(v) => setMediaFilter(v as AdMediaType | "all")}>
        <TabsList className="w-full h-auto flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl">
          {MEDIA_TABS.map((tab) => {
            const Icon = tab.icon
            const show = tab.id === "all" || packages.some((p) => p.media_type === tab.id)
            if (!show && tab.id !== "all") return null
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {MEDIA_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                No advertising packages in this category right now.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      setSelected(pkg)
                      setForm((f) => ({ ...f }))
                    }}
                    className="text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-[#0E8F3D]/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8F3D]"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0E8F3D]/15 to-[#35B24A]/20 flex items-center justify-center mb-3">
                      <Megaphone className="h-6 w-6 text-[#0E8F3D]" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-[#0E8F3D]/30 text-[#0A5C2A]">
                      {AD_MEDIA_LABELS[pkg.media_type]}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">{pkg.station_name}</p>
                    <h3 className="font-bold text-slate-900 mt-1 line-clamp-2">{pkg.package_name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{pkg.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {Object.entries(pkg.custom_fields)
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[#F9FBF9] border border-[#0E8F3D]/15 text-[#0A5C2A]"
                          >
                            {k}: {v}
                          </span>
                        ))}
                    </div>
                    <p className="text-2xl font-bold mt-4" style={{ color: accent }}>
                      ₵{pkg.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#0E8F3D] font-medium mt-3">Book this package →</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.package_name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selected.station_name} · {AD_MEDIA_LABELS[selected.media_type]}
                </p>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selected.description && <p>{selected.description}</p>}
                {(selected.number_of_spots != null || selected.spot_duration) && (
                  <p className="text-muted-foreground">
                    {selected.number_of_spots != null && `${selected.number_of_spots} spots`}
                    {selected.number_of_spots != null && selected.spot_duration && " · "}
                    {selected.spot_duration}
                  </p>
                )}
                <p className="text-2xl font-bold text-[#0E8F3D]">₵{selected.price.toFixed(2)}</p>
              </div>
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label>Full name *</Label>
                  <Input
                    className="mt-1"
                    value={form.customer_name}
                    onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    className="mt-1"
                    type="tel"
                    value={form.customer_phone}
                    onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Business name</Label>
                  <Input
                    className="mt-1"
                    value={form.customer_business}
                    onChange={(e) => setForm((f) => ({ ...f, customer_business: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Your ad message *</Label>
                  <Textarea
                    className="mt-1 min-h-[100px]"
                    placeholder="What should listeners/viewers hear or see?"
                    value={form.ad_message}
                    onChange={(e) => setForm((f) => ({ ...f, ad_message: e.target.value }))}
                  />
                </div>
              </div>
              <PaystackSecureBadge className="justify-center" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)} disabled={paying}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#0E8F3D] hover:bg-[#0A5C2A] text-white"
                  onClick={startCheckout}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    `Pay ₵${selected.price.toFixed(2)}`
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
