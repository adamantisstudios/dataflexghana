"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
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
import { Package, FileText, Plus } from "lucide-react"
import { WholesaleProductThumb } from "@/components/wholesale/WholesaleProductThumb"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
  StorefrontListPagination,
  StorefrontPageSection,
  paginateItems,
} from "@/components/storefront/StorefrontListPagination"
import { StorefrontImageLightbox } from "@/components/storefront/StorefrontImageLightbox"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"
import type { PublicWholesaleProduct, PublicComplianceForm, BuyerDetails } from "@/lib/storefront-catalog"
import {
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
  COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO,
} from "@/lib/storefront-catalog"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"

export type WholesaleCartLine = {
  lineId: string
  product: PublicWholesaleProduct
  quantity: number
}

export type StorefrontCatalogMode = "all" | "products" | "business"

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
  mode?: StorefrontCatalogMode
  onComplianceSubmitted?: () => void
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
  onRemoveWholesale: _onRemoveWholesale,
  onCheckoutWholesale,
  compliancePaidRef,
  customerEmail,
  mode = "all",
  onComplianceSubmitted,
}: Props) {
  const showProducts = mode === "all" || mode === "products"
  const showBusiness = mode === "all" || mode === "business"
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [productModal, setProductModal] = useState<PublicWholesaleProduct | null>(null)
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
  const [complianceSuccess, setComplianceSuccess] = useState(false)
  const [productPage, setProductPage] = useState(1)
  const [productSlideDir, setProductSlideDir] = useState<"up" | "down">("down")

  const productPagination = useMemo(
    () => paginateItems(products, productPage),
    [products, productPage],
  )

  const complianceUnlocked = Boolean(compliancePaidRef)
  const soleForm = complianceForms.find((f) => f.form_type === COMPLIANCE_FORM_SOLE_PROPRIETORSHIP)

  const openLightbox = (src: string | null | undefined, alt: string) => {
    if (!src?.trim()) return
    setLightbox({ src: src.trim(), alt })
  }

  const payCompliance = async () => {
    if (!soleForm) return
    const email = customerEmail.trim() || "customer@storefront.local"
    setPayingCompliance(true)
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/api/paystack/storefront/callback`
          : getStorefrontPaystackCallbackUrl()

      const res = await fetch("/api/paystack/storefront/compliance-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          agent_id: agentId,
          form_type: soleForm.form_type,
          amount: COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO,
          store_name: storeName,
          store_segment: storeSegment,
          callback_url: callbackUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment could not be started")
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
      setComplianceSuccess(true)
      setComplianceForm({
        business_name: "",
        owner_name: "",
        phone: "",
        email: "",
        location: "",
        signature: "",
      })
      onComplianceSubmitted?.()
      const redirectPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/store/${storeSegment}`
      setTimeout(() => {
        const url = new URL(redirectPath, window.location.origin)
        url.searchParams.delete("compliance_paid")
        url.searchParams.delete("form_type")
        window.location.href = url.toString()
      }, 4500)
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

  if (mode === "products" && products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">No products listed right now.</p>
    )
  }
  if (mode === "business" && complianceForms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">No business services listed right now.</p>
    )
  }
  if (products.length === 0 && complianceForms.length === 0 && mode === "all") return null

  return (
    <>
      {showProducts && products.length > 0 && (
        <section className="space-y-4">
          {mode === "all" && (
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: accent }}>
              <Package className="h-5 w-5" />
              Wholesale Shopping
            </h3>
          )}
          <p className="text-sm text-muted-foreground">
            Delivery cost will be discussed with the agent after you place your order.
          </p>
          <StorefrontPageSection
            pageKey={productPage}
            slideDirection={productSlideDir}
            className="grid grid-cols-2 gap-3 md:gap-4"
          >
            {productPagination.items.map((p) => (
              <Card
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setProductModal(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setProductModal(p)
                  }
                }}
                className="border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-xl"
              >
                <WholesaleProductThumb src={p.image_url} alt={p.name} />
                <div className="p-3 space-y-1">
                  <p className="font-medium text-sm text-slate-900 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">GH₵{p.retail_price.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </StorefrontPageSection>
          <StorefrontListPagination
            page={productPagination.page}
            totalPages={productPagination.totalPages}
            totalItems={productPagination.total}
            onPageChange={(p) => {
              setProductSlideDir(p > productPage ? "down" : "up")
              setProductPage(p)
            }}
            accentColor={accent}
          />
          {wholesaleCart.length > 0 && (
            <Button
              className="w-full sm:w-auto text-white"
              style={{ backgroundColor: accent }}
              asChild
            >
              <Link href={`/store/${encodeURIComponent(storeSegment)}/cart`}>
                View cart & checkout (GH₵
                {wholesaleCart.reduce((s, l) => s + l.product.retail_price * l.quantity, 0).toFixed(2)})
              </Link>
            </Button>
          )}
        </section>
      )}

      {showBusiness && complianceForms.length > 0 && soleForm && (
        <section className="space-y-4">
          {mode === "all" && (
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: accent }}>
              <FileText className="h-5 w-5" />
              Compliance
            </h3>
          )}

          <div className="grid grid-cols-2 gap-3 md:gap-4">
          {complianceSuccess ? (
            <Card className="border-emerald-200 bg-emerald-50 col-span-2">
              <CardContent className="p-6 space-y-3 text-center">
                <p className="font-semibold text-emerald-900">
                  Your form has been submitted. For follow-up, please contact the store agent.
                </p>
                <p className="text-sm text-emerald-800">
                  You will be redirected to the store in a few seconds…
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden col-span-2">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{soleForm.title}</h4>
                  <p className="text-lg font-bold mt-2" style={{ color: accent }}>
                    Fee: GH₵ 590
                  </p>
                  <p className="text-sm font-medium text-slate-600 mt-1">Payment summary: GH₵ 590</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                    <li>
                      Includes free nation-wide delivery of all documents to your doorstep within 14 working
                      days.
                    </li>
                    <li>
                      Fill forms easily, sign and submit securely. No queues, no disappointments, no delays.
                    </li>
                  </ul>
                </div>

                {!complianceUnlocked ? (
                  <div className="space-y-3">
                    <PaystackSecureBadge />
                    <Button
                      onClick={payCompliance}
                      disabled={payingCompliance}
                      className="w-full text-white h-11"
                      style={{ backgroundColor: accent }}
                    >
                      {payingCompliance ? "Redirecting to Paystack…" : "Pay GH₵ 590 to unlock form"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-emerald-700 font-medium">
                      Payment received — complete your application below
                    </p>
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
                    <PaystackSecureBadge />
                    <Button
                      onClick={submitCompliance}
                      disabled={submittingCompliance}
                      className="text-white w-full h-11"
                      style={{ backgroundColor: accent }}
                    >
                      {submittingCompliance ? "Submitting…" : "Submit application"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </section>
      )}

      <StorefrontImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
      />

      <Dialog
        open={productModal != null}
        onOpenChange={(open) => {
          if (!open) setProductModal(null)
        }}
      >
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto gap-0 border-slate-200 p-0 sm:rounded-2xl">
          {productModal && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{productModal.name}</DialogTitle>
              </DialogHeader>
              <div className="px-4 pt-12 pb-4 space-y-4">
                <button
                  type="button"
                  className="relative w-full min-h-[200px] max-h-[48vh] rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                  onClick={() => openLightbox(productModal.image_url, productModal.name)}
                  aria-label="View full-size product image"
                >
                  <ImageWithFallback
                    src={productModal.image_url?.trim() || "/placeholder-product.jpg"}
                    alt={productModal.name}
                    className="max-h-[48vh] w-full h-auto object-contain"
                    fallbackSrc="/placeholder-product.jpg"
                  />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
                    Tap for full screen
                  </span>
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 leading-snug">{productModal.name}</h3>
                  <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
                    GH₵{productModal.retail_price.toFixed(2)}
                  </p>
                </div>
                {productModal.description?.trim() ? (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {productModal.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No description provided.</p>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/90 p-4 sm:flex-col">
                <Button
                  type="button"
                  className="w-full h-12 gap-2 text-white text-base font-semibold rounded-xl"
                  style={{ backgroundColor: accent }}
                  onClick={() => {
                    onAddWholesale(productModal, 1)
                    setProductModal(null)
                  }}
                >
                  <Plus className="h-5 w-5 shrink-0" />
                  Add to Cart
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl border-slate-200"
                  onClick={() => setProductModal(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
          <PaystackSecureBadge />
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

