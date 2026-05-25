"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ArrowLeft, ExternalLink, Loader2, Users } from "lucide-react"
import type { PublicInfluencerProfile, SocialHandles } from "@/lib/influencer-types"

const BRAND = "#0E8F3D"

type ListItem = {
  profile_id: string
  agent_id: string
  full_name: string
  photo_url: string | null
  niche: string | null
  audience_size: number
  package_count: number
}

function socialUrl(platform: string, handle: string): string {
  const h = handle.replace(/^@/, "").trim()
  const p = platform.toLowerCase()
  if (p.includes("instagram")) return `https://instagram.com/${h}`
  if (p.includes("tiktok")) return `https://tiktok.com/@${h}`
  if (p.includes("twitter") || p === "x") return `https://x.com/${h}`
  if (p.includes("youtube")) return `https://youtube.com/@${h}`
  if (p.includes("facebook")) return `https://facebook.com/${h}`
  if (h.startsWith("http")) return h
  return `https://${h}`
}

function SocialLinks({ handles }: { handles: SocialHandles }) {
  const entries = Object.entries(handles || {}).filter(([, v]) => v?.trim())
  if (!entries.length) return <p className="text-sm text-muted-foreground">No social links listed.</p>
  return (
    <ul className="space-y-2">
      {entries.map(([platform, handle]) => (
        <li key={platform}>
          <a
            href={socialUrl(platform, handle)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0E8F3D] hover:underline inline-flex items-center gap-1"
          >
            {platform}: {handle}
            <ExternalLink className="h-3 w-3" />
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function PublicInfluencersPage() {
  const [list, setList] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<PublicInfluencerProfile | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/public/influencers", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList(data.influencers || [])
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const openProfile = async (profileId: string) => {
    setSheetOpen(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch(`/api/public/influencers?profileId=${encodeURIComponent(profileId)}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDetail(data.profile)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto w-full px-4 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0 w-full">
            <Link href="/" className="shrink-0">
              <Button variant="ghost" size="icon" aria-label="Home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1
                className="text-lg sm:text-xl font-bold text-slate-900 leading-tight"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Micro-Influencers
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">Discover verified creators on Dataflex Ghana</p>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row w-full sm:w-auto gap-2 shrink-0">
            <Link href="/influencers/register" className="w-full sm:w-auto">
              <Button className="w-full text-white text-sm h-10" style={{ backgroundColor: BRAND }}>
                Become an Influencer
              </Button>
            </Link>
            <Link href="/agent/register" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-emerald-200 text-[#0E8F3D] text-sm h-10">
                Become an agent
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section
        className="w-full px-4 py-6 sm:py-8 text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND}, #35B24A)` }}
      >
        <div className="max-w-6xl mx-auto text-center sm:text-left">
          <h2 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Partner with verified creators
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl mx-auto sm:mx-0">
            Browse influencer storefronts, audience reach, and active packages — optimized for mobile and desktop.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#0E8F3D]" />
          </div>
        ) : list.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              No approved influencer profiles yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {list.map((item) => (
              <Card
                key={item.profile_id}
                className="rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col gap-3 h-full">
                  <div className="flex flex-col items-center text-center gap-3 sm:flex-row sm:items-start sm:text-left">
                    {item.photo_url ? (
                      <Image
                        src={item.photo_url}
                        alt={item.full_name}
                        width={72}
                        height={72}
                        className="rounded-full object-cover h-16 w-16 sm:h-14 sm:w-14 border-2 border-emerald-100 shrink-0"
                      />
                    ) : (
                      <div
                        className="h-16 w-16 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-xl sm:text-lg font-bold text-white shrink-0"
                        style={{ backgroundColor: BRAND }}
                      >
                        {item.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 w-full">
                      <h2 className="font-semibold text-base sm:text-sm text-slate-900 break-words">
                        {item.full_name}
                      </h2>
                      <p className="text-sm sm:text-xs text-slate-500 mt-0.5">{item.niche || "General"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-[#0E8F3D] font-medium">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{item.audience_size.toLocaleString()} audience</span>
                  </div>
                  {item.package_count > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs sm:text-[10px] border-emerald-200 text-emerald-800 w-fit mx-auto sm:mx-0"
                    >
                      {item.package_count} active package{item.package_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Button
                    className="w-full text-white mt-auto h-11 text-sm"
                    style={{ backgroundColor: BRAND }}
                    onClick={() => openProfile(item.profile_id)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detail?.full_name || "Influencer profile"}</SheetTitle>
          </SheetHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
            </div>
          ) : detail ? (
            <div className="mt-4 space-y-5 pb-8 px-1">
              <div className="flex flex-col items-center text-center gap-3 sm:flex-row sm:items-start sm:text-left">
                {detail.photo_url ? (
                  <Image
                    src={detail.photo_url}
                    alt={detail.full_name}
                    width={72}
                    height={72}
                    className="rounded-full object-cover h-[72px] w-[72px] border-2 border-emerald-100 shrink-0"
                  />
                ) : (
                  <div
                    className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                    style={{ backgroundColor: BRAND }}
                  >
                    {detail.full_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{detail.niche || "General"}</p>
                  <p className="text-sm font-medium text-[#0E8F3D]">
                    {detail.audience_size.toLocaleString()} audience
                  </p>
                </div>
              </div>
              {detail.bio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{detail.bio}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Social handles</p>
                <SocialLinks handles={detail.social_handles} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Active packages</p>
                {detail.packages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No packages listed yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.packages.map((pkg) => (
                      <li key={pkg.id} className="rounded-lg border border-emerald-100 p-3 bg-emerald-50/50">
                        <p className="font-semibold text-sm">{pkg.title}</p>
                        {pkg.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-3">{pkg.description}</p>
                        )}
                        <p className="text-base font-bold text-[#0E8F3D] mt-2">₵{Number(pkg.price).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{pkg.delivery_days} day delivery</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8">Could not load profile.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
