import { NextResponse } from "next/server"
import { PDFDocument, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib"
import { getAdminClient } from "@/lib/supabase-base"
import fs from "fs"
import path from "path"
import sharp from "sharp"

type SubmissionSource = "agent" | "storefront"

type SubmissionRecord = {
  id: string
  source: SubmissionSource
  formData: Record<string, any>
  submittedAt: string
  agentName?: string
}

type FormImageRecord = {
  image_type: string
  image_url: string
}

const A4 = { width: 595.28, height: 841.89 }
const TARGET_MAX_BYTES = 2 * 1024 * 1024

const PDF_FIELDS = {
  isic_code_1: "ISIC CODE 1",
  isic_code_2: "ISIC CODE 2",
  isic_code_3: "ISIC CODE 3",
  registered_district: "DISTRICT",
  registered_region: "REGION",
  same_as_registered_yes: "IS PRINCIPAL PLACE OF BUSINESS SAME AS REGSITERED OFFICE? (YES)",
  principal_building: "PRINCIPAL PLACE OF BUSINESS (HOUSE/BUILDING/FLAT)",
  principal_building_2: "PRINCIPAL PLACE OF BUSINESS (HOUSE/BUILDING/FLAT) 2",
  principal_street: "PRINCIPAL PLACE OF BUSINESS (STREET NAME)",
  principal_street_2: "PRINCIPAL PLACE OF BUSINESS (STREET NAME) 2",
  principal_city: "PRINCIPAL PLACE OF BUSINESS (CITY)",
  principal_district: "PRINCIPAL PLACE OF BUSINESS (DISTRICT)",
  principal_region: "PRINCIPAL PLACE OF BUSINESS (REGION)",
  principal_digital_address: "PRINCIPAL PLACE OF BUSINESS (DIGITAL ADDRESS)",
  owner_occupied: "OWNER OCCPIED",
  rented: "RENTED",
  free_use: "FREE USE",
  part_rented_yes: "IF OWNER OCCUPIED IS IT PART RENTED? YES",
  part_rented_no: "IF OWNER OCCUPIED IS IT PART RENTED? NO",
  landlord_name: "LANDLORDS NAME",
  landlord_name_2: "LANDLORDS NAME 2",
  postal_care_of_1: "POSTAL ADDRESSS C/O 1",
  postal_care_of_2: "POSTAL ADDRESSS C/O 2",
  postal_care_of_3: "POSTAL ADDRESSS C/O 3",
  postal_type_pobox: "P O BOX",
  postal_type_pmb: "PMB",
  postal_type_dtd: "DTD",
  postal_number: "POSTAL ADDRESS (NUMBER)",
  postal_town: "POSTAL ADDRESS (TOWN)",
  postal_region: "POSTAL ADDRESS (REGION)",
  phone_no_1: "POSTAL ADDRESS (CONTACT No 1)",
  phone_no_2: "POSTAL ADDRESS (CONTACT No 2)",
  mobile_no_1: "POSTAL ADDRESS (MOBILE No 1)",
  mobile_no_2: "POSTAL ADDRESS (MOBILE No 2)",
  email: "POSTAL ADDRESS (EMAIL)",
  fax: "POSTAL ADDRESS (FAX)",
  website: "POSTAL ADDRESS (WEBSITE)",
  title_mr: "PROPRIETOR/PROPRIETRRESS TITLE  (MR)",
  title_mrs: "PROPRIETOR/PROPRIETRRESS TITLE (MRS)",
  title_miss: "PROPRIETOR/PROPRIETRRESS TITLE (MISS)",
  title_ms: "PROPRIETOR/PROPRIETRRESS TITLE (MS)",
  title_dr: "PROPRIETOR/PROPRIETRRESS TITLE (DR)",
  first_name: "PROPRIETOR/PROPRIETRRESS (FIRST NAME)",
  middle_name: "PROPRIETOR/PROPRIETRRESS (MIDDLE NAME)",
  last_name: "PROPRIETOR/PROPRIETRRESS (LAST NAME)",
  former_name: "PROPRIETOR/PROPRIETRRESS (FORMER NAME)",
  gender_male: "PROPRIETOR/PROPRIETRESS GENDER (MALE)",
  gender_female: "PROPRIETOR/PROPRIETRESS GENDER (FEMALE)",
  nationality: "PROPRIETOR/PROPRIETRRESS (NATIONALITY)",
  tin: "PROPRIETOR/PROPRIETRRESS (TIN)",
  proprietor_email: "PROPRIETOR/PROPRIETRRESS (EMAIL)",
  proprietor_mobile_1: "PROPRIETOR/PROPRIETRRESS (MOBILE N0 1)",
  proprietor_mobile_2: "PROPRIETOR/PROPRIETRRESS (MOBILEE N0 2)",
  proprietor_fax: "PROPRIETOR/PROPRIETRRESS (FAX)",
  residential_district: "PROPRIETOR/PROPRIETRRESS (DISTRICT)",
  residential_region: "PROPRIETOR/PROPRIETRRESS (REGION)",
  residential_country: "PROPRIETOR/PROPRIETRRESS (COUNTRY)",
  projected_revenue: "PROPRIETOR/PROPRIETRRESS (REVENUE ENVISAGED)",
  projected_employees: "PROPRIETOR/PROPRIETRRESS (EMPLOYEES ENVISAGED)",
  apply_for_bop_later: "APPLY FOR BOP LATER",
  already_have_bop: "ALREADY HAVE A BOP",
  bop_reference_number: "PROPRIETOR/PROPRIETRRESS (BOP REFERENCE NO)",
  declaration_full_name: "DECLARATION (FULL NAME)",
} as const

const SECTOR_FIELDS: Record<string, string> = {
  legal: "LEGAL",
  media: "MEDIA",
  estate_housing: "ESTATE/HOUSING",
  transport_aerospace: "TRANSPORT/AEROSPACE",
  utilities: "UTILITIES",
  education: "EDUCATION",
  telecom_ict: "TELECOM/ICT",
  security: "SECURITY",
  construction: "CONSTRUCTION",
  pharmaceutical: "PHARMACEUTICAL",
  banking_finance: "BANKING AND FINANCCE",
  oil_gas: "OIL AND GAS",
  manufacturing: "MANUFACTURING",
  commerce_trading: "COMMERCE/TRAIDING",
  agriculture: "AGRICULTURE",
  food_industry: "FOOD INDUSTRY",
  tourism: "TOURISM",
  quarry_mining: "QUARRY/MINING",
  hospitality: "HOSPITALITY",
  fashion_beautification: "FASHION/BEAUTIFICATION",
  other: "OTHERS (Please Speccify)",
}

function clean(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value).trim()
}

