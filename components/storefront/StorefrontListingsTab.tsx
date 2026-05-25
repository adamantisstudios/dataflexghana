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
import { Copy, MessageCircle } from "lucide-react"
import { toast } from "sonner"

type Props = {
  products: AgentProduct[]
  accent: string
  whatsappPhone: string
  storeName: string
}

export function StorefrontListingsTab({ products, accent, whatsappPhone, storeName }: Props) {
  const [selected, setSelected] = useState<AgentProduct | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card
            key={p.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openProduct(p)}
          >
            {p.images?.[0] ? (
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                No image
              </div>
            )}
            <CardContent className="p-3 space-y-1">
              <h3 className="font-semibold text-sm line-clamp-2">{p.title}</h3>
              {p.category && (
                <Badge variant="outline" className="text-[10px]">
                  {p.category}
                </Badge>
              )}
              <p className="font-bold" style={{ color: accent }}>
                ₵{Number(p.price).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
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
              <Button
                className="w-full text-white"
                style={{ backgroundColor: accent }}
                onClick={() => requestBuy(selected)}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Request to Buy on WhatsApp
              </Button>
            </div>
          )}
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
