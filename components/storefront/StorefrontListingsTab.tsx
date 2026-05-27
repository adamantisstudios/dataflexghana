"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StorefrontImageLightbox } from "@/components/storefront/StorefrontImageLightbox"
import type { AgentProduct } from "@/lib/listing-packages-server"
import { toWhatsAppHref } from "@/lib/phone-utils"
import { Copy, MessageCircle, QrCode, Mail, Link2 } from "lucide-react"
import { toast } from "sonner"

type StorefrontFeatures = {
  whatsapp_button?: boolean
  featured_badge?: boolean
  reviews?: boolean
  qr_code?: boolean
  video_embed?: boolean
  email_support?: boolean
  inquiry_form?: boolean
  stock_counter?: boolean
  related_products?: boolean
  limited_offer_badge?: boolean
  affiliate_share_link?: boolean
  pdf_brochure?: boolean
}

type Props = {
  products: AgentProduct[]
  accent: string
  whatsappPhone: string
  storeName: string
  storePath: string
  features?: StorefrontFeatures
}

function allEnabledFallback(features?: StorefrontFeatures): Required<StorefrontFeatures> {
  const enabled = true
  return {
    whatsapp_button: features?.whatsapp_button ?? enabled,
    featured_badge: features?.featured_badge ?? enabled,
    reviews: features?.reviews ?? enabled,
    qr_code: features?.qr_code ?? enabled,
    video_embed: features?.video_embed ?? enabled,
    email_support: features?.email_support ?? enabled,
    inquiry_form: features?.inquiry_form ?? enabled,
    stock_counter: features?.stock_counter ?? enabled,
    related_products: features?.related_products ?? enabled,
    limited_offer_badge: features?.limited_offer_badge ?? enabled,
    affiliate_share_link: features?.affiliate_share_link ?? enabled,
    pdf_brochure: features?.pdf_brochure ?? enabled,
  }
}

