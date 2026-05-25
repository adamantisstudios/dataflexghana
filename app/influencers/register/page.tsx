"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { MobilePhotoUpload } from "@/components/ui/mobile-photo-upload"
import { MIN_INFLUENCER_AUDIENCE } from "@/lib/influencer-types"
import { ArrowLeft, Loader2, Plus, Trash2, Sparkles, Wallet, Shield } from "lucide-react"
import { toast } from "sonner"

const BRAND = "#0E8F3D"
const BRAND_LIGHT = "#35B24A"

const NICHE_OPTIONS = [
  "Lifestyle",
  "Tech",
  "Food",
  "Fashion",
  "Finance",
  "Beauty",
  "Travel",
  "Fitness",
  "Gaming",
  "Education",
  "Other",
]

const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "Twitter/X", "LinkedIn", "Other"]

export default function InfluencerRegisterPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [photoUrl, setPhotoUrl] = useState("")
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    bio: "",
    niche: "",
    audience_size: "",
  })
  const [socialRows, setSocialRows] = useState<{ platform: string; url: string }[]>([
    { platform: "Instagram", url: "" },
  ])

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/influencers/upload-photo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      setPhotoUrl(data.url)
      toast.success("Photo uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      toast.error("Please accept the Influencer Terms and Conditions")
      return
    }
    if (!photoUrl) {
      toast.error("Please upload a profile photo")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/influencers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          photo_url: photoUrl,
          terms_accepted: termsAccepted,
          social_handles: socialRows.filter((r) => r.platform.trim() && r.url.trim()),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")
      router.push("/influencers/register/thank-you")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/90 to-white">
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/influencers">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-semibold text-slate-900">Influencer Application</span>
        </div>
      </header>

      <section
        className="text-white px-4 py-10"
        style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Become a Dataflex Influencer
          </h1>
          <p className="text-white/90 text-sm sm:text-base max-w-lg mx-auto">
            Monetize your audience with branded packages, secure escrow payments, and a dedicated storefront — we
            handle payments and disputes so you can focus on creating.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-white/95">
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-4 w-4" /> Get paid securely
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Platform protection
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Your own storefront
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
        <Card className="rounded-2xl border-emerald-100 shadow-md">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    required
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                    placeholder="e.g. 0241234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell brands about your content and audience…"
                />
              </div>

              <div className="space-y-2">
                <Label>Social Handles *</Label>
                <p className="text-xs text-muted-foreground">Add platform name and full profile URL for each account.</p>
                {socialRows.map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={row.platform}
                      onValueChange={(v) =>
                        setSocialRows((rows) => rows.map((r, i) => (i === idx ? { ...r, platform: v } : r)))
                      }
                    >
                      <SelectTrigger className="sm:w-36">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      required={idx === 0}
                      placeholder="https://instagram.com/yourhandle"
                      value={row.url}
                      onChange={(e) =>
                        setSocialRows((rows) => rows.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))
                      }
                    />
                    {socialRows.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSocialRows((rows) => rows.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSocialRows((rows) => [...rows, { platform: "TikTok", url: "" }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add platform
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Audience Size (total) *</Label>
                  <Input
                    id="audience"
                    required
                    type="number"
                    min={MIN_INFLUENCER_AUDIENCE}
                    value={form.audience_size}
                    onChange={(e) => setForm((f) => ({ ...f, audience_size: e.target.value }))}
                    placeholder={`Min ${MIN_INFLUENCER_AUDIENCE.toLocaleString()}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niche *</Label>
                  <Select value={form.niche} onValueChange={(v) => setForm((f) => ({ ...f, niche: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select niche" />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profile Photo *</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <MobilePhotoUpload onFile={uploadPhoto} uploading={uploading} disabled={submitting} />
                  {photoUrl && (
                    <Image
                      src={photoUrl}
                      alt="Profile preview"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover border-2 border-emerald-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(c) => setTermsAccepted(c === true)}
                />
                <label htmlFor="terms" className="text-sm text-slate-700 leading-snug cursor-pointer">
                  I agree to the{" "}
                  <Link href="/influencer-terms" className="font-medium underline" style={{ color: BRAND }}>
                    Influencer Terms and Conditions
                  </Link>
                </label>
              </div>

              <p className="text-xs text-muted-foreground rounded-lg bg-slate-50 p-3 border">
                Your application will be reviewed. If approved, you&apos;ll receive a dedicated storefront to list
                your services. We typically respond within 48 hours.
              </p>

              <Button
                type="submit"
                disabled={submitting || uploading}
                className="w-full text-white h-11"
                style={{ backgroundColor: BRAND }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
