"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Package, FileText, Plus } from "lucide-react"
import { WholesaleProductThumb } from "@/components/wholesale/WholesaleProductThumb"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
  StorefrontListPagination,
  StorefrontPageSection,
  paginateItems,
} from "@/components/storefront/StorefrontListPagination"
import { StorefrontImageLightbox } from "@/components/storefront/StorefrontImageLightbox"
import { PaystackSecureBadge } from "@/components/storefront/PaystackSecureBadge"
import type { PublicWholesaleProduct, PublicComplianceForm, BuyerDetails } from "@/lib/storefront-catalog"
import {
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
  COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO,
} from "@/lib/storefront-catalog"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"

const PROPRIETOR_TITLES = ["Mr.", "Mrs.", "Miss", "Ms.", "Dr."]

export type WholesaleCartLine = {
  lineId: string
  product: PublicWholesaleProduct
  quantity: number
}

export type StorefrontCatalogMode = "all" | "products" | "business"

type Props = {
  agentId: string
  storeSegment: string
  storeName: string
  accent: string
  products: PublicWholesaleProduct[]
  complianceForms: PublicComplianceForm[]
  wholesaleCart: WholesaleCartLine[]
  onAddWholesale: (product: PublicWholesaleProduct, qty: number) => void
  onRemoveWholesale: (lineId: string) => void
  onCheckoutWholesale: (buyer: BuyerDetails, email: string) => Promise<void>
  compliancePaidRef: string | null
  customerEmail: string
  mode?: StorefrontCatalogMode
  onComplianceSubmitted?: () => void
}

