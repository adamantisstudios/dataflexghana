"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react"
import { WholesaleProductThumb } from "@/components/wholesale/WholesaleProductThumb"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"
import { StoreFooter } from "@/components/storefront/StoreFooter"
import {
  loadWholesaleCart,
  saveWholesaleCart,
  type StoredWholesaleCartLine,
} from "@/lib/storefront-wholesale-cart"
import type { BuyerDetails } from "@/lib/storefront-catalog"

type StoreProfile = {
  store_name: string | null
  store_slug?: string | null
  primary_color: string | null
}

type Props = {
  agentId: string
  storeSegment: string
  initialProfile: StoreProfile | null
}

export function StorefrontWholesaleCartClient({
  agentId,
  storeSegment,
  initialProfile,
}: Props) {
  const router = useRouter()
  const accent = initialProfile?.primary_color || "#059669"
  const storeName = initialProfile?.store_name || "Store"
  const storeHref = `/store/${encodeURIComponent(storeSegment)}`

  const [lines, setLines] = useState<StoredWholesaleCartLine[]>([])
  const [customerEmail, setCustomerEmail] = useState("")
  const [buyer, setBuyer] = useState<BuyerDetails>({
    full_name: "",
    location: "",
    address: "",
    contact_number: "",
    extra_notes: "",
  })
  const [checkingOut, setCheckingOut] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setLines(loadWholesaleCart(agentId))
    setHydrated(true)
  }, [agentId])

  useEffect(() => {
    if (!hydrated) return
    saveWholesaleCart(agentId, lines)
  }, [agentId, lines, hydrated])

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.product.retail_price * l.quantity, 0),
    [lines],
  )

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }

  const checkout = async () => {
    if (lines.length === 0) return
    if (!buyer.full_name.trim() || !buyer.contact_number.trim() || !buyer.address.trim()) {
      toast.error("Please fill in delivery details")
      return
    }

    const email =
      customerEmail.trim() || `${buyer.contact_number.replace(/\D/g, "")}@storefront.local`

    setCheckingOut(true)
    try {
      const res = await fetch("/api/paystack/storefront/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          agent_id: agentId,
          order_type: "wholesale",
          store_name: storeName,
          store_segment: storeSegment,
          buyer_details: buyer,
          items: lines.map((l) => ({
            wholesale_product_id: l.product.id,
            quantity: l.quantity,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header
        className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3"
        style={{ borderColor: `${accent}33` }}
      >
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href={storeHref} aria-label="Back to store">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-slate-900 truncate flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 shrink-0" style={{ color: accent }} />
            Your cart
          </h1>
          <p className="text-xs text-muted-foreground truncate">{storeName}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-4">
        {!hydrated ? (
          <p className="text-sm text-muted-foreground text-center py-12">Loading cart…</p>
        ) : lines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">Your product cart is empty.</p>
              <Button asChild style={{ backgroundColor: accent }} className="text-white">
                <Link href={storeHref}>Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {lines.map((line) => (
                <Card key={line.lineId} className="overflow-hidden border-slate-200">
                  <WholesaleProductThumb src={line.product.image_url} alt={line.product.name} />
                  <CardContent className="p-2.5 space-y-2">
                    <p className="text-xs font-medium line-clamp-2 leading-tight">{line.product.name}</p>
                    <p className="text-sm font-bold" style={{ color: accent }}>
                      GH₵{(line.product.retail_price * line.quantity).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Qty {line.quantity}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeLine(line.lineId)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Order total</span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: accent }}>
                    GH₵{total.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Delivery cost will be discussed with the agent after your order is placed.
                </p>

                <div className="space-y-3">
                  {(
                    [
                      ["full_name", "Full name"],
                      ["location", "Location / area"],
                      ["address", "Delivery address"],
                      ["contact_number", "Contact number"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Input
                        className="h-10 mt-1"
                        value={buyer[key]}
                        onChange={(e) => setBuyer((b) => ({ ...b, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs">Extra notes (optional)</Label>
                    <Textarea
                      className="mt-1"
                      value={buyer.extra_notes || ""}
                      onChange={(e) => setBuyer((b) => ({ ...b, extra_notes: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email (optional, for receipt)</Label>
                    <Input
                      type="email"
                      className="h-10 mt-1"
                      placeholder="you@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>

                <PaystackSecureBadge />

                <Button
                  type="button"
                  className="w-full h-12 text-white font-semibold rounded-xl"
                  style={{ backgroundColor: accent }}
                  disabled={checkingOut}
                  onClick={checkout}
                >
                  {checkingOut ? "Redirecting to Paystack…" : `Proceed to Pay · GH₵${total.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <StoreFooter />
      </main>
    </div>
  )
}
