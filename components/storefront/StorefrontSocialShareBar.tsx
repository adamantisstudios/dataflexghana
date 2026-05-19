"use client"

import { useCallback } from "react"
import { Facebook, Link2, MessageCircle, Share2, Twitter } from "lucide-react"
import { toast } from "sonner"
import { buildStorefrontUrl } from "@/lib/storefront-utils"

type Props = {
  agentId: string
  storeSlug?: string | null
  storeName: string
}

export function StorefrontSocialShareBar({ agentId, storeSlug, storeName }: Props) {
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : buildStorefrontUrl(agentId, storeSlug)

  const shareText = `Shop at ${storeName} on Referral Powerhouse`

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied")
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

  const btnClass =
    "h-11 w-11 rounded-full shadow-lg flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"

  return (
    <>
      {/* Desktop — left side */}
      <div className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-2">
        <button type="button" className={btnClass} onClick={nativeShare} aria-label="Share store">
          <Share2 className="h-5 w-5" />
        </button>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on WhatsApp">
          <MessageCircle className="h-5 w-5 text-green-600" />
        </a>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on Facebook">
          <Facebook className="h-5 w-5 text-blue-600" />
        </a>
        <a href={twUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on Twitter">
          <Twitter className="h-5 w-5 text-sky-500" />
        </a>
        <button type="button" className={btnClass} onClick={copyLink} aria-label="Copy link">
          <Link2 className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile — bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur px-3 py-2 flex justify-around gap-1 safe-area-pb">
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
    </>
  )
}
