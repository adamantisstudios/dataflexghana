"use client"

import { useCallback } from "react"
import { Facebook, Link2, MessageCircle, Twitter } from "lucide-react"
import { toast } from "sonner"
import { buildStorefrontUrl } from "@/lib/storefront-utils"
import { Button } from "@/components/ui/button"
import type { PublicPropertyListing } from "@/lib/property-types"

type Props = {
  agentId: string
  storeSlug?: string | null
  property: PublicPropertyListing
  className?: string
}

function formatPrice(price: number, currency: string) {
  if (currency === "GHS") return `₵${price.toLocaleString()}`
  return `${currency} ${price.toLocaleString()}`
}

export function PropertyListingShareButtons({ agentId, storeSlug, property, className = "" }: Props) {
  const baseUrl = buildStorefrontUrl(agentId, storeSlug)
  const shareUrl = `${baseUrl}?property=${encodeURIComponent(property.id)}`
  const shareText = `${property.title} — ${formatPrice(property.price, property.currency)}${property.location ? ` · ${property.location}` : ""}`

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Listing link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }, [shareUrl])

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
          <MessageCircle className="h-3.5 w-3.5 text-green-600 mr-1" />
          WhatsApp
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
          <Facebook className="h-3.5 w-3.5 text-blue-600 mr-1" />
          Facebook
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild>
        <a href={twUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">
          <Twitter className="h-3.5 w-3.5 text-sky-500 mr-1" />
          Twitter
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={copyLink}>
        <Link2 className="h-3.5 w-3.5 mr-1" />
        Copy link
      </Button>
    </div>
  )
}
