"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { PenLine, Loader2, CheckCircle2, Clock, Upload } from "lucide-react"
import type { PublicWritingService, CvFields } from "@/lib/writing-types"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"

type Props = {
  agentId: string
  storeSegment: string
  accent: string
  services: PublicWritingService[]
}

const CV_FIELD_LABELS: { key: keyof CvFields; label: string }[] = [
  { key: "target_roles_industries", label: "Target roles / industries" },
  { key: "extra_cv_info", label: "Extra info for the CV" },
  { key: "linkedin_url", label: "LinkedIn profile URL" },
  { key: "cv_pages", label: "Number of pages for CV" },
  { key: "languages_spoken", label: "Languages spoken" },
  { key: "current_location", label: "Current location" },
  { key: "willingness_to_relocate", label: "Willingness to relocate" },
  { key: "valid_drivers_license", label: "Valid driver's license" },
]

export function StorefrontWritingTab({ agentId, storeSegment, accent, services }: Props) {
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<PublicWritingService | null>(null)
  const [paying, setPaying] = useState(false)
  const [uploadingBrief, setUploadingBrief] = useState(false)
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    instructions: "",
    attached_file_url: "",
  })
  const [cvFields, setCvFields] = useState<CvFields>({})

  const writingPaidRef = searchParams.get("ref")
  const writingPaymentSuccess = searchParams.get("writing_payment") === "success"

  useEffect(() => {
    if (writingPaymentSuccess && writingPaidRef) {
      toast.success(`Order confirmed. Your reference: ${writingPaidRef}`)
    }
  }, [writingPaymentSuccess, writingPaidRef])

  const isCvCategory = selected?.category === "CV/Resume"

  const uploadBrief = async (file: File) => {
    setUploadingBrief(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/writing/upload-brief", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed")
      setForm((f) => ({ ...f, attached_file_url: data.url }))
      toast.success("Reference file uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploadingBrief(false)
    }
  }

  const startCheckout = async () => {
    if (!selected) return
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast.error("Name and phone are required")
      return
    }
    setPaying(true)
    try {
      const res = await fetch("/api/paystack/writing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          service_id: selected.id,
          store_segment: storeSegment,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          customer_email: form.customer_email.trim() || undefined,
          instructions: form.instructions.trim() || undefined,
          attached_file_url: form.attached_file_url || undefined,
          cv_fields: isCvCategory ? cvFields : {},
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Payment failed to start")
      window.location.href = data.authorization_url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed")
      setPaying(false)
    }
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, #4c1d95 55%, #312e81 100%)`,
        }}
      >
        <p className="text-xs uppercase tracking-widest text-white/80 font-medium">Professional writing</p>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
          CVs, Cover Letters &amp; Business Documents
        </h2>
        <p className="mt-3 text-white/90 max-w-2xl text-sm sm:text-base">
          Order professionally written documents. Share your details, pay securely, and receive your
          finished document from this store.
        </p>
      </section>

      {writingPaymentSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Payment successful</p>
            <p className="text-sm text-emerald-800 mt-1">
              Thank you! Your writing order has been received
              {writingPaidRef ? ` (ref: ${writingPaidRef})` : ""}. You will be contacted when your document
              is ready.
            </p>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No writing services available at this store.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => {
                setSelected(svc)
                setCvFields({})
                setForm({
                  customer_name: "",
                  customer_phone: "",
                  customer_email: "",
                  instructions: "",
                  attached_file_url: "",
                })
              }}
              className="text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accent}22` }}
                >
                  <PenLine className="h-5 w-5" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{svc.service_name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {svc.category}
                  </Badge>
                  {svc.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{svc.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xl font-bold" style={{ color: accent }}>
                      ₵{svc.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {svc.turnaround_time}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.service_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <p className="text-2xl font-bold" style={{ color: accent }}>
                ₵{selected.price.toFixed(2)}
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Your name *</Label>
                  <Input
                    className="mt-1"
                    value={form.customer_name}
                    onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    className="mt-1"
                    value={form.customer_phone}
                    onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Email (optional)</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                  />
                </div>
              </div>

              {isCvCategory ? (
                <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                  <p className="text-sm font-medium text-violet-900">CV / Resume details (all optional)</p>
                  {CV_FIELD_LABELS.map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Input
                        className="mt-1 bg-white"
                        value={cvFields[key] || ""}
                        onChange={(e) => setCvFields((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Label>Instructions / What you need written (optional)</Label>
                  <Textarea
                    className="mt-1 min-h-[120px]"
                    value={form.instructions}
                    onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                    placeholder="Describe what you need written…"
                  />
                </div>
              )}

              <div>
                <Label>Reference file (optional)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    disabled={uploadingBrief}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadBrief(file)
                    }}
                  />
                  {uploadingBrief && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {form.attached_file_url && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    File attached
                  </p>
                )}
              </div>

              <PaystackSecureBadge />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              disabled={paying}
              onClick={startCheckout}
              style={{ backgroundColor: accent }}
              className="text-white hover:opacity-90"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting…
                </>
              ) : (
                `Pay ₵${selected?.price.toFixed(2) ?? "0.00"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