function uppercase(value: unknown): string {
  return clean(value).toUpperCase()
}

function firstValue(data: Record<string, any>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = clean(data[key])
    if (value) return value
  }
  return fallback
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    first: parts[0] || "",
    middle: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    last: parts.length > 1 ? parts[parts.length - 1] : "",
  }
}

function splitForPdfLines(value: string, maxChars = 42, maxLines = 6): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    if (!current) {
      current = word
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
    while (current.length > maxChars) {
      lines.push(current.slice(0, maxChars))
      current = current.slice(maxChars)
    }
    if (lines.length >= maxLines) break
  }

  if (current && lines.length < maxLines) lines.push(current)
  return lines.slice(0, maxLines)
}

function formatDate(value: unknown, fallback?: string): string {
  const raw = clean(value) || fallback || ""
  if (!raw) return ""
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const year = String(date.getUTCFullYear())
  return `${day}/${month}/${year}`
}

function compactFilePart(value: string): string {
  return (value || "submission").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80)
}

function normalizeSector(value: string): string {
  const v = value.toLowerCase()
  if (/agric|fisher/.test(v)) return "agriculture"
  if (/mining|quarry/.test(v)) return "quarry_mining"
  if (/oil|gas/.test(v)) return "oil_gas"
  if (/ict|telecom|information/.test(v)) return "telecom_ict"
  if (/financ|bank/.test(v)) return "banking_finance"
  if (/manufact/.test(v)) return "manufacturing"
  if (/tour/.test(v)) return "tourism"
  if (/hospitality|hotel/.test(v)) return "hospitality"
  if (/estate|housing|construction/.test(v)) return v.includes("construction") ? "construction" : "estate_housing"
  if (/transport|logistic/.test(v)) return "transport_aerospace"
  if (/education|training/.test(v)) return "education"
  if (/health|pharma/.test(v)) return "pharmaceutical"
  if (/retail|wholesale|trade|commerce/.test(v)) return "commerce_trading"
  if (/media|entertain/.test(v)) return "media"
  if (/textile|apparel|fashion|beaut/.test(v)) return "fashion_beautification"
  if (/legal|consult/.test(v)) return "legal"
  if (/food|beverage/.test(v)) return "food_industry"
  if (/security/.test(v)) return "security"
  if (/utilit/.test(v)) return "utilities"
  return "other"
}

function normalizeGhanaCardForForm(value: string): string {
  return uppercase(value)
    .replace(/^GHA\s*-?\s*/i, "")
    .replace(/\s+/g, "")
}

