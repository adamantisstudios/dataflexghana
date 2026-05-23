"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Trash2, Leaf } from "lucide-react"
import { loadFarmCart, saveFarmCart, type FarmCartLine } from "@/lib/farm-cart"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"

type Props = {
  agentId?: string
  storeSegment?: string
  backHref: string
  accent?: string
}

export function FarmersFriendCart({ agentId, storeSegment, backHref, accent = "#0E8F3D" }: Props) {
  const cartScope = agentId ? { agentId } : ("global" as const)
  const [lines, setLines] = useState<FarmCartLine[]>([])
  const [paying, setPaying] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState("0")
  const [form, setForm] = useState({
    buyer_name: "",
    buyer_phone: "",
    buyer_email: "",
    delivery_address: "",
  })

  useEffect(() => {
    setLines(loadFarmCart(cartScope))
  }, [agentId])

  const persist = (next: FarmCartLine[]) => {
    setLines(next)
    saveFarmCart(cartScope, next)
  }

  const subtotal = lines.reduce((s, l) => s + l.listing.retail_price * l.quantity, 0)
  const fee = Math.max(0, Number(deliveryFee) || 0)
  const total = subtotal + fee

  const checkout = async () => {
    if (lines.length === 0) return
    if (!form.buyer_name.trim() || !form.buyer_phone.trim() || !form.delivery_address.trim()) {
      toast.error("Complete delivery details")
      return
    }
    setPaying(true)
    try {
      const res = await fetch("/api/paystack/farmers/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ listing_id: l.listing.id, quantity: l.quantity })),
          ...form,
          delivery_fee: fee,
          agent_id: agentId,
          store_segment: storeSegment,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Checkout failed")
      window.location.href = data.authorization_url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed")
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <h1 className="text-2xl font-bold">Your cart</h1>

        {lines.length === 0 ? (
          <p className="text-muted-foreground">Your cart is empty.</p>
        ) : (
          <>
            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.lineId} className="flex gap-3 rounded-xl border bg-white p-3">
                  <div className="relative h-16 w-16 rounded-lg bg-emerald-50 shrink-0 overflow-hidden">
                    {line.listing.photos[0] ? (
                      <Image src={line.listing.photos[0]} alt="" fill className="object-cover" />
                    ) : (
                      <Leaf className="h-8 w-8 m-auto text-emerald-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{line.listing.produce_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {line.quantity} {line.listing.unit} × ₵{line.listing.retail_price.toFixed(2)}
                    </p>
                    <p className="font-bold mt-1" style={{ color: accent }}>
                      ₵{(line.quantity * line.listing.retail_price).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => persist(lines.filter((l) => l.lineId !== line.lineId))}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h2 className="font-semibold">Delivery details</h2>
              <div>
                <Label>Full name *</Label>
                <Input className="mt-1" value={form.buyer_name} onChange={(e) => setForm((f) => ({ ...f, buyer_name: e.target.value }))} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input className="mt-1" type="tel" value={form.buyer_phone} onChange={(e) => setForm((f) => ({ ...f, buyer_phone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" value={form.buyer_email} onChange={(e) => setForm((f) => ({ ...f, buyer_email: e.target.value }))} />
              </div>
              <div>
                <Label>Delivery address *</Label>
                <Textarea className="mt-1" rows={3} value={form.delivery_address} onChange={(e) => setForm((f) => ({ ...f, delivery_address: e.target.value }))} />
              </div>
              <div>
                <Label>Delivery fee (GHS)</Label>
                <Input className="mt-1" type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₵{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery</span>
                <span>₵{fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span style={{ color: accent }}>₵{total.toFixed(2)}</span>
              </div>
            </div>

            <PaystackSecureBadge />
            <Button
              className="w-full h-12 text-white text-lg"
              style={{ backgroundColor: accent }}
              disabled={paying}
              onClick={checkout}
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirecting…
                </>
              ) : (
                `Pay ₵${total.toFixed(2)}`
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
