"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Package, FileText, Plus, X, ZoomIn } from "lucide-react"
import type { PublicWholesaleProduct, PublicComplianceForm, BuyerDetails } from "@/lib/storefront-catalog"
import { COMPLIANCE_FORM_SOLE_PROPRIETORSHIP } from "@/lib/storefront-catalog"

export type WholesaleCartLine = {
  lineId: string
  product: PublicWholesaleProduct
  quantity: number
}

type Props = {
  agentId: string
  storeSegment: string
  storeName: string
  accent: string
  products: PublicWholesaleProduct[]
  complianceForms: PublicComplianceForm[]
  wholesaleCart: WholesaleCartLine[]
  onAddWholesale: (product: PublicWholesaleProduct, qty: number) => void
  onRemoveWholesale: (lineId: string) => void
  onCheckoutWholesale: (buyer: BuyerDetails, email: string) => Promise<void>
  compliancePaidRef: string | null
  customerEmail: string
}

export function StorefrontExtendedCatalog({
  agentId,
  storeSegment,
  storeName,
  accent,
  products,
  complianceForms,
  wholesaleCart,
  onAddWholesale,
  onRemoveWholesale,
  onCheckoutWholesale,
  compliancePaidRef,
  customerEmail,
}: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [buyerOpen, setBuyerOpen] = useState(false)
  const [buyer, setBuyer] = useState<BuyerDetails>({
    full_name: "",
    location: "",
    address: "",
    contact_number: "",
    extra_notes: "",
  })
  const [checkingOut, setCheckingOut] = useState(false)
  const [payingCompliance, setPayingCompliance] = useState(false)
  const [complianceForm, setComplianceForm] = useState({
    business_name: "",
    owner_name: "",
    phone: "",
    email: customerEmail || "",
    location: "",
    signature: "",
  })
  const [submittingCompliance, setSubmittingCompliance] = useState(false)

  const complianceUnlocked = Boolean(compliancePaidRef)
  const soleForm = complianceForms.find((f) => f.form_type === COMPLIANCE_FORM_SOLE_PROPRIETORSHIP)

  const payCompliance = async () => {
    if (!soleForm) return
    const email = customerEmail.trim() || "customer@storefront.local"
    setPayingCompliance(true)
    try {
      const res = await fetch("/api/paystack/storefront/compliance-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          agent_id: agentId,
          form_type: soleForm.form_type,
          store_name: storeName,
          store_segment: storeSegment,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.authorizationUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
      setPayingCompliance(false)
    }
  }

  const submitCompliance = async () => {
    if (!compliancePaidRef) return
    setSubmittingCompliance(true)
    try {
      const res = await fetch("/api/storefront/compliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          form_type: COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
          paystack_reference: compliancePaidRef,
          customer_data: complianceForm,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Application submitted! The agent will process your registration.")
      setComplianceForm({
        business_name: "",
        owner_name: "",
        phone: "",
        email: "",
        location: "",
        signature: "",
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed")
    } finally {
      setSubmittingCompliance(false)
    }
  }

  const confirmWholesaleCheckout = async () => {
    setCheckingOut(true)
    try {
      await onCheckoutWholesale(buyer, customerEmail.trim() || `${buyer.contact_number}@storefront.local`)
      setBuyerOpen(false)
    } finally {
      setCheckingOut(false)
    }
  }

  if (products.length === 0 && complianceForms.length === 0) return null

  return (
    <>
      {products.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: accent }}>
            <Package className="h-5 w-5" />
            Shop products
          </h3>
          <p className="text-sm text-muted-foreground">
            Delivery cost will be discussed with the agent after you place your order.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                {p.image_url && (
                  <button
                    type="button"
                    className="relative w-full aspect-square bg-slate-100"
                    onClick={() => setLightbox(p.image_url)}
                  >
                    <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded">
                      <ZoomIn className="h-4 w-4" />
                    </span>
                  </button>
                )}
                <CardContent className="p-4 space-y-2">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-lg font-bold" style={{ color: accent }}>
                    ₵{p.retail_price.toFixed(2)}
                  </p>
                  <Button
                    size="sm"
                    className="w-full gap-1 text-white"
                    style={{ backgroundColor: accent }}
                    onClick={() => onAddWholesale(p, 1)}
                  >
                    <Plus className="h-4 w-4" />
                    Add to cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {wholesaleCart.length > 0 && (
            <Button className="w-full sm:w-auto" onClick={() => setBuyerOpen(true)} style={{ backgroundColor: accent }}>
              Checkout products (₵{wholesaleCart.reduce((s, l) => s + l.product.retail_price * l.quantity, 0).toFixed(2)})
            </Button>
          )}
        </section>
      )}

      {complianceForms.length > 0 && soleForm && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: accent }}>
            <FileText className="h-5 w-5" />
            Business services
          </h3>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold">{soleForm.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{soleForm.description}</p>
                <p className="text-lg font-bold mt-2" style={{ color: accent }}>
                  Fee: ₵{soleForm.admin_price.toFixed(2)}
                </p>
              </div>
              {!complianceUnlocked ? (
                <Button
                  onClick={payCompliance}
                  disabled={payingCompliance}
                  className="text-white"
                  style={{ backgroundColor: accent }}
                >
                  {payingCompliance ? "Redirecting…" : "Pay to unlock form"}
                </Button>
              ) : (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm text-emerald-700 font-medium">Payment received — complete your application</p>
                  {(
                    [
                      ["business_name", "Business name"],
                      ["owner_name", "Owner full name"],
                      ["phone", "Phone"],
                      ["email", "Email"],
                      ["location", "Location"],
                      ["signature", "Digital signature (type full name)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label>{label}</Label>
                      <Input
                        value={complianceForm[key]}
                        onChange={(e) => setComplianceForm((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <Button
                    onClick={submitCompliance}
                    disabled={submittingCompliance}
                    className="text-white w-full"
                    style={{ backgroundColor: accent }}
                  >
                    {submittingCompliance ? "Submitting…" : "Submit application"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
        >
          <button type="button" className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
          <Image src={lightbox} alt="" width={800} height={800} className="max-h-[90vh] w-auto object-contain" />
        </div>
      )}

      <Dialog open={buyerOpen} onOpenChange={setBuyerOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery details</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
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
                <Label>{label}</Label>
                <Input
                  value={buyer[key]}
                  onChange={(e) => setBuyer((b) => ({ ...b, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <Label>Extra notes (optional)</Label>
              <Textarea
                value={buyer.extra_notes || ""}
                onChange={(e) => setBuyer((b) => ({ ...b, extra_notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmWholesaleCheckout}
              disabled={checkingOut}
              style={{ backgroundColor: accent }}
              className="text-white"
            >
              {checkingOut ? "Processing…" : "Pay with Paystack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
