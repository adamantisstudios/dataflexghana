"use client"

import { useCallback } from "react"
import { Facebook, Link2, MessageCircle, Share2, Twitter } from "lucide-react"
import { toast } from "sonner"
import { buildStorefrontUrl } from "@/lib/storefront-utils"
import { Button } from "@/components/ui/button"

type Layout = "bar" | "inline" | "floating-desktop" | "floating-mobile"

type Props = {
  agentId: string
  storeSlug?: string | null
  storeName: string
  layout?: Layout
  className?: string
}

export function StoreSocialShareButtons({
  agentId,
  storeSlug,
  storeName,
  layout = "inline",
  className = "",
}: Props) {
  const shareUrl = buildStorefrontUrl(agentId, storeSlug)

  const shareText = `Shop at ${storeName} on Referral Powerhouse`

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Store link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }, [shareUrl])

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, text: shareText, url: shareUrl })
        return
      } catch {
        /* cancelled */
      }
    }
    await copyLink()
  }, [copyLink, shareText, shareUrl, storeName])

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const iconBtnClass =
    "h-10 w-10 rounded-full shadow-md flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"

  if (layout === "floating-desktop") {
    return (
      <div className={`hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-2 ${className}`}>
        <button type="button" className={iconBtnClass} onClick={nativeShare} aria-label="Share store">
          <Share2 className="h-5 w-5" />
        </button>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={iconBtnClass} aria-label="Share on WhatsApp">
          <MessageCircle className="h-5 w-5 text-green-600" />
        </a>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={iconBtnClass} aria-label="Share on Facebook">
          <Facebook className="h-5 w-5 text-blue-600" />
        </a>
        <a href={twUrl} target="_blank" rel="noopener noreferrer" className={iconBtnClass} aria-label="Share on Twitter">
          <Twitter className="h-5 w-5 text-sky-500" />
        </a>
        <button type="button" className={iconBtnClass} onClick={copyLink} aria-label="Copy link">
          <Link2 className="h-5 w-5" />
        </button>
      </div>
    )
  }

  if (layout === "floating-mobile") {
    return (
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur px-2 py-2 flex justify-around gap-1 safe-area-pb ${className}`}
      >
        <button type="button" className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 px-2" onClick={nativeShare}>
          <Share2 className="h-5 w-5" />
          Share
        </button>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 px-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          WhatsApp
        </a>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 px-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Facebook
        </a>
        <a href={twUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 px-2">
          <Twitter className="h-5 w-5 text-sky-500" />
          Twitter
        </a>
        <button type="button" className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 px-2" onClick={copyLink}>
          <Link2 className="h-5 w-5" />
          Copy
        </button>
      </div>
    )
  }

  if (layout === "bar") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <Button type="button" variant="outline" size="sm" onClick={nativeShare} className="gap-1.5">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 text-green-600 mr-1" />
            WhatsApp
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={fbUrl} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-4 w-4 text-blue-600 mr-1" />
            Facebook
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={twUrl} target="_blank" rel="noopener noreferrer">
            <Twitter className="h-4 w-4 text-sky-500 mr-1" />
            Twitter
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
          <Link2 className="h-4 w-4" />
          Copy link
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button type="button" variant="secondary" size="sm" onClick={nativeShare}>
        <Share2 className="h-4 w-4 mr-1" />
        Share store
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={copyLink}>
        Copy link
      </Button>
    </div>
  )
}
