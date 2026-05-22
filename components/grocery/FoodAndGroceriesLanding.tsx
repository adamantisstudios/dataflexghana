"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WhatsAppFloatDialog } from "@/components/grocery/WhatsAppFloatDialog"
import { FadeInSection } from "@/components/grocery/FadeInSection"
import { GroceryHeroSlider } from "@/components/grocery/GroceryHeroSlider"
import {
  Loader2,
  Upload,
  X,
  ShoppingBasket,
  ClipboardList,
  MessageCircle,
  CreditCard,
  Truck,
  Shield,
  Sparkles,
  Leaf,
  Clock,
  HeartHandshake,
  Star,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import {
  GROCERY_COMMITMENT_AMOUNT_GHS,
  GROCERY_PAYMENT_STORAGE_KEY,
} from "@/lib/grocery-paystack"

const MAX_FILES = 5

const STEPS = [
  {
    icon: ClipboardList,
    title: "Submit your list & pay commitment fee",
    text: "Pay GHS 20 to secure your slot, then send your full shopping list and delivery details.",
  },
  {
    icon: MessageCircle,
    title: "We review & contact you",
    text: "Our team confirms availability, pricing, and any substitutions via WhatsApp or phone.",
  },
  {
    icon: CreditCard,
    title: "Confirm & pay balance",
    text: "Approve the final bill and complete payment for groceries and delivery as agreed.",
  },
  {
    icon: Truck,
    title: "Delivery arranged",
    text: "Fresh items are coordinated and delivered at a time that works for you.",
  },
]

const WHY_US = [
  { icon: Sparkles, title: "Affordable pricing", text: "Transparent quotes with no hidden platform markups." },
  { icon: Clock, title: "Fast response", text: "We aim to contact you quickly after your list is received." },
  { icon: HeartHandshake, title: "Trusted assistants", text: "Experienced shoppers who know local markets." },
  { icon: Leaf, title: "Fresh & hygienic", text: "Quality produce and groceries handled with care." },
  { icon: Shield, title: "Safe coordination", text: "Clear communication from list to delivery." },
  { icon: ShoppingBasket, title: "No account needed", text: "Submit once — no lengthy sign-up process." },
]

const TESTIMONIALS = [
  {
    name: "Ama Serwaa",
    location: "East Legon, Accra",
    text: "Dataflex saved me hours of market stress! They got everything on my list and called before buying extras.",
    rating: 5,
  },
  {
    name: "Kwesi Mensah",
    location: "Tema Community 25",
    text: "Fresh eggs and yams delivered to my door. The commitment fee was worth it — very professional service.",
    rating: 5,
  },
  {
    name: "Abena Osei",
    location: "Kumasi",
    text: "I sent a long list with photos and they followed it perfectly. Great for busy weeks.",
    rating: 5,
  },
  {
    name: "Michael Adjei",
    location: "Osu, Accra",
    text: "Clear pricing on WhatsApp before they shopped. Honest team — will use again.",
    rating: 5,
  },
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function FoodAndGroceriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [paymentVerified, setPaymentVerified] = useState(false)
  const [paystackReference, setPaystackReference] = useState<string | null>(null)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [paying, setPaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const [payer, setPayer] = useState({ full_name: "", email: "", phone: "" })
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    landmark: "",
    delivery_time: "",
    shopping_list: "",
    notes: "",
  })

  const verifyReference = useCallback(async (reference: string) => {
    setVerifyingPayment(true)
    try {
      const res = await fetch(`/api/grocery/verify-payment?reference=${encodeURIComponent(reference)}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.verified) {
        throw new Error(data.error || "Payment could not be verified")
      }
      if (data.alreadyUsed) {
        throw new Error("This payment has already been used for a request")
      }
      setPaystackReference(reference)
      setPaymentVerified(true)
      sessionStorage.setItem(GROCERY_PAYMENT_STORAGE_KEY, reference)
      toast.success("Payment confirmed! Now fill your shopping list below.")
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed")
      return false
    } finally {
      setVerifyingPayment(false)
    }
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem(GROCERY_PAYMENT_STORAGE_KEY)
    if (stored) {
      void verifyReference(stored)
      return
    }

    const payment = searchParams.get("payment")
    const reference = searchParams.get("reference")
    if (payment === "success" && reference) {
      void verifyReference(reference).then((ok) => {
        if (ok) {
          window.history.replaceState({}, "", "/foodandGroceries#request-form")
        }
      })
    } else if (payment === "failed") {
      const msg = searchParams.get("message")
      toast.error(msg ? decodeURIComponent(msg) : "Payment was not completed")
      window.history.replaceState({}, "", "/foodandGroceries")
    }
  }, [searchParams, verifyReference])

  useEffect(() => {
    if (paymentVerified && payer.full_name) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || payer.full_name,
        phone: f.phone || payer.phone,
        email: f.email || payer.email,
      }))
    }
  }, [paymentVerified, payer])

  const handlePayCommitment = async () => {
    if (!payer.full_name.trim() || !payer.email.trim() || !payer.phone.trim()) {
      toast.error("Enter your name, email, and phone before paying")
      return
    }
    setPaying(true)
    try {
      const res = await fetch("/api/grocery/pay-commitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payer),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not start payment")
      }
      window.location.href = data.authorizationUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed to start")
      setPaying(false)
    }
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return []
    setUploading(true)
    const urls: string[] = []
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/grocery/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || `Upload failed: ${file.name}`)
        urls.push(data.url)
      }
      return urls
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentVerified || !paystackReference) {
      toast.error("Please pay the commitment fee first")
      scrollToId("request-form")
      return
    }
    if (!form.full_name.trim() || !form.phone.trim() || !form.shopping_list.trim()) {
      toast.error("Please fill in your name, phone, and shopping list")
      return
    }

    setSubmitting(true)
    try {
      const attachments = await uploadFiles()
      const res = await fetch("/api/grocery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attachments, paystack_reference: paystackReference }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Submission failed")

      sessionStorage.removeItem(GROCERY_PAYMENT_STORAGE_KEY)
      router.push("/thank-you")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
      setSubmitting(false)
    }
  }

  const busy = submitting || uploading
  const formLocked = !paymentVerified || busy

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0A5C2A]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-[#0E8F3D] ring-2 ring-white/30 flex items-center justify-center text-white">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <span className="font-bold text-white hidden sm:inline" style={{ fontFamily: "Poppins, sans-serif" }}>
              DataFlex Ghana
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/90">
            <button type="button" onClick={() => scrollToId("how-it-works")} className="hover:text-white">
              How It Works
            </button>
            <button type="button" onClick={() => scrollToId("why-us")} className="hover:text-white">
              Why Us
            </button>
            <button type="button" onClick={() => scrollToId("testimonials")} className="hover:text-white">
              Reviews
            </button>
            <button
              type="button"
              onClick={() => scrollToId("request-form")}
              className="text-white font-semibold hover:underline"
            >
              Request Shopping
            </button>
          </nav>
          <Button
            size="sm"
            className="bg-[#0E8F3D] hover:bg-white hover:text-[#0A5C2A] text-white rounded-full md:hidden border-0"
            onClick={() => scrollToId("request-form")}
          >
            Order
          </Button>
        </div>
      </header>

      <GroceryHeroSlider
        onRequestClick={() => scrollToId("request-form")}
        onHowItWorksClick={() => scrollToId("how-it-works")}
      />

      <section id="how-it-works" className="py-16 sm:py-20 bg-[#F9FBF9]">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0A5C2A]" style={{ fontFamily: "Poppins, sans-serif" }}>
              How It Works
            </h2>
            <p className="text-center text-[#1F2937]/80 mt-3 max-w-2xl mx-auto">
              Four simple steps from your shopping list to your doorstep.
            </p>
          </FadeInSection>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <FadeInSection key={step.title} className={i > 0 ? `delay-[${i * 100}ms]` : ""}>
                <div className="h-full rounded-2xl border-2 border-[#0E8F3D]/25 bg-white p-6 shadow-md hover:shadow-lg hover:border-[#0E8F3D]/50 transition-all">
                  <div className="h-12 w-12 rounded-xl bg-[#0E8F3D] text-white flex items-center justify-center mb-4 shadow-sm">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-[#0E8F3D] mb-1">Step {i + 1}</p>
                  <h3 className="font-semibold text-[#0A5C2A] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#1F2937]/80 leading-relaxed">{step.text}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="py-16 sm:py-20 bg-[#0E8F3D]">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection>
            <h2
              className="text-2xl sm:text-3xl font-bold text-center text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Why Choose DataFlex Grocery
            </h2>
            <p className="text-center text-white/85 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
              Premium concierge shopping — fresh, fast, and unmistakably Ghanaian.
            </p>
          </FadeInSection>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_US.map((item) => (
              <FadeInSection key={item.title}>
                <div className="bg-[#F9FBF9] rounded-2xl p-6 shadow-lg border-2 border-white/40 h-full">
                  <item.icon className="h-8 w-8 text-[#0E8F3D] mb-3" />
                  <h3 className="font-semibold text-lg mb-2 text-[#0A5C2A]">{item.title}</h3>
                  <p className="text-sm text-[#1F2937]/80">{item.text}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-16 sm:py-20 bg-[#F9FBF9]">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection>
            <h2
              className="text-2xl sm:text-3xl font-bold text-center text-[#0A5C2A]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              What Customers Say
            </h2>
          </FadeInSection>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <FadeInSection key={t.name}>
                <div className="rounded-2xl border-2 border-[#0E8F3D]/20 bg-white p-6 shadow-md h-full">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <p className="mt-4 font-semibold text-[#0E8F3D]">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.location}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section id="request-form" className="py-16 sm:py-20 bg-[#0A5C2A] scroll-mt-16">
        <div className="max-w-2xl mx-auto px-4">
          <FadeInSection>
            <h2
              className="text-2xl sm:text-3xl font-bold text-center text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Submit Your Grocery Request
            </h2>
            <p className="text-center text-white/85 mt-2 text-sm">
              Pay the commitment fee first, then complete your shopping list.{" "}
              <Link href="/grocery-terms" className="text-white underline font-medium hover:text-white/90">
                Grocery terms
              </Link>
            </p>
          </FadeInSection>

          <div className="mt-8 rounded-2xl bg-[#F9FBF9] border-2 border-[#0E8F3D]/40 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-[#0E8F3D]/5 to-[#35B24A]/10 border border-[#0E8F3D]/20 p-5">
              <div className="flex items-start gap-3">
                <CreditCard className="h-8 w-8 text-[#0E8F3D] shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#0E8F3D]">Commitment Fee: GHS {GROCERY_COMMITMENT_AMOUNT_GHS}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Secures your request slot. Non-refundable once shopping begins — see{" "}
                    <Link href="/grocery-terms" className="underline text-[#0E8F3D]">
                      terms
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {paymentVerified ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>
                      Payment confirmed! Fill your shopping list below.
                      {paystackReference && (
                        <span className="block text-xs text-green-700 mt-1 font-mono">Ref: {paystackReference}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                    This phone number is linked to a verified household. Do not share it.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="payer_name">Full name *</Label>
                      <Input
                        id="payer_name"
                        value={payer.full_name}
                        onChange={(e) => setPayer((p) => ({ ...p, full_name: e.target.value }))}
                        className="h-11 rounded-xl mt-1"
                        disabled={paying || verifyingPayment}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payer_phone">Phone *</Label>
                      <Input
                        id="payer_phone"
                        type="tel"
                        value={payer.phone}
                        onChange={(e) => setPayer((p) => ({ ...p, phone: e.target.value }))}
                        className="h-11 rounded-xl mt-1"
                        disabled={paying || verifyingPayment}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="payer_email">Email for receipt *</Label>
                    <Input
                      id="payer_email"
                      type="email"
                      value={payer.email}
                      onChange={(e) => setPayer((p) => ({ ...p, email: e.target.value }))}
                      className="h-11 rounded-xl mt-1"
                      disabled={paying || verifyingPayment}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handlePayCommitment}
                    disabled={paying || verifyingPayment}
                    className="w-full h-12 rounded-xl bg-[#0E8F3D] hover:bg-[#0A5C2A] text-white text-base font-semibold"
                  >
                    {paying || verifyingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {verifyingPayment ? "Verifying…" : "Redirecting to Paystack…"}
                      </>
                    ) : (
                      "Pay to Submit Request"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className={`space-y-6 relative ${formLocked ? "opacity-60" : ""}`}>
              {formLocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                  <div className="text-center px-6 py-8 max-w-xs">
                    <Lock className="h-10 w-10 text-[#0E8F3D] mx-auto mb-3" />
                    <p className="font-semibold text-[#1F2937]">Pay commitment fee to unlock this form</p>
                  </div>
                </div>
              )}

              <fieldset disabled={formLocked} className="space-y-6 border-0 p-0 m-0 min-w-0">
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#0E8F3D]">Your details</h3>
                  <div>
                    <Label>Full name *</Label>
                    <Input
                      required
                      value={form.full_name}
                      onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                      className="h-12 rounded-xl mt-1"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="h-12 rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                        className="h-12 rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-12 rounded-xl mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-[#0E8F3D]">Delivery</h3>
                  <div>
                    <Label>Delivery address</Label>
                    <Textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Landmark</Label>
                    <Input
                      value={form.landmark}
                      onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                      className="h-12 rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>Preferred delivery time</Label>
                    <Input
                      value={form.delivery_time}
                      onChange={(e) => setForm((f) => ({ ...f, delivery_time: e.target.value }))}
                      className="h-12 rounded-xl mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Shopping list *</Label>
                  <Textarea
                    required
                    rows={8}
                    value={form.shopping_list}
                    onChange={(e) => setForm((f) => ({ ...f, shopping_list: e.target.value }))}
                    placeholder="e.g. 2 crates eggs, 5kg rice, Tomatoes, Yam, Tilapia, Cooking oil…"
                    className="rounded-xl mt-1 min-h-[160px] text-base"
                  />
                </div>

                <div>
                  <Label>Attachments (optional, max {MAX_FILES})</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || [])
                      setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES))
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    disabled={formLocked || files.length >= MAX_FILES}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2 h-11 rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={formLocked || files.length >= MAX_FILES}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add photos or PDF
                  </Button>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((file, i) => (
                        <li key={`${file.name}-${i}`} className="flex justify-between text-sm bg-[#F7FAF7] rounded-lg px-3 py-2">
                          <span className="truncate">{file.name}</span>
                          <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <Label>Additional notes</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="rounded-xl mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={formLocked}
                  className="w-full h-14 rounded-2xl text-lg font-semibold bg-[#0E8F3D] hover:bg-[#0A5C2A] text-white"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {uploading ? "Uploading…" : "Sending…"}
                    </>
                  ) : (
                    "Send My Grocery Request"
                  )}
                </Button>
              </fieldset>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-[#063d1c] text-white/80 py-12 border-t border-[#0E8F3D]/30">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-white text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
              DataFlex Ghana
            </p>
            <p className="text-sm mt-2 text-slate-400">Concierge grocery shopping — not an online supermarket.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Quick links</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/grocery-terms" className="hover:text-white">
                  Grocery Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Platform Terms
                </Link>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId("request-form")} className="hover:text-white">
                  Request Shopping
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Contact</p>
            <p className="text-sm">WhatsApp: +233 24 279 9990</p>
            <p className="text-sm mt-1">sales@dataflexghana.com</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 mt-10 max-w-6xl mx-auto px-4">
          © {new Date().getFullYear()} DataFlex Ghana. All rights reserved.
        </p>
      </footer>

      <WhatsAppFloatDialog />
    </>
  )
}

export default function FoodAndGroceriesLanding() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A5C2A]">
          <Loader2 className="h-10 w-10 animate-spin text-[#0E8F3D]" />
        </div>
      }
    >
      <FoodAndGroceriesContent />
    </Suspense>
  )
}
