"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
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
import { toast } from "sonner"
import { Instagram, ExternalLink, Loader2, CheckCircle2, Shield, Sparkles } from "lucide-react"
import type { PublicInfluencerProfile, PublicInfluencerPackage } from "@/lib/influencer-types"
import { calculateInfluencerFees } from "@/lib/influencer-types"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"

const BRAND = "#0E8F3D"

type Props = {
  agentId: string
  storeSegment: string
  accent: string
  influencer: PublicInfluencerProfile | null
}

export function StorefrontInfluencersTab({ agentId, storeSegment, accent, influencer }: Props) {
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<PublicInfluencerPackage | null>(null)
  const [paying, setPaying] = useState(false)
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    requirements: "",
  })

  const paymentSuccess = searchParams.get("influencer_payment") === "success"
  const paidRef = searchParams.get("ref")

  useEffect(() => {
    if (paymentSuccess && paidRef) {
      toast.success(`Order confirmed. Reference: ${paidRef}`)
    }
  }, [paymentSuccess, paidRef])

  const fees = selected ? calculateInfluencerFees(selected.price) : null

  const startCheckout = async () => {
    if (!selected) return
    if (!form.client_name.trim() || !form.client_phone.trim() || !form.requirements.trim()) {
      toast.error("Name, phone, and requirements are required")
      return
    }
    setPaying(true)
    try {
      const res = await fetch("/api/paystack/influencer/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          package_id: selected.id,
          store_segment: storeSegment,
          client_name: form.client_name.trim(),
          client_phone: form.client_phone.trim(),
          client_email: form.client_email.trim() || undefined,
          requirements: form.requirements.trim(),
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

  if (!influencer) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-muted-foreground">
        <Sparkles className="h-10 w-10 mx-auto mb-3 text-slate-300" />
        <p>This store does not have an approved micro-influencer profile yet.</p>
      </div>
    )
  }

  const socialEntries = Object.entries(influencer.social_handles || {})

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
        <p className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-700" />
          Protected checkout
        </p>
        <p className="mt-1">
          We hold funds in escrow and only release to the influencer after you confirm the work is done. This protects
          your investment.
        </p>
      </div>

      {paymentSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">Payment successful</p>
            <p className="text-sm text-emerald-800 mt-1">
              Your influencer order has been received{paidRef ? ` (ref: ${paidRef})` : ""}.
            </p>
          </div>
        </div>
      )}

      <section
        className="rounded-2xl overflow-hidden border bg-white shadow-sm"
        style={{ borderColor: `${accent}30` }}
      >
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          {influencer.photo_url ? (
            <Image
              src={influencer.photo_url}
              alt={influencer.full_name}
              width={96}
              height={96}
              className="rounded-2xl object-cover h-24 w-24 border-2 shrink-0"
              style={{ borderColor: accent }}
            />
          ) : (
            <div
              className="h-24 w-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ backgroundColor: accent }}
            >
              {influencer.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Micro-Influencer</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>
              {influencer.full_name}
            </h2>
            {influencer.niche && (
              <Badge className="mt-2" style={{ backgroundColor: BRAND }}>
                {influencer.niche}
              </Badge>
            )}
            <p className="text-sm text-slate-500 mt-2">
              {influencer.audience_size.toLocaleString()}+ audience
            </p>
            {influencer.bio && <p className="mt-3 text-slate-600 text-sm leading-relaxed">{influencer.bio}</p>}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    {platform}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {influencer.packages.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No active packages at the moment.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {influencer.packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelected(pkg)}
              className="text-left rounded-xl border-2 border-slate-200 p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-white"
            >
              <h3 className="font-semibold text-slate-900">{pkg.title}</h3>
              <p className="text-2xl font-bold mt-2" style={{ color: BRAND }}>
                ₵{pkg.price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{pkg.delivery_days} day delivery</p>
              {pkg.description && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{pkg.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        <Link href="/influencer-terms" className="underline">
          Influencer Terms
        </Link>{" "}
        · 8% platform service fee applies at checkout
      </p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Your name</Label>
              <Input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.client_phone}
                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Campaign requirements</Label>
              <Textarea
                rows={4}
                placeholder="Describe what you need: talking points, hashtags, deadlines…"
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              />
            </div>
            {fees && (
              <div className="rounded-lg bg-slate-50 border p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Package price</span>
                  <span>₵{fees.package_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform service fee (8%)</span>
                  <span>₵{fees.platform_fee_client.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Total to pay</span>
                  <span style={{ color: BRAND }}>₵{fees.total_price.toFixed(2)}</span>
                </div>
              </div>
            )}
            <PaystackSecureBadge />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              onClick={startCheckout}
              disabled={paying}
              className="text-white"
              style={{ backgroundColor: accent }}
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pay with Paystack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
