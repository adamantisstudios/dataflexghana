"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getStorefrontOrigin } from "@/lib/storefront-utils"

const BRAND = "#0E8F3D"
const REFERRAL_HUB_INFLUENCERS =
  "/agent/referralhub?hubTab=marketplace&marketplaceTab=influencers"
const PUBLIC_INFLUENCERS = "/influencers"

function buildInfluencersStoreUrl(slug: string): string {
  const origin = typeof window !== "undefined" ? getStorefrontOrigin() : ""
  const base = origin || ""
  return `${base}/store/${encodeURIComponent(slug)}?tab=influencers`
}

export function InfluencerTermsNav() {
  const [backHref, setBackHref] = useState(PUBLIC_INFLUENCERS)

  useEffect(() => {
    let cancelled = false

    async function resolveBackLink() {
      try {
        const raw = localStorage.getItem("agent")
        if (!raw) {
          if (!cancelled) setBackHref(PUBLIC_INFLUENCERS)
          return
        }
        const agent = JSON.parse(raw) as { id?: string; store_slug?: string }
        if (agent.store_slug?.trim()) {
          if (!cancelled) setBackHref(buildInfluencersStoreUrl(agent.store_slug.trim()))
          return
        }
        if (!agent.id) return

        const token = localStorage.getItem("agentToken")
        const headers: Record<string, string> = {}
        if (token) headers.Authorization = `Bearer ${token}`

        const res = await fetch("/api/agent/store-profile", { headers, cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const slug = data?.profile?.store_slug?.trim()
        if (slug && !cancelled) {
          setBackHref(buildInfluencersStoreUrl(slug))
          return
        }
        if (!cancelled) setBackHref(REFERRAL_HUB_INFLUENCERS)
      } catch {
        if (!cancelled) setBackHref(PUBLIC_INFLUENCERS)
      }
    }

    resolveBackLink()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={backHref}>
            <Button variant="ghost" size="icon" aria-label="Back to Micro-Influencers">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Influencer Terms</h1>
        </div>
      </header>

    </>
  )
}

export function InfluencerTermsFooterLinks() {
  const [backHref, setBackHref] = useState(PUBLIC_INFLUENCERS)

  useEffect(() => {
    let cancelled = false
    async function resolveBackLink() {
      try {
        const raw = localStorage.getItem("agent")
        if (!raw) {
          if (!cancelled) setBackHref(PUBLIC_INFLUENCERS)
          return
        }
        const agent = JSON.parse(raw) as { id?: string; store_slug?: string }
        if (agent.store_slug?.trim()) {
          if (!cancelled) setBackHref(buildInfluencersStoreUrl(agent.store_slug.trim()))
          return
        }
        if (!agent.id) return
        const token = localStorage.getItem("agentToken")
        const headers: Record<string, string> = {}
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch("/api/agent/store-profile", { headers, cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const slug = data?.profile?.store_slug?.trim()
        if (slug && !cancelled) {
          setBackHref(buildInfluencersStoreUrl(slug))
          return
        }
        if (!cancelled) setBackHref(REFERRAL_HUB_INFLUENCERS)
      } catch {
        if (!cancelled) setBackHref(PUBLIC_INFLUENCERS)
      }
    }
    resolveBackLink()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={backHref}>
        <Button style={{ backgroundColor: BRAND }} className="hover:opacity-90 text-white">
          Back to Micro-Influencers
        </Button>
      </Link>
      <Link href="/influencers/register">
        <Button variant="outline" className="border-emerald-300 text-[#0E8F3D]">
          Apply as an influencer
        </Button>
      </Link>
      <Link href="/agent/login">
        <Button variant="outline">Agent Login</Button>
      </Link>
    </div>
  )
}