function mapCanonicalData(record: SubmissionRecord) {
  const d = record.formData || {}
  const ownerName = firstValue(d, ["owner_name", "full_name", "name"], record.agentName || "")
  const split = splitName(ownerName)
  const sameAsRegistered = d.same_as_registered === true || clean(d.same_as_registered).toLowerCase() === "yes"
  const title = firstValue(d, ["title"]).replace(".", "").toLowerCase()
  const gender = firstValue(d, ["gender"]).toLowerCase()
  const ownership = firstValue(d, ["ownership_type"]).toLowerCase()
  const bop = firstValue(d, ["bop_application"]).toLowerCase()
  const principalPrefix = sameAsRegistered ? "registered" : "principal"

  return {
    business_name: firstValue(d, ["business_name", "businessName"]),
    business_name_alt_1: firstValue(d, ["business_name_alt_1", "alternative_business_name_1"]),
    business_name_alt_2: firstValue(d, ["business_name_alt_2", "alternative_business_name_2"]),
    business_name_alt_3: firstValue(d, ["business_name_alt_3", "alternative_business_name_3"]),
    isic_code_1: firstValue(d, ["isic_code_1"]),
    isic_code_2: firstValue(d, ["isic_code_2"]),
    isic_code_3: firstValue(d, ["isic_code_3"]),
    business_activity_description: firstValue(d, [
      "business_activity_description",
      "business_description",
      "nature_of_business",
      "isic_code_4",
    ]),
    date_of_commencement: formatDate(firstValue(d, ["date_of_commencement", "commencement_date", "Date of Commencement"])),
    registered_digital_address: firstValue(d, ["registered_digital_address", "Digital Address*", "Digital Address"]),
    registered_building: firstValue(d, [
      "registered_building",
      "registered_house_number",
      "House/Building/Flat*",
      "House/Building/Flat",
      "House/Building/Flat (Name or House No.)/LMB",
    ]),
    registered_building_2: firstValue(d, ["registered_building_2", "registered_house_number_2"]),
    registered_street: firstValue(d, ["registered_street", "registered_street_name", "Street Name*", "Street Name"]),
    registered_city: firstValue(d, ["registered_city", "location", "City*", "City"]),
    registered_district: firstValue(d, ["registered_district"]),
    registered_region: firstValue(d, ["registered_region"]),
    same_as_registered_yes: sameAsRegistered,
    principal_building: firstValue(d, [`${principalPrefix}_building`, `${principalPrefix}_house_number`]),
    principal_building_2: firstValue(d, [`${principalPrefix}_building_2`, `${principalPrefix}_house_number_2`]),
    principal_street: firstValue(d, [`${principalPrefix}_street`, `${principalPrefix}_street_name`]),
    principal_street_2: firstValue(d, [`${principalPrefix}_street_2`, `${principalPrefix}_street_name_2`]),
    principal_city: firstValue(d, [`${principalPrefix}_city`]),
    principal_district: firstValue(d, [`${principalPrefix}_district`]),
    principal_region: firstValue(d, [`${principalPrefix}_region`]),
    principal_digital_address: firstValue(d, [`${principalPrefix}_digital_address`]),
    owner_occupied: /owned|owner/.test(ownership),
    rented: /rent/.test(ownership),
    free_use: /family|free|government|company/.test(ownership),
    part_rented_no: /owned|owner/.test(ownership),
    landlord_name: firstValue(d, ["landlord_name"]),
    landlord_name_2: firstValue(d, ["landlord_name_2"]),
    other_building: firstValue(d, ["other_building", "other_house_number"]),
    other_building_2: firstValue(d, ["other_building_2", "other_house_number_2"]),
    other_street: firstValue(d, ["other_street", "other_street_name"]),
    other_street_2: firstValue(d, ["other_street_2", "other_street_name_2"]),
    other_city: firstValue(d, ["other_city"]),
    other_district: firstValue(d, ["other_district"]),
    other_region: firstValue(d, ["other_region"]),
    other_digital_address: firstValue(d, ["other_digital_address"]),
    postal_care_of_1: firstValue(d, ["postal_care_of_1", "postal_care_of", "postal_address_line_1"]),
    postal_care_of_2: firstValue(d, ["postal_care_of_2", "postal_address_line_2"]),
    postal_care_of_3: firstValue(d, ["postal_care_of_3", "postal_address_line_3"]),
    postal_type_pobox: /p\.?\s*o|box/.test(firstValue(d, ["postal_type"]).toLowerCase()),
    postal_type_pmb: /pmb|private/.test(firstValue(d, ["postal_type"]).toLowerCase()),
    postal_number: [firstValue(d, ["postal_prefix"]), firstValue(d, ["postal_number"])].filter(Boolean).join(" "),
    postal_town: firstValue(d, ["postal_town", "box_town", "box_location"]),
    postal_region: firstValue(d, ["postal_region", "box_region"]),
    phone_no_1: firstValue(d, ["primary_phone", "phone", "contact_number", "phone_number"]),
    phone_no_2: firstValue(d, ["secondary_phone"]),
    mobile_no_1: firstValue(d, ["primary_mobile", "phone", "contact_number", "phone_number"]),
    mobile_no_2: firstValue(d, ["secondary_mobile"]),
    email: firstValue(d, ["business_email", "email"]),
    fax: firstValue(d, ["fax_number", "fax"]),
    website: firstValue(d, ["business_website", "website"]),
    title_mr: title === "mr",
    title_mrs: title === "mrs",
    title_miss: title === "miss",
    title_ms: title === "ms",
    title_dr: title === "dr",
    first_name: firstValue(d, ["first_name", "firstName"], split.first),
    middle_name: firstValue(d, ["middle_name", "middleName"], split.middle),
    last_name: firstValue(d, ["last_name", "lastName"], split.last),
    former_name: firstValue(d, ["former_name"]),
    dob: formatDate(firstValue(d, ["date_of_birth", "dob", "DATE OF BIRTH (DOB)", "Date of Birth*", "Date of Birth"])),
    gender_male: gender === "male",
    gender_female: gender === "female",
    nationality: firstValue(d, ["nationality"], "Ghanaian"),
    occupation: firstValue(d, ["occupation", "proprietor_occupation", "PROPRIETOR/PROPRIETRRESS (OCCUPATION)", "Occupation"]),
    ghana_card: normalizeGhanaCardForForm(firstValue(d, [
      "ghana_card_number",
      "ghana_card",
      "ghanaCard",
      "national_identity_card",
      "national_id",
      "Ghana Card(National Identity Card)*",
      "Ghana Card (National Identity Card)",
    ])),
    tin: firstValue(d, ["tin_number", "tinNumber", "tin"]),
    proprietor_email: firstValue(d, ["email", "business_email"]),
    proprietor_mobile_1: firstValue(d, ["phone", "primary_mobile", "contact_number", "phone_number"]),
    proprietor_mobile_2: firstValue(d, ["secondary_mobile"]),
    proprietor_fax: firstValue(d, ["fax_number", "fax"]),
    residential_digital_address: firstValue(d, ["residential_digital_address", "Residential Digital Address"]),
    residential_building: firstValue(d, [
      "residential_building",
      "residential_house_number",
      "Residential House/Building/Flat",
      "Residential Address of Proprietor or Proprietress House/Building/Flat",
    ]),
    residential_building_2: firstValue(d, ["residential_building_2", "residential_house_number_2"]),
    residential_street: firstValue(d, ["residential_street", "residential_street_name", "Residential Street Name"]),
    residential_city: firstValue(d, ["residential_city", "Residential City"]),
    residential_district: firstValue(d, ["residential_district"]),
    residential_region: firstValue(d, ["residential_region"]),
    residential_country: firstValue(d, ["residential_country"], "Ghana"),
    projected_revenue: firstValue(d, ["revenue_envisaged", "projected_revenue"]),
    projected_employees: firstValue(d, ["employment_size", "projected_employees"]),
    apply_for_bop_later: /later/.test(bop),
    already_have_bop: /already/.test(bop),
    bop_reference_number: firstValue(d, ["bop_reference_number"]),
    declaration_full_name: ownerName,
    declaration_signature: firstValue(d, ["signature"], ownerName),
    declaration_date: formatDate(firstValue(d, ["declaration_date"]), record.submittedAt),
    sector: normalizeSector(firstValue(d, ["nature_of_business", "business_activity_description", "business_description"])),
  }
}

