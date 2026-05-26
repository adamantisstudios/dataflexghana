"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, Bed, Bath, Square, Home, MessageCircle, Phone } from "lucide-react"
import type { PublicPropertyListing } from "@/lib/property-types"
import { PropertyListingShareButtons } from "@/components/shared/PropertyListingShareButtons"
import { normalizeGhanaPhoneNumber, toTelHref, toWhatsAppHref } from "@/lib/phone-utils"
import { ensureHttpsImageUrl } from "@/lib/image-url"

type Props = {
  agentId: string
  storeSegment: string
  storeSlug?: string | null
  accent: string
  properties: PublicPropertyListing[]
  agentWhatsApp?: string | null
  agentPhone?: string | null
}

function formatPrice(price: number, currency: string) {
  if (currency === "GHS") return `₵${price.toLocaleString()}`
  return `${currency} ${price.toLocaleString()}`
}

export function StorefrontRealEstateTab({
  agentId,
  storeSlug,
  accent,
  properties,
  agentWhatsApp,
  agentPhone,
}: Props) {
  const [selected, setSelected] = useState<PublicPropertyListing | null>(null)

  const sorted = useMemo(
    () => [...properties].sort((a, b) => a.title.localeCompare(b.title)),
    [properties],
  )

  const contactWhatsApp = selected?.contact_info?.whatsapp
    ? String(selected.contact_info.whatsapp)
    : agentWhatsApp
  const contactPhone = selected?.contact_info?.phone
    ? String(selected.contact_info.phone)
    : agentPhone

  if (sorted.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground text-sm">
        No property listings on this store right now.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 text-center">
        Browse listings promoted by this agent. Contact them directly for viewings and negotiations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map((property) => (
          <Card key={property.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div
              className="relative aspect-[4/3] bg-slate-100 cursor-pointer"
              onClick={() => setSelected(property)}
              onKeyDown={(e) => e.key === "Enter" && setSelected(property)}
              role="button"
              tabIndex={0}
            >
              {property.image_urls[0] ? (
                <Image
                  src={ensureHttpsImageUrl(property.image_urls[0])}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <Home className="h-12 w-12" />
                </div>
              )}
              {property.status === "Featured" && (
                <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0">Featured</Badge>
              )}
            </div>
            <CardContent className="p-3 space-y-2">
              <button
                type="button"
                className="text-left w-full font-semibold text-slate-900 line-clamp-2 hover:underline"
                onClick={() => setSelected(property)}
              >
                {property.title}
              </button>
              <p className="text-lg font-bold" style={{ color: accent }}>
                {formatPrice(property.price, property.currency)}
              </p>
              {property.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {property.location}
                </p>
              )}
              <PropertyListingShareButtons
                agentId={agentId}
                storeSlug={storeSlug}
                property={property}
              />
              <Button
                type="button"
                size="sm"
                className="w-full text-white"
                style={{ backgroundColor: accent }}
                onClick={() => setSelected(property)}
              >
                View details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              {selected.image_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selected.image_urls.slice(0, 4).map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                      <Image
                        src={ensureHttpsImageUrl(url)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-2xl font-bold" style={{ color: accent }}>
                {formatPrice(selected.price, selected.currency)}
              </p>
              <Badge variant="outline">{selected.category}</Badge>
              {selected.location && (
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selected.location}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {selected.details?.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {String(selected.details.bedrooms)} bed
                  </span>
                )}
                {selected.details?.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {String(selected.details.bathrooms)} bath
                  </span>
                )}
                {selected.details?.size != null && (
                  <span className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    {String(selected.details.size)}
                  </span>
                )}
              </div>
              {selected.description && (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
              )}
              <PropertyListingShareButtons agentId={agentId} storeSlug={storeSlug} property={selected} />
              <div className="flex flex-wrap gap-2 pt-2">
                {contactWhatsApp && (
                  <Button type="button" className="bg-green-600 hover:bg-green-700" asChild>
                    <a
                      href={toWhatsAppHref(
                        normalizeGhanaPhoneNumber(contactWhatsApp),
                        `Hi, I'm interested in: ${selected.title}`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {contactPhone && (
                  <Button type="button" variant="outline" asChild>
                    <a href={toTelHref(normalizeGhanaPhoneNumber(contactPhone))}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