export function StorefrontExtendedCatalog({
  agentId,
  storeSegment,
  storeName,
  accent,
  products,
  complianceForms,
  wholesaleCart,
  onAddWholesale,
  onRemoveWholesale: _onRemoveWholesale,
  onCheckoutWholesale,
  compliancePaidRef,
  customerEmail,
  mode = "all",
  onComplianceSubmitted,
}: Props) {
  const showProducts = mode === "all" || mode === "products"
  const showBusiness = mode === "all" || mode === "business"
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [productModal, setProductModal] = useState<PublicWholesaleProduct | null>(null)
  const [buyerOpen, setBuyerOpen] = useState(false)
  const [buyer, setBuyer] = useState<BuyerDetails>({
    full_name: "",
    location: "",
    address: "",
    contact_number: "",
    extra_notes: "",
  })
  const [checkingOut, setCheckingOut] = useState(false)
  const [payingCompliance, setPayingCompliance] = useState(false)
  const [compliancePayOpen, setCompliancePayOpen] = useState(false)
  const [compliancePayerEmail, setCompliancePayerEmail] = useState("")
  const [compliancePayerPhone, setCompliancePayerPhone] = useState("")
  const [complianceForm, setComplianceForm] = useState({
    business_name: "",
    business_name_alt_1: "",
    business_name_alt_2: "",
    business_name_alt_3: "",
    nature_of_business: "",
    business_description: "",
    isic_code_1: "",
    isic_code_2: "",
    isic_code_3: "",
    date_of_commencement: "",
    owner_name: "",
    title: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
    tin_number: "",
    ghana_card_number: "",
    phone: "",
    email: customerEmail || "",
    location: "",
    registered_digital_address: "",
    registered_house_number: "",
    registered_house_number_2: "",
    registered_street_name: "",
    registered_city: "",
    registered_district: "",
    registered_region: "",
    same_as_registered: "",
    principal_digital_address: "",
    principal_house_number: "",
    principal_house_number_2: "",
    principal_street_name: "",
    principal_street_name_2: "",
    principal_city: "",
    principal_district: "",
    principal_region: "",
    ownership_type: "",
    landlord_name: "",
    other_digital_address: "",
    other_house_number: "",
    other_house_number_2: "",
    other_street_name: "",
    other_street_name_2: "",
    other_city: "",
    other_district: "",
    other_region: "",
    postal_care_of_1: "",
    postal_care_of_2: "",
    postal_care_of_3: "",
    postal_type: "",
    postal_number: "",
    box_town: "",
    box_region: "",
    secondary_phone: "",
    secondary_mobile: "",
    fax_number: "",
    business_website: "",
    residential_digital_address: "",
    residential_house_number: "",
    residential_house_number_2: "",
    residential_street_name: "",
    residential_city: "",
    residential_district: "",
    residential_region: "",
    residential_country: "",
    revenue_envisaged: "",
    employment_size: "",
    bop_application: "",
    bop_reference_number: "",
    signature: "",
    signature_image: "",
    ghana_card_front: "",
    ghana_card_back: "",
  })
  const [submittingCompliance, setSubmittingCompliance] = useState(false)
  const [complianceSuccess, setComplianceSuccess] = useState(false)
  const [productPage, setProductPage] = useState(1)
  const [productSlideDir, setProductSlideDir] = useState<"up" | "down">("down")

  const productPagination = useMemo(
    () => paginateItems(products, productPage),
    [products, productPage],
  )

  const complianceUnlocked = Boolean(compliancePaidRef)
  const soleForm = complianceForms.find((f) => f.form_type === COMPLIANCE_FORM_SOLE_PROPRIETORSHIP)

  const openLightbox = (src: string | null | undefined, alt: string) => {
    if (!src?.trim()) return
    setLightbox({ src: src.trim(), alt })
  }

  const openCompliancePayModal = () => {
    setCompliancePayerEmail((customerEmail || complianceForm.email || "").trim())
    setCompliancePayerPhone(complianceForm.phone.trim())
    setCompliancePayOpen(true)
  }

  const continueComplianceToPaystack = async () => {
    if (!soleForm) return
    const email = compliancePayerEmail.trim()
    const phone = compliancePayerPhone.trim()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const digits = phone.replace(/\D/g, "")
    if (!emailOk) {
      toast.error("Please enter a valid email address")
      return
    }
    if (digits.length < 9 || digits.length > 15) {
      toast.error("Please enter a valid phone number (9–15 digits)")
      return
    }

    setPayingCompliance(true)
    try {
      const callbackUrl = getStorefrontPaystackCallbackUrl()

      const res = await fetch("/api/paystack/storefront/compliance-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          agent_id: agentId,
          form_type: soleForm.form_type,
          amount: COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO,
          store_name: storeName,
          store_segment: storeSegment,
          callback_url: callbackUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment could not be started")
      setComplianceForm((f) => ({ ...f, email, phone }))
      window.location.href = data.authorizationUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
      setPayingCompliance(false)
    }
  }

  const submitCompliance = async () => {
    if (!compliancePaidRef) return
    setSubmittingCompliance(true)
    try {
      const res = await fetch("/api/storefront/compliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          form_type: COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
          paystack_reference: compliancePaidRef,
          customer_data: complianceForm,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setComplianceSuccess(true)
      setComplianceForm({
        business_name: "",
        business_name_alt_1: "",
        business_name_alt_2: "",
        business_name_alt_3: "",
        nature_of_business: "",
        business_description: "",
        isic_code_1: "",
        isic_code_2: "",
        isic_code_3: "",
        date_of_commencement: "",
        owner_name: "",
        title: "",
        gender: "",
        date_of_birth: "",
        nationality: "",
        occupation: "",
        tin_number: "",
        ghana_card_number: "",
        phone: "",
        email: "",
        location: "",
        registered_digital_address: "",
        registered_house_number: "",
        registered_house_number_2: "",
        registered_street_name: "",
        registered_city: "",
        registered_district: "",
        registered_region: "",
        same_as_registered: "",
        principal_digital_address: "",
        principal_house_number: "",
        principal_house_number_2: "",
        principal_street_name: "",
        principal_street_name_2: "",
        principal_city: "",
        principal_district: "",
        principal_region: "",
        ownership_type: "",
        landlord_name: "",
        other_digital_address: "",
        other_house_number: "",
        other_house_number_2: "",
        other_street_name: "",
        other_street_name_2: "",
        other_city: "",
        other_district: "",
        other_region: "",
        postal_care_of_1: "",
        postal_care_of_2: "",
        postal_care_of_3: "",
        postal_type: "",
        postal_number: "",
        box_town: "",
        box_region: "",
        secondary_phone: "",
        secondary_mobile: "",
        fax_number: "",
        business_website: "",
        residential_digital_address: "",
        residential_house_number: "",
        residential_house_number_2: "",
        residential_street_name: "",
        residential_city: "",
        residential_district: "",
        residential_region: "",
        residential_country: "",
        revenue_envisaged: "",
        employment_size: "",
        bop_application: "",
        bop_reference_number: "",
        signature: "",
        signature_image: "",
        ghana_card_front: "",
        ghana_card_back: "",
      })
      onComplianceSubmitted?.()
      const redirectPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/store/${storeSegment}`
      setTimeout(() => {
        const url = new URL(redirectPath, window.location.origin)
        url.searchParams.delete("compliance_paid")
        url.searchParams.delete("form_type")
        window.location.href = url.toString()
      }, 4500)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed")
    } finally {
      setSubmittingCompliance(false)
    }
  }

  const imageFileToDataUrl = (file: File, options: { maxWidth: number; maxHeight: number; quality: number; png?: boolean }) =>
    new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Please upload an image file"))
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error("Image must be 8MB or smaller"))
        return
      }

      const reader = new FileReader()
      reader.onerror = () => reject(new Error("Could not read image"))
      reader.onload = () => {
        const img = new Image()
        img.onerror = () => reject(new Error("Could not load image"))
        img.onload = () => {
          const ratio = Math.min(options.maxWidth / img.width, options.maxHeight / img.height, 1)
          const canvas = document.createElement("canvas")
          canvas.width = Math.max(1, Math.round(img.width * ratio))
          canvas.height = Math.max(1, Math.round(img.height * ratio))
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not process image"))
            return
          }
          ctx.fillStyle = "#fff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL(options.png ? "image/png" : "image/jpeg", options.quality))
        }
        img.src = String(reader.result || "")
      }
      reader.readAsDataURL(file)
    })

  const handleComplianceImage = async (
    key: "signature_image" | "ghana_card_front" | "ghana_card_back",
    file?: File,
  ) => {
    if (!file) return
    try {
      const dataUrl = await imageFileToDataUrl(file, {
        maxWidth: key === "signature_image" ? 520 : 1000,
        maxHeight: key === "signature_image" ? 220 : 650,
        quality: key === "signature_image" ? 0.9 : 0.68,
        png: key === "signature_image",
      })
      setComplianceForm((f) => ({ ...f, [key]: dataUrl }))
      toast.success("Image attached")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed")
    }
  }

  const confirmWholesaleCheckout = async () => {
    setCheckingOut(true)
    try {
      await onCheckoutWholesale(buyer, customerEmail.trim() || `${buyer.contact_number}@storefront.local`)
      setBuyerOpen(false)
    } finally {
      setCheckingOut(false)
    }
  }

  if (mode === "products" && products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">No products listed right now.</p>
    )
  }
  if (mode === "business" && complianceForms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">No business services listed right now.</p>
    )
  }
  if (products.length === 0 && complianceForms.length === 0 && mode === "all") return null

  return (
    <>
      {showProducts && products.length > 0 && (
        <section className="space-y-4">
          {mode === "all" && (
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: accent }}>
              <Package className="h-5 w-5" />
              Wholesale Shopping
            </h3>
          )}
          <p className="text-sm text-muted-foreground">
            Delivery cost will be discussed with the agent after you place your order.
          </p>
          <StorefrontPageSection
            pageKey={productPage}
            slideDirection={productSlideDir}
            className="grid grid-cols-2 gap-3 md:gap-4"
          >
            {productPagination.items.map((p) => (
              <Card
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setProductModal(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setProductModal(p)
                  }
                }}
                className="border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-xl"
              >
                <WholesaleProductThumb src={p.image_url} alt={p.name} />
                <div className="p-3 space-y-1">
                  <p className="font-medium text-sm text-slate-900 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">GH₵{p.retail_price.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </StorefrontPageSection>
          <StorefrontListPagination
            page={productPagination.page}
            totalPages={productPagination.totalPages}
            totalItems={productPagination.total}
            onPageChange={(p) => {
              setProductSlideDir(p > productPage ? "down" : "up")
              setProductPage(p)
            }}
            accentColor={accent}
          />
          {wholesaleCart.length > 0 && (
            <Button
              className="w-full sm:w-auto text-white"
              style={{ backgroundColor: accent }}
              asChild
            >
              <Link href={`/store/${encodeURIComponent(storeSegment)}/cart`}>
                View cart & checkout (GH₵
                {wholesaleCart.reduce((s, l) => s + l.product.retail_price * l.quantity, 0).toFixed(2)})
              </Link>
            </Button>
          )}
        </section>
      )}

      {showBusiness && complianceForms.length > 0 && soleForm && (
        <section className="space-y-4">
          {mode === "all" && (
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: accent }}>
              <FileText className="h-5 w-5" />
              Compliance
            </h3>
          )}

          <div className="grid grid-cols-2 gap-3 md:gap-4">
          {complianceSuccess ? (
            <Card className="border-emerald-200 bg-emerald-50 col-span-2">
              <CardContent className="p-6 space-y-3 text-center">
                <p className="font-semibold text-emerald-900">
                  Your form has been submitted. For follow-up, please contact the store agent.
                </p>
                <p className="text-sm text-emerald-800">
                  You will be redirected to the store in a few seconds…
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden col-span-2">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{soleForm.title}</h4>
                  <p className="text-lg font-bold mt-2" style={{ color: accent }}>
                    Fee: GH₵ 530
                  </p>
                  <p className="text-sm font-medium text-slate-600 mt-1">Payment summary: GH₵ 530</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                    <li>
                      Includes free nation-wide delivery of all documents to your doorstep within 14 working
                      days.
                    </li>
                    <li>
                      Fill forms easily, sign and submit securely. No queues, no disappointments, no delays.
                    </li>
                  </ul>
                </div>

                {!complianceUnlocked ? (
                  <div className="space-y-3">
                    <PaystackSecureBadge />
                    <Button
                      onClick={openCompliancePayModal}
                      disabled={payingCompliance}
                      className="w-full text-white h-11"
                      style={{ backgroundColor: accent }}
                    >
                      Pay GH₵ 530 to unlock form
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-emerald-700 font-medium">
                      Payment received — complete your application below
                    </p>
                    {(
                      [
                        {
                          title: "Business Information",
                          fields: [
                            ["business_name", "Business name"],
                            ["business_name_alt_1", "Alternative business name 1"],
                            ["business_name_alt_2", "Alternative business name 2"],
                            ["business_name_alt_3", "Alternative business name 3"],
                            ["nature_of_business", "Nature of business / sector"],
                            ["business_description", "Business activity description"],
                            ["isic_code_1", "ISIC code 1"],
                            ["isic_code_2", "ISIC code 2"],
                            ["isic_code_3", "ISIC code 3"],
                            ["date_of_commencement", "Date of commencement"],
                          ],
                        },
                        {
                          title: "Registered Office",
                          fields: [
                            ["registered_digital_address", "Digital address"],
                            ["registered_house_number", "House/building/flat"],
                            ["registered_house_number_2", "House/building/flat line 2"],
                            ["registered_street_name", "Street name"],
                            ["registered_city", "City/town"],
                            ["registered_district", "District"],
                            ["registered_region", "Region"],
                            ["ownership_type", "Ownership type"],
                            ["landlord_name", "Landlord name"],
                          ],
                        },
                        {
                          title: "Principal Place of Business",
                          fields: [
                            ["same_as_registered", "Same as registered office? (Yes/No)"],
                            ["principal_digital_address", "Principal digital address"],
                            ["principal_house_number", "Principal house/building/flat"],
                            ["principal_house_number_2", "Principal house/building/flat line 2"],
                            ["principal_street_name", "Principal street name"],
                            ["principal_street_name_2", "Principal street name line 2"],
                            ["principal_city", "Principal city/town"],
                            ["principal_district", "Principal district"],
                            ["principal_region", "Principal region"],
                          ],
                        },
                        {
                          title: "Other Place of Business",
                          fields: [
                            ["other_digital_address", "Other digital address"],
                            ["other_house_number", "Other house/building/flat"],
                            ["other_house_number_2", "Other house/building/flat line 2"],
                            ["other_street_name", "Other street name"],
                            ["other_street_name_2", "Other street name line 2"],
                            ["other_city", "Other city/town"],
                            ["other_district", "Other district"],
                            ["other_region", "Other region"],
                          ],
                        },
                        {
                          title: "Postal and Contact",
                          fields: [
                            ["postal_care_of_1", "Care of / postal line 1"],
                            ["postal_care_of_2", "Postal line 2"],
                            ["postal_care_of_3", "Postal line 3"],
                            ["postal_type", "Postal type (P.O. Box / PMB / DTD)"],
                            ["postal_number", "Postal number"],
                            ["box_town", "Postal town"],
                            ["box_region", "Postal region"],
                            ["phone", "Phone"],
                            ["secondary_phone", "Secondary phone"],
                            ["secondary_mobile", "Secondary mobile"],
                            ["email", "Email"],
                            ["fax_number", "Fax"],
                            ["business_website", "Website"],
                          ],
                        },
                        {
                          title: "Proprietor",
                          fields: [
                            ["title", "Title (Mr/Mrs/Miss/Ms/Dr)"],
                            ["owner_name", "Owner full name"],
                            ["gender", "Gender"],
                            ["date_of_birth", "Date of birth"],
                            ["nationality", "Nationality"],
                            ["occupation", "Occupation"],
                            ["tin_number", "TIN"],
                            ["ghana_card_number", "Ghana Card number"],
                            ["residential_digital_address", "Residential digital address"],
                            ["residential_house_number", "Residential house/building/flat"],
                            ["residential_house_number_2", "Residential house/building/flat line 2"],
                            ["residential_street_name", "Residential street name"],
                            ["residential_city", "Residential city/town"],
                            ["residential_district", "Residential district"],
                            ["residential_region", "Residential region"],
                            ["residential_country", "Residential country"],
                          ],
                        },
                        {
                          title: "MSME, BOP and Declaration",
                          fields: [
                            ["revenue_envisaged", "Revenue envisaged"],
                            ["employment_size", "Employees envisaged"],
                            ["bop_application", "BOP option"],
                            ["bop_reference_number", "BOP reference number"],
                            ["signature", "Digital signature (type full name)"],
                          ],
                        },
                      ] as const
                    ).map((section) => (
                      <div key={section.title} className="space-y-3 rounded-lg border p-3">
                        <h5 className="font-semibold text-slate-900">{section.title}</h5>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {section.fields.map(([key, label]) => (
                            <div key={key} className={key === "business_description" ? "sm:col-span-2" : ""}>
                              <Label>{label}</Label>
                              {key === "title" ? (
                                <Select
                                  value={complianceForm.title}
                                  onValueChange={(value) => setComplianceForm((f) => ({ ...f, title: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select title" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PROPRIETOR_TITLES.map((title) => (
                                      <SelectItem key={title} value={title}>
                                        {title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : key === "business_description" ? (
                                <Textarea
                                  value={complianceForm.business_description}
                                  onChange={(e) => setComplianceForm((f) => ({ ...f, business_description: e.target.value }))}
                                  rows={3}
                                />
                              ) : (
                                <Input
                                  type={key === "date_of_commencement" || key === "date_of_birth" ? "date" : "text"}
                                  value={complianceForm[key]}
                                  placeholder={key === "ghana_card_number" ? "XXXXXXXXX-X" : undefined}
                                  onChange={(e) => setComplianceForm((f) => ({ ...f, [key]: e.target.value }))}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          ["signature_image", "Signature image"],
                          ["ghana_card_front", "Ghana Card front"],
                          ["ghana_card_back", "Ghana Card back"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="space-y-2">
                          <Label>{label}</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => void handleComplianceImage(key, e.target.files?.[0])}
                          />
                          {complianceForm[key] ? (
                            <div className="rounded-md border bg-white p-2">
                              <img
                                src={complianceForm[key]}
                                alt={label}
                                className="h-24 w-full object-contain"
                              />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <PaystackSecureBadge />
                    <Button
                      onClick={submitCompliance}
                      disabled={submittingCompliance}
                      className="text-white w-full h-11"
                      style={{ backgroundColor: accent }}
                    >
                      {submittingCompliance ? "Submitting…" : "Submit application"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </section>
      )}

      <StorefrontImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
      />

      <Dialog
        open={productModal != null}
        onOpenChange={(open) => {
          if (!open) setProductModal(null)
        }}
      >
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto gap-0 border-slate-200 p-0 sm:rounded-2xl">
          {productModal && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{productModal.name}</DialogTitle>
                <DialogDescription>Product details and add to cart</DialogDescription>
              </DialogHeader>
              <div className="px-4 pt-12 pb-4 space-y-4">
                <button
                  type="button"
                  className="relative w-full min-h-[200px] max-h-[48vh] rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
                  onClick={() => openLightbox(productModal.image_url, productModal.name)}
                  aria-label="View full-size product image"
                >
                  <ImageWithFallback
                    src={productModal.image_url?.trim() || "/placeholder-product.jpg"}
                    alt={productModal.name}
                    className="max-h-[48vh] w-full h-auto object-contain"
                    fallbackSrc="/placeholder-product.jpg"
                  />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
                    Tap for full screen
                  </span>
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 leading-snug">{productModal.name}</h3>
                  <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
                    GH₵{productModal.retail_price.toFixed(2)}
                  </p>
                </div>
                {productModal.description?.trim() ? (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {productModal.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No description provided.</p>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/90 p-4 sm:flex-col">
                <Button
                  type="button"
                  className="w-full h-12 gap-2 text-white text-base font-semibold rounded-xl"
                  style={{ backgroundColor: accent }}
                  onClick={() => {
                    onAddWholesale(productModal, 1)
                    setProductModal(null)
                  }}
                >
                  <Plus className="h-5 w-5 shrink-0" />
                  Add to Cart
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl border-slate-200"
                  onClick={() => setProductModal(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={buyerOpen} onOpenChange={setBuyerOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery details</DialogTitle>
            <DialogDescription>
              Provide shipping and contact details for your wholesale order.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Delivery cost will be discussed with the agent after your order is placed.
          </p>
          <div className="space-y-3">
            {(
              [
                ["full_name", "Full name"],
                ["location", "Location / area"],
                ["address", "Delivery address"],
                ["contact_number", "Contact number"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  value={buyer[key]}
                  onChange={(e) => setBuyer((b) => ({ ...b, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <Label>Extra notes (optional)</Label>
              <Textarea
                value={buyer.extra_notes || ""}
                onChange={(e) => setBuyer((b) => ({ ...b, extra_notes: e.target.value }))}
              />
            </div>
          </div>
          <PaystackSecureBadge />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmWholesaleCheckout}
              disabled={checkingOut}
              style={{ backgroundColor: accent }}
              className="text-white"
            >
              {checkingOut ? "Processing…" : "Pay with Paystack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={compliancePayOpen}
        onOpenChange={(open) => {
          setCompliancePayOpen(open)
          if (!open) setPayingCompliance(false)
        }}
      >
        <DialogContent className="max-w-md sm:rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Before you pay</DialogTitle>
            <DialogDescription>
              Enter your email and phone number. We will use them for your Paystack receipt and so the agent can
              reach you about your compliance application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="compliance-payer-email">Email</Label>
              <Input
                id="compliance-payer-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                className="mt-1 h-11"
                placeholder="you@example.com"
                value={compliancePayerEmail}
                onChange={(e) => setCompliancePayerEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="compliance-payer-phone">Phone</Label>
              <Input
                id="compliance-payer-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className="mt-1 h-11"
                placeholder="e.g. 0241234567"
                value={compliancePayerPhone}
                onChange={(e) => setCompliancePayerPhone(e.target.value)}
              />
            </div>
            <PaystackSecureBadge />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full h-11 text-white font-semibold"
              style={{ backgroundColor: accent }}
              disabled={payingCompliance}
              onClick={() => void continueComplianceToPaystack()}
            >
              {payingCompliance ? "Redirecting to Paystack…" : "Continue to Payment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              disabled={payingCompliance}
              onClick={() => setCompliancePayOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