function fillWrappedFields(form: ReturnType<PDFDocument["getForm"]>, fieldNames: string[], value: string) {
  splitForPdfLines(uppercase(value), 42, fieldNames.length).forEach((line, index) => {
    setText(form, fieldNames[index], line)
  })
}

function setText(form: ReturnType<PDFDocument["getForm"]>, fieldName: string, value: unknown) {
  const text = uppercase(value)
  if (!text) return
  try {
    const field = form.getTextField(fieldName)
    field.setText(text.slice(0, 240))
  } catch {
    // The PDF is the source of truth. Missing/renamed fields should not break download.
  }
}

function setCheck(form: ReturnType<PDFDocument["getForm"]>, fieldName: string, checked: unknown) {
  if (!checked) return
  try {
    form.getCheckBox(fieldName).check()
  } catch {
    try {
      form.getRadioGroup(fieldName).select("Yes")
    } catch {
      // Ignore incompatible fields.
    }
  }
}

async function getSubmission(supabase: ReturnType<typeof getAdminClient>, submissionId: string, source?: SubmissionSource) {
  if (!source || source === "agent") {
    const { data } = await supabase
      .from("form_submissions")
      .select(`*, agents!form_submissions_agent_id_fkey(full_name)`)
      .eq("id", submissionId)
      .maybeSingle()

    if (data) {
      const { data: images } = await supabase.from("form_images").select("*").eq("submission_id", submissionId)
      return {
        submission: {
          id: data.id,
          source: "agent" as const,
          formData: data.form_data || {},
          submittedAt: data.updated_at || data.submitted_at || data.created_at || new Date().toISOString(),
          agentName: data.agents?.full_name || undefined,
        },
        images: (images || []) as FormImageRecord[],
      }
    }
  }

  const { data } = await supabase
    .from("storefront_compliance_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle()

  if (!data) return null

  const customerData = data.customer_data || {}
  const images: FormImageRecord[] = [
    { image_type: "signature", image_url: clean(customerData.signature_url || customerData.signature_image) },
    { image_type: "ghana_card_front", image_url: clean(customerData.ghana_card_front || customerData.ghana_card_front_url) },
    { image_type: "ghana_card_back", image_url: clean(customerData.ghana_card_back || customerData.ghana_card_back_url) },
  ].filter((image) => image.image_url)

  return {
    submission: {
      id: data.id,
      source: "storefront" as const,
      formData: customerData,
      submittedAt: customerData.declaration_date || data.updated_at || data.created_at || new Date().toISOString(),
    },
    images,
  }
}

function storagePathFromUrl(rawUrl: string): string {
  let imagePath = rawUrl
  if (imagePath.includes("supabase.co/storage/v1/object/public/")) {
    imagePath = imagePath.split("supabase.co/storage/v1/object/public/")[1] || imagePath
  }
  if (imagePath.startsWith("compliance-images/")) imagePath = imagePath.replace("compliance-images/", "")
  if (imagePath.startsWith("/")) imagePath = imagePath.slice(1)
  return imagePath
}

async function fetchImageBytes(supabase: ReturnType<typeof getAdminClient>, rawUrl: string) {
  const url = rawUrl.startsWith("data:") || rawUrl.startsWith("http")
    ? rawUrl
    : supabase.storage.from("compliance-images").getPublicUrl(storagePathFromUrl(rawUrl)).data.publicUrl

  if (url.startsWith("data:")) {
    const [, base64] = url.split(",", 2)
    return Buffer.from(base64 || "", "base64")
  }

  const response = await fetch(url)
  if (!response.ok && rawUrl.startsWith("http") && rawUrl !== url) {
    const fallback = await fetch(rawUrl)
    if (fallback.ok) return Buffer.from(await fallback.arrayBuffer())
  }
  if (!response.ok) return null
  return Buffer.from(await response.arrayBuffer())
}

async function embedCompressedImage(pdfDoc: PDFDocument, bytes: Buffer, imageType: string, quality = 55) {
  const isSignature = imageType === "signature"
  const processed = isSignature
    ? await sharp(bytes)
        .trim({ threshold: 18 })
        .resize({ width: 700, height: 180, fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer()
    : await sharp(bytes)
        .rotate()
        .resize({ width: 760, height: 500, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()

  return isSignature ? pdfDoc.embedPng(processed) : pdfDoc.embedJpg(processed)
}

function fitImage(image: PDFImage, maxWidth: number, maxHeight: number) {
  const ratio = image.width / image.height
  let width = maxWidth
  let height = width / ratio
  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }
  return { width, height }
}

function getFieldPlacement(pdfDoc: PDFDocument, form: ReturnType<PDFDocument["getForm"]>, fieldName: string) {
  try {
    const field = form.getField(fieldName)
    const widget = field.acroField.getWidgets()[0]
    const rect = widget.getRectangle()
    const pageRef = widget.P()
    const pageIndex = pdfDoc.getPages().findIndex((page) => page.ref === pageRef)
    return {
      page: pdfDoc.getPages()[Math.max(0, pageIndex)],
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }
  } catch {
    return {
      page: pdfDoc.getPages()[2] || pdfDoc.getPages()[0],
      x: 92.8,
      y: 301.6,
      width: 171.2,
      height: 24.2,
    }
  }
}

function getFieldPlacementOrNull(pdfDoc: PDFDocument, form: ReturnType<PDFDocument["getForm"]>, fieldName: string) {
  try {
    const field = form.getField(fieldName)
    const widget = field.acroField.getWidgets()[0]
    const rect = widget.getRectangle()
    const pageRef = widget.P()
    const pageIndex = pdfDoc.getPages().findIndex((page) => page.ref === pageRef)
    if (pageIndex < 0) return null
    return {
      page: pdfDoc.getPages()[pageIndex],
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }
  } catch {
    return null
  }
}

function getFieldPlacements(pdfDoc: PDFDocument, form: ReturnType<PDFDocument["getForm"]>, fieldName: string) {
  try {
    const field = form.getField(fieldName)
    return field.acroField.getWidgets().map((widget) => {
      const rect = widget.getRectangle()
      const pageRef = widget.P()
      const pageIndex = pdfDoc.getPages().findIndex((page) => page.ref === pageRef)
      return {
        page: pdfDoc.getPages()[Math.max(0, pageIndex)],
        pageIndex,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }
    })
  } catch {
    return []
  }
}

function drawFittedText(page: PDFPage, text: string, x: number, y: number, width: number, height: number, font: any) {
  const value = uppercase(text)
  if (!value) return
  let size = Math.min(10, Math.max(6.5, height * 0.58))
  while (font.widthOfTextAtSize(value, size) > width - 4 && size > 5.5) {
    size -= 0.25
  }
  page.drawText(value.slice(0, 120), {
    x: x + 2,
    y: y + Math.max(2.5, (height - size) / 2),
    size,
    color: rgb(0.05, 0.05, 0.05),
    font,
  })
}

function drawCombText(
  page: PDFPage | undefined,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: any,
  maxChars?: number,
) {
  if (!page) return
  const value = uppercase(text)
  if (!value) return
  const cellCount = Math.max(maxChars ?? value.length, 1)
  const chars = value.slice(0, cellCount).split("")
  const cellWidth = width / cellCount
  const size = Math.min(height * 0.62, cellWidth * 0.92, 10.5)
  chars.forEach((char, index) => {
    const charWidth = font.widthOfTextAtSize(char, size)
    page.drawText(char, {
      x: x + index * cellWidth + (cellWidth - charWidth) / 2,
      y: y + Math.max(2.5, (height - size) / 2),
      size,
      color: rgb(0.05, 0.05, 0.05),
      font,
    })
  })
}

function drawAddressText(page: PDFPage | undefined, text: string, x: number, y: number, width: number, height: number, font: any) {
  if (!page) return
  const value = uppercase(text)
  if (!value) return
  const cellCount = Math.max(20, Math.floor(width / Math.max(7.2, height * 0.48)))
  drawCombText(page, value, x, y, width, height, font, cellCount)
}

function collectMissingFields(canonical: Record<string, any>) {
  const required: Array<[string, string]> = [
    ["Business Name", "business_name"],
    ["Date of Commencement", "date_of_commencement"],
    ["Registered Office Digital Address", "registered_digital_address"],
    ["Registered Office House/Building/Flat", "registered_building"],
    ["Registered Office Street Name", "registered_street"],
    ["Registered Office City", "registered_city"],
    ["Registered Office District", "registered_district"],
    ["Registered Office Region", "registered_region"],
    ["Proprietor First Name", "first_name"],
    ["Proprietor Last Name", "last_name"],
    ["Date of Birth", "dob"],
    ["Ghana Card / National Identity Card", "ghana_card"],
    ["Proprietor Mobile Number", "proprietor_mobile_1"],
    ["Residential Digital Address", "residential_digital_address"],
    ["Residential House/Building/Flat", "residential_building"],
    ["Residential Street Name", "residential_street"],
    ["Residential City", "residential_city"],
    ["Residential District", "residential_district"],
    ["Residential Region", "residential_region"],
    ["Declaration Full Name", "declaration_full_name"],
  ]

  return required
    .filter(([, key]) => !clean(canonical[key]))
    .map(([label]) => label)
}

function drawMissingFieldsPage(pdfDoc: PDFDocument, missingFields: string[]) {
  if (missingFields.length === 0) return
  const page = pdfDoc.addPage([A4.width, A4.height])
  page.drawText("FORM A - INFORMATION NOT PROVIDED", {
    x: 50,
    y: A4.height - 60,
    size: 14,
    color: rgb(0.05, 0.05, 0.05),
  })
  page.drawText("Please request the applicant to provide the following missing section(s):", {
    x: 50,
    y: A4.height - 86,
    size: 10,
    color: rgb(0.12, 0.12, 0.12),
  })

  let y = A4.height - 120
  missingFields.forEach((field, index) => {
    if (y < 70) return
    page.drawText(`${index + 1}. ${field.toUpperCase()}`, {
      x: 62,
      y,
      size: 10,
      color: rgb(0.05, 0.05, 0.05),
    })
    y -= 20
  })
}

function drawAttachmentPage(pdfDoc: PDFDocument, images: { type: string; image: PDFImage }[]) {
  const cards = images.filter((img) => img.type !== "signature")
  if (cards.length === 0) return

  const page = pdfDoc.addPage([A4.width, A4.height])
  page.drawText("GHANA CARD ATTACHMENT", { x: 50, y: A4.height - 56, size: 14, color: rgb(0.05, 0.05, 0.05) })

  const slots = [
    { label: "Front", x: 100, y: 500, width: 395, height: 230 },
    { label: "Back", x: 100, y: 185, width: 395, height: 230 },
  ]

  cards.slice(0, 2).forEach(({ type, image }, index) => {
    const slot = slots[index]
    const { width, height } = fitImage(image, slot.width, slot.height)
    page.drawText(type.includes("back") ? "Ghana Card Back" : slot.label === "Front" ? "Ghana Card Front" : slot.label, {
      x: slot.x,
      y: slot.y + slot.height + 14,
      size: 11,
      color: rgb(0.1, 0.1, 0.1),
    })
    page.drawRectangle({
      x: slot.x - 4,
      y: slot.y - 4,
      width: slot.width + 8,
      height: slot.height + 8,
      borderColor: rgb(0.82, 0.82, 0.82),
      borderWidth: 0.75,
    })
    page.drawImage(image, {
      x: slot.x + (slot.width - width) / 2,
      y: slot.y + (slot.height - height) / 2,
      width,
      height,
    })
  })
}

async function buildPdf(submission: SubmissionRecord, images: FormImageRecord[], imageQuality: number) {
  const templatePath = path.join(process.cwd(), "public", "official-forms", "Form-A.pdf")
  if (!fs.existsSync(templatePath)) {
    throw new Error("PDF Template not found on server")
  }

  const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath))
  const form = pdfDoc.getForm()
  const canonical = mapCanonicalData(submission)
  const canonicalRecord = canonical as Record<string, any>

  fillWrappedFields(form, [
    "BUSINESS NAME 1",
    "BUSINESS NAME 2",
    "BUSINESS NAME 3",
    "BUSINESS NAME 4",
    "BUSINESS NAME 5",
    "BUSINESS NAME 6",
  ], canonical.business_name)

  const alternativeNames = [
    canonical.business_name_alt_1,
    canonical.business_name_alt_2,
    canonical.business_name_alt_3,
  ].filter(Boolean).join(" ")
  fillWrappedFields(form, [
    "BUSINESS NAME 7",
    "BUSINESS NAME 8",
    "BUSINESS NAME 9",
    "BUSINESS NAME 10",
    "BUSINESS NAME 11",
  ], alternativeNames)

  fillWrappedFields(form, [
    "ISIC CODE 4",
    "ISIC CODE 5",
    "ISIC CODE 6",
    "ISIC CODE 7",
    "ISIC CODE 8",
    "ISIC CODE 9",
    "ISIC CODE 10",
  ], canonical.business_activity_description)

  Object.entries(PDF_FIELDS).forEach(([key, fieldName]) => {
    if (typeof canonicalRecord[key] === "boolean") {
      setCheck(form, fieldName, canonicalRecord[key])
    } else {
      setText(form, fieldName, canonicalRecord[key])
    }
  })

  if (canonical.sector && SECTOR_FIELDS[canonical.sector]) {
    setCheck(form, SECTOR_FIELDS[canonical.sector], true)
  }

  const embeddedImages: { type: string; image: PDFImage }[] = []
  const supabase = getAdminClient()
  for (const image of images) {
    if (!image.image_url) continue
    try {
      const bytes = await fetchImageBytes(supabase, image.image_url)
      if (!bytes?.length) continue
      embeddedImages.push({
        type: image.image_type,
        image: await embedCompressedImage(pdfDoc, bytes, image.image_type, imageQuality),
      })
    } catch (error) {
      console.error("Failed to embed compliance image:", image.image_type, error)
    }
  }

  const signaturePlacement = getFieldPlacement(pdfDoc, form, "SIGNATURE SECTION")
  const criticalCombFields = {
    date_of_commencement: getFieldPlacementOrNull(pdfDoc, form, "DATE OF COMMENCEMENT"),
    dob:
      getFieldPlacementOrNull(pdfDoc, form, "DATE OF BIRTH (DOB)") ||
      getFieldPlacementOrNull(pdfDoc, form, "PROPRIETOR/PROPRIETRRESS (DATE OF BIRTH)"),
    ghana_card: getFieldPlacementOrNull(pdfDoc, form, "PROPRIETOR/PROPRIETRRESS (GHANA CARD)"),
    declaration_date: getFieldPlacementOrNull(pdfDoc, form, "Date (dd/mm/yyyy)"),
  }
  const addressPlacements = {
    registered_digital_address: getFieldPlacements(pdfDoc, form, "DIGITAL ADDRESS")[0],
    residential_digital_address:
      getFieldPlacementOrNull(pdfDoc, form, "RESIDENTIAL ADDRESS (DIGITAL ADDRESS)") ||
      getFieldPlacements(pdfDoc, form, "DIGITAL ADDRESS")[1],
    registered_building: getFieldPlacements(pdfDoc, form, "HOUSE/BUILDING/FLAT")[0],
    residential_building:
      getFieldPlacementOrNull(pdfDoc, form, "RESIDENTIAL ADDRESS (HOUSE/BUILDING/FLAT)") ||
      getFieldPlacements(pdfDoc, form, "HOUSE/BUILDING/FLAT")[1],
    registered_building_2: getFieldPlacements(pdfDoc, form, "HOUSE/BUILDING/FLAT 2")[0],
    residential_building_2:
      getFieldPlacementOrNull(pdfDoc, form, "RESIDENTIAL ADDRESS (HOUSE/BUILDING/FLAT) 2") ||
      getFieldPlacements(pdfDoc, form, "HOUSE/BUILDING/FLAT 2")[1],
    registered_street: getFieldPlacements(pdfDoc, form, "STREET NAME")[0],
    residential_street:
      getFieldPlacementOrNull(pdfDoc, form, "RESIDENTIAL ADDRESS (STREET NAME)") ||
      getFieldPlacements(pdfDoc, form, "STREET NAME")[1],
    registered_city: getFieldPlacements(pdfDoc, form, "CITY")[0],
    residential_city:
      getFieldPlacementOrNull(pdfDoc, form, "RESIDENTIAL ADDRESS (CITY)") ||
      getFieldPlacements(pdfDoc, form, "CITY")[1],
    other_digital_address: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (DIGITAL ADDRESS)"),
    other_building: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (HOUSE/BUILDING/FLAT)"),
    other_building_2: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (HOUSE/BUILDING/FLAT) 2"),
    other_street: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (STREET NAME)"),
    other_street_2: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (STREET NAME) 2"),
    other_city: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (CITY)"),
    other_district: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (DISTRICT)"),
    other_region: getFieldPlacementOrNull(pdfDoc, form, "OTHER PLACE OF BUSINESS (REGION)"),
    occupation: getFieldPlacementOrNull(pdfDoc, form, "PROPRIETOR/PROPRIETRRESS (OCCUPATION)"),
  }
  drawAttachmentPage(pdfDoc, embeddedImages)
  form.flatten()
  const overlayFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  Object.entries(addressPlacements).forEach(([key, placement]) => {
    if (!placement) return
    drawAddressText(
      placement.page,
      canonicalRecord[key],
      placement.x,
      placement.y,
      placement.width,
      placement.height,
      overlayFont,
    )
  })

  drawCombText(
    criticalCombFields.date_of_commencement?.page,
    canonical.date_of_commencement,
    criticalCombFields.date_of_commencement?.x ?? 0,
    criticalCombFields.date_of_commencement?.y ?? 0,
    criticalCombFields.date_of_commencement?.width ?? 0,
    criticalCombFields.date_of_commencement?.height ?? 0,
    overlayFont,
    10,
  )
  drawCombText(
    criticalCombFields.dob?.page,
    canonical.dob,
    criticalCombFields.dob?.x ?? 0,
    criticalCombFields.dob?.y ?? 0,
    criticalCombFields.dob?.width ?? 0,
    criticalCombFields.dob?.height ?? 0,
    overlayFont,
    10,
  )
  drawCombText(
    criticalCombFields.ghana_card?.page,
    canonical.ghana_card,
    criticalCombFields.ghana_card?.x ?? 0,
    criticalCombFields.ghana_card?.y ?? 0,
    criticalCombFields.ghana_card?.width ?? 0,
    criticalCombFields.ghana_card?.height ?? 0,
    overlayFont,
    11,
  )
  drawCombText(
    criticalCombFields.declaration_date?.page,
    canonical.declaration_date,
    criticalCombFields.declaration_date?.x ?? 0,
    criticalCombFields.declaration_date?.y ?? 0,
    criticalCombFields.declaration_date?.width ?? 0,
    criticalCombFields.declaration_date?.height ?? 0,
    overlayFont,
    10,
  )

  const signature = embeddedImages.find((img) => img.type === "signature")
  const signatureBox = {
    page: signaturePlacement.page,
    x: Math.max(0, signaturePlacement.x - 12),
    y: Math.max(0, signaturePlacement.y - 8),
    width: signaturePlacement.width + 65,
    height: signaturePlacement.height + 24,
  }
  if (signature) {
    const { width, height } = fitImage(signature.image, signatureBox.width, signatureBox.height)
    signatureBox.page.drawImage(signature.image, {
      x: signatureBox.x + (signatureBox.width - width) / 2,
      y: signatureBox.y + (signatureBox.height - height) / 2,
      width,
      height,
    })
  } else {
    const signatureText = uppercase(canonical.declaration_signature)
    signatureBox.page.drawText(signatureText, {
      x: signatureBox.x,
      y: signatureBox.y + 18,
      size: Math.min(22, Math.max(13, signatureBox.width / Math.max(signatureText.length, 1) * 2)),
      color: rgb(0.05, 0.05, 0.05),
      font: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    })
  }

  drawMissingFieldsPage(pdfDoc, collectMissingFields(canonicalRecord))

  return pdfDoc.save({ useObjectStreams: true })
}

export async function POST(req: Request) {
  try {
    const { submissionId, source } = await req.json()
    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const result = await getSubmission(supabase, submissionId, source)
    if (!result) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    let pdfBytes = await buildPdf(result.submission, result.images, 55)
    if (pdfBytes.byteLength > TARGET_MAX_BYTES && result.images.length > 0) {
      pdfBytes = await buildPdf(result.submission, result.images, 38)
    }

    const namePart = compactFilePart(
      firstValue(result.submission.formData, ["business_name", "businessName", "owner_name", "full_name"], result.submission.id),
    )

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Form_A_${namePart}.pdf"`,
        "X-PDF-Size-Bytes": String(pdfBytes.byteLength),
        "X-PDF-Under-2MB": String(pdfBytes.byteLength <= TARGET_MAX_BYTES),
      },
    })
  } catch (error: any) {
    console.error("PDF Generation Error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}
