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
import { FacePhotoUpload } from "@/components/ui/FacePhotoUpload"
import { MIN_INFLUENCER_AUDIENCE } from "@/lib/influencer-types"
import { ArrowLeft, Loader2, Plus, Trash2, Sparkles, Wallet, Shield } from "lucide-react"
import { toast } from "sonner"

const BRAND = "#0E8F3D"
const BRAND_LIGHT = "#35B24A"
const WHATSAPP_REDIRECT_URL =
  "https://wa.me/233246827049?text=Hello%2C%20I%20have%20completed%20my%20micro%E2%80%91influencer%20account%20registration%20on%20Dataflex%20Ghana.%20Please%20review%20and%20approve%20my%20account.%20Thank%20you."

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
    password: "",
    confirm_password: "",
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
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match")
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
      try {
        window.location.assign(WHATSAPP_REDIRECT_URL)
      } catch {
        router.push("/influencers/register/thank-you")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/90 via-white to-slate-50">
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/influencers">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-semibold text-slate-900">Micro-Influencer Registration</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <section className="rounded-2xl overflow-hidden border border-emerald-100 shadow-md bg-white">
            <div className="relative w-full h-48 sm:h-64 lg:h-full min-h-[260px]">
              <Image
                src="/influencer_image.png"
                alt="Influencer campaign visual"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
              <div className="absolute left-4 right-4 bottom-4 text-white">
                <p className="text-xs uppercase tracking-widest text-emerald-200">Dataflex Ghana</p>
                <h1 className="text-xl sm:text-2xl font-bold mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Become a micro-influencer and earn with your audience.
                </h1>
                <div className="flex flex-wrap gap-3 pt-3 text-xs sm:text-sm text-white/95">
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" /> Secure payouts
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Shield className="h-4 w-4" /> Trusted platform
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Premium profile
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Card className="rounded-2xl border-emerald-100 shadow-md bg-white">
            <CardContent className="p-5 sm:p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">Create your influencer account</h2>
              <p className="text-sm text-slate-600 mt-1">
                Submit your profile for review. Once approved, you can manage packages in Referral Hub.
              </p>
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    required
                    type="password"
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    required
                    type="password"
                    minLength={6}
                    value={form.confirm_password}
                    onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                    placeholder="Re-enter password"
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
                <div className="flex flex-wrap items-start gap-3">
                  <FacePhotoUpload onFile={uploadPhoto} uploading={uploading} disabled={submitting} />
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
                className="w-full text-white h-11 font-semibold rounded-xl shadow-sm hover:shadow-md transition-shadow"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
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
        </div>
      </main>
    </div>
  )
}