export function StorefrontListingsTab({ products, accent, whatsappPhone, storeName, storePath, features }: Props) {
  const f = allEnabledFallback(features)
  const [selected, setSelected] = useState<AgentProduct | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [inquiryName, setInquiryName] = useState("")
  const [inquiryMessage, setInquiryMessage] = useState("")

  const trackView = async (productId: string) => {
    try {
      await fetch("/api/analytics/product-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      })
    } catch {
      // non-blocking
    }
  }

  const openProduct = (p: AgentProduct) => {
    setSelected(p)
    trackView(p.id)
  }

  const copyMomo = (num: string) => {
    navigator.clipboard.writeText(num)
    toast.success("MoMo number copied")
  }

  const requestBuy = (p: AgentProduct) => {
    const msg = `Hi, I'm interested in buying ${p.title} for GHS ${Number(p.price).toFixed(2)} from ${storeName}. Is it still available?`
    const url = toWhatsAppHref(whatsappPhone, msg)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
    else toast.error("WhatsApp not available for this store")
  }

  const productUrl = selected ? `${storePath}?product=${encodeURIComponent(selected.id)}` : storePath
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(productUrl)}`

  const copyAffiliateLink = async () => {
    const url = `${productUrl}${productUrl.includes("?") ? "&" : "?"}ref=share`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Share & Earn link copied")
    } catch {
      toast.error("Could not copy share link")
    }
  }

  const sendInquiry = () => {
    if (!selected) return
    const text = `Inquiry for ${selected.title}\nName: ${inquiryName || "Customer"}\nMessage: ${inquiryMessage || "I need more details."}`
    const url = toWhatsAppHref(whatsappPhone, text)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
    else toast.error("WhatsApp not available for this store")
  }

  const formatCountdown = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now()
    if (diff <= 0) return "Offer ended"
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${h}h ${m}m left`
  }

  if (!products.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No products listed yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card
            key={p.id}
            className="group cursor-pointer overflow-hidden rounded-2xl border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
            onClick={() => openProduct(p)}
          >
            {p.images?.[0] ? (
              <div className="relative aspect-square bg-slate-100">
                <Image
                  src={p.images[0]}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 text-sm text-slate-400">
                No image
              </div>
            )}
            <CardContent className="space-y-1.5 p-3.5">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{p.title}</h3>
              {f.featured_badge && (
                <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200 w-fit">Featured</Badge>
              )}
              {p.category && (
                <Badge variant="outline" className="text-[10px]">
                  {p.category}
                </Badge>
              )}
              {f.limited_offer_badge && (p as any).offer_expires_at && (
                <p className="text-[10px] text-rose-700 font-medium">{formatCountdown((p as any).offer_expires_at)}</p>
              )}
              {f.stock_counter && typeof (p as any).stock_count === "number" && (
                <p className="text-[10px] text-slate-500">Stock: {(p as any).stock_count}</p>
              )}
              {f.reviews && ((p as any).rating || (p as any).reviews_count) && (
                <p className="text-[10px] text-slate-500">
                  {(p as any).rating ? `${Number((p as any).rating).toFixed(1)}★` : "★"}{" "}
                  {(p as any).reviews_count ? `(${(p as any).reviews_count} reviews)` : ""}
                </p>
              )}
              <p className="text-lg font-bold tabular-nums" style={{ color: accent }}>
                ₵{Number(p.price).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl border-slate-200 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6 text-lg leading-snug">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pb-2">
              {selected.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selected.images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      className="relative aspect-square rounded-lg overflow-hidden border"
                      onClick={() => setLightbox({ src, alt: selected.title })}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="200px" />
                    </button>
                  ))}
                </div>
              )}
              {f.video_embed && (selected as any).video_url && (
                <div className="rounded-lg overflow-hidden border">
                  <iframe
                    src={String((selected as any).video_url)}
                    title={`${selected.title} video`}
                    className="w-full aspect-video"
                    allowFullScreen
                  />
                </div>
              )}
              {selected.description && (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
              )}
              <p className="text-xl font-bold" style={{ color: accent }}>
                ₵{Number(selected.price).toFixed(2)}
              </p>
              <div className="rounded-lg border bg-emerald-50 p-3 space-y-2 text-sm">
                <p className="font-medium text-emerald-900">Pay via MoMo (offline)</p>
                <p>
                  Send <strong>₵{Number(selected.price).toFixed(2)}</strong> to{" "}
                  <strong>{selected.momo_name}</strong>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold">{selected.momo_number}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => copyMomo(selected.momo_number || "")}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy Number
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {f.whatsapp_button && (
                  <Button
                    className="min-h-[48px] w-full border-0 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, #16a34a)`,
                    }}
                    onClick={() => requestBuy(selected)}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" /> Request to Buy on WhatsApp
                  </Button>
                )}
                {f.inquiry_form && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <input
                      className="w-full h-11 rounded-md border px-3 text-sm"
                      placeholder="Your name"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                    />
                    <input
                      className="w-full h-11 rounded-md border px-3 text-sm"
                      placeholder="Your inquiry"
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                    />
                    <Button type="button" variant="outline" className="w-full min-h-[44px]" onClick={sendInquiry}>
                      Send Inquiry
                    </Button>
                  </div>
                )}
                {f.email_support && (
                  <Button asChild variant="outline" className="w-full min-h-[44px]">
                    <a href={`mailto:support@dataflexghana.com?subject=${encodeURIComponent(`Support request for ${selected.title}`)}`}>
                      <Mail className="h-4 w-4 mr-2" /> Email Support
                    </a>
                  </Button>
                )}
                {f.qr_code && (
                  <Button type="button" variant="outline" className="w-full min-h-[44px]" onClick={() => setShowQr(true)}>
                    <QrCode className="h-4 w-4 mr-2" /> View QR Code
                  </Button>
                )}
                {f.affiliate_share_link && (
                  <Button type="button" variant="outline" className="w-full min-h-[44px]" onClick={copyAffiliateLink}>
                    <Link2 className="h-4 w-4 mr-2" /> Share &amp; Earn
                  </Button>
                )}
                {f.pdf_brochure && (selected as any).pdf_url && (
                  <Button asChild variant="outline" className="w-full min-h-[44px]">
                    <a href={String((selected as any).pdf_url)} target="_blank" rel="noopener noreferrer">
                      Download Brochure
                    </a>
                  </Button>
                )}
              </div>
              {f.related_products && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Related products</p>
                  <div className="flex flex-wrap gap-2">
                    {products
                      .filter((p) => p.id !== selected.id)
                      .slice(0, 3)
                      .map((related) => (
                        <button
                          key={related.id}
                          type="button"
                          className="text-xs rounded-full border px-2 py-1 hover:bg-slate-50"
                          onClick={() => openProduct(related)}
                        >
                          {related.title}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Product QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <Image src={qrImageUrl} alt="QR code" width={220} height={220} className="rounded-md border" />
          </div>
        </DialogContent>
      </Dialog>

      <StorefrontImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt ?? ""}
        onClose={() => setLightbox(null)}
      />
    </>
  )
}
