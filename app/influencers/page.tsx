"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  Search,
  Users,
  Instagram,
  Music2,
  Twitter,
} from "lucide-react"
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
  bio?: string | null
}

function formatAudience(n: number): string {
  if (!Number.isFinite(n)) return "0 followers"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M followers`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}K followers`
  return `${n.toLocaleString()} followers`
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}...`
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

function socialPlatformIcon(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes("instagram")) return Instagram
  if (p.includes("tiktok")) return Music2
  if (p.includes("twitter") || p === "x") return Twitter
  return ExternalLink
}

function shortHandle(handle: string, max = 14): string {
  const h = handle.replace(/^@/, "").trim()
  if (h.length <= max) return h.startsWith("@") ? h : `@${h}`
  return `@${h.slice(0, max - 1)}…`
}

function SocialLinks({ handles }: { handles: SocialHandles }) {
  const entries = Object.entries(handles || {}).filter(([, v]) => v?.trim())
  if (!entries.length) return <p className="text-sm text-muted-foreground">No social links listed.</p>
  return (
    <ul className="flex flex-wrap gap-2 max-w-full">
      {entries.map(([platform, handle]) => {
        const Icon = socialPlatformIcon(platform)
        return (
          <li key={platform} className="min-w-0 max-w-full">
            <a
              href={socialUrl(platform, handle)}
              target="_blank"
              rel="noopener noreferrer"
              title={`${platform}: ${handle}`}
              className="inline-flex h-9 max-w-[140px] sm:max-w-[200px] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-[#0E8F3D] hover:border-emerald-400 hover:bg-emerald-50/50"
            >
              <Icon className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
              <span className="hidden sm:inline truncate text-xs font-medium">{shortHandle(handle)}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export default function PublicInfluencersPage() {
  const [list, setList] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<PublicInfluencerProfile | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [nicheFilter, setNicheFilter] = useState("all")
  const [showFullBio, setShowFullBio] = useState(false)
  const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({})

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
    setShowFullBio(false)
    setExpandedPackageIds({})
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

  const uniqueNiches = useMemo(() => {
    return Array.from(new Set(list.map((i) => i.niche || "General"))).sort()
  }, [list])

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return list.filter((item) => {
      const itemNiche = item.niche || "General"
      const matchesNiche = nicheFilter === "all" || itemNiche === nicheFilter
      const matchesSearch = !q || item.full_name.toLowerCase().includes(q)
      return matchesNiche && matchesSearch
    })
  }, [list, searchTerm, nicheFilter])

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-slate-50">
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

      <section className="w-full border-b border-emerald-100/70 bg-white">
        <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[280px] sm:max-h-[320px]">
          <Image
            src="/influencer_image.png"
            alt="Micro-influencer marketplace"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 text-center sm:text-left space-y-2">
          <h2
            className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Find the Perfect Influencer for Your Brand
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 max-w-3xl mx-auto sm:mx-0">
            Browse vetted micro-influencers ready to promote your business, compare audience fit, and discover package
            options in minutes.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
          A 10% service fee applies to each transaction (10% buyer fee and 10% influencer fee).
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-3 sm:p-4 shadow-md">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search influencer by name..."
                className="w-full h-11 rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-0 focus:border-emerald-400"
              />
            </div>
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 md:min-w-[190px]"
            >
              <option value="all">All niches</option>
              {uniqueNiches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#0E8F3D]" />
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              No influencers match your search yet. Try a different name or niche.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredList.map((item) => (
              <Card
                key={item.profile_id}
                className="rounded-xl border border-slate-200/90 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md transition-all h-full"
              >
                <CardContent className="p-3.5 flex flex-col gap-2.5 h-full">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.photo_url ? (
                      <Image
                        src={item.photo_url}
                        alt={item.full_name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover h-12 w-12 border border-emerald-100 shrink-0"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-base font-semibold text-white shrink-0"
                        style={{ backgroundColor: BRAND }}
                      >
                        {item.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{item.full_name}</h2>
                      <Badge
                        variant="secondary"
                        className="mt-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100"
                      >
                        {item.niche || "General"}
                      </Badge>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{formatAudience(item.audience_size)}</span>
                  </p>
                  <Button
                    className="w-full text-white mt-auto h-9 text-xs sm:text-sm"
                    style={{ backgroundColor: BRAND }}
                    onClick={() => openProfile(item.profile_id)}
                  >
                    View Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
          <SheetHeader className="border-b pb-3">
            <SheetTitle className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-800"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Influencers
              </button>
            </SheetTitle>
          </SheetHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
            </div>
          ) : detail ? (
            <div className="mt-4 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <aside className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-emerald-100 bg-white shadow-sm">
                    <div className="relative aspect-[4/5] bg-slate-100">
                      {detail.photo_url ? (
                        <Image
                          src={detail.photo_url}
                          alt={detail.full_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
                          style={{ backgroundColor: BRAND }}
                        >
                          {detail.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">{detail.full_name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {detail.niche || "General"}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-700">
                          {formatAudience(detail.audience_size)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        {detail.social_handles.instagram && (
                          <a
                            href={socialUrl("instagram", detail.social_handles.instagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:border-emerald-400"
                          >
                            <Instagram className="h-4 w-4 text-slate-600" />
                          </a>
                        )}
                        {detail.social_handles.tiktok && (
                          <a
                            href={socialUrl("tiktok", detail.social_handles.tiktok)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:border-emerald-400"
                          >
                            <Music2 className="h-4 w-4 text-slate-600" />
                          </a>
                        )}
                        {(detail.social_handles["twitter/x"] || detail.social_handles.twitter || detail.social_handles.x) && (
                          <a
                            href={socialUrl(
                              "twitter",
                              detail.social_handles["twitter/x"] ||
                                detail.social_handles.twitter ||
                                detail.social_handles.x ||
                                "",
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:border-emerald-400"
                          >
                            <Twitter className="h-4 w-4 text-slate-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">All social handles</p>
                    <SocialLinks handles={detail.social_handles} />
                  </div>
                </aside>

                <section className="space-y-5">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">About influencer</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {detail.bio
                        ? showFullBio
                          ? detail.bio
                          : truncate(detail.bio, 260)
                        : "No bio has been added yet."}
                    </p>
                    {detail.bio && detail.bio.length > 260 && (
                      <button
                        type="button"
                        onClick={() => setShowFullBio((s) => !s)}
                        className="mt-2 text-sm text-emerald-700 hover:underline"
                      >
                        {showFullBio ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-slate-900">Packages</h4>
                    {detail.packages.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
                        No packages listed yet.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {detail.packages.map((pkg) => {
                          const expanded = Boolean(expandedPackageIds[pkg.id])
                          const description = pkg.description || "No package description provided."
                          return (
                            <li key={pkg.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-900">{pkg.title}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {expanded ? description : truncate(description, 120)}
                                  </p>
                                  {description.length > 120 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedPackageIds((prev) => ({ ...prev, [pkg.id]: !expanded }))
                                      }
                                      className="text-xs text-emerald-700 hover:underline mt-1"
                                    >
                                      {expanded ? "Read less" : "Read more"}
                                    </button>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600">GH₵ {Number(pkg.price).toFixed(2)}</p>
                                  <p className="text-[11px] text-slate-500">{pkg.delivery_days} day delivery</p>
                                </div>
                              </div>
                              <div className="pt-3 mt-3 border-t border-slate-100">
                                <Button asChild className="w-full sm:w-auto text-white" style={{ backgroundColor: BRAND }}>
                                  <Link href="/agent/register">Book This Package</Link>
                                </Button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </section>
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
