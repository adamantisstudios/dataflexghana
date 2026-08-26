import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const MAX_BYTES = 10 * 1024 * 1024

const SERVICE_LABELS: Record<string, string> = {
  "resume-writing": "Resume Writing",
  "curriculum-vitae": "Curriculum Vitae",
  "business-presentation": "Business Presentation",
  "international-resume": "International Resume",
}

const ALLOWED_TYPES = new Set(Object.keys(SERVICE_LABELS))

async function uploadToBucket(
  db: ReturnType<typeof getAdminClient>,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  const { error } = await db.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  })
  if (error) {
    console.error(`[mobile/writing upload ${bucket}]`, error)
    return null
  }
  const { data } = db.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const db = getAdminClient()
  const { data, error } = await db
    .from("professional_writing_submissions")
    .select(
      "id, agent_id, service_type, cv_type, status, form_data, document_url, image_url, submitted_at, created_at, updated_at",
    )
    .eq("agent_id", agent.id)
    .order("submitted_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[mobile/writing GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    submissions: (data || []).map((row) => ({
      ...row,
      service_label: SERVICE_LABELS[String(row.service_type)] || row.service_type,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const contentType = request.headers.get("content-type") || ""
  const db = getAdminClient()

  let service_type = ""
  let form_data: Record<string, unknown> = {}
  let document_url: string | null = null
  let image_url: string | null = null
  let cv_type: string | null = null

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      service_type = String(form.get("service_type") || "").trim()
      const formDataRaw = form.get("form_data")
      if (typeof formDataRaw === "string" && formDataRaw.trim()) {
        try {
          form_data = JSON.parse(formDataRaw) as Record<string, unknown>
        } catch {
          return NextResponse.json({ error: "form_data must be valid JSON" }, { status: 400 })
        }
      }
      cv_type = form.get("cv_type") ? String(form.get("cv_type")).trim() : null

      const document = form.get("document")
      if (document instanceof File && document.size > 0) {
        if (document.size > MAX_BYTES) {
          return NextResponse.json({ error: "Document must be under 10MB" }, { status: 400 })
        }
        const ext = document.name.split(".").pop() || "pdf"
        const path = `${service_type || "writing"}-${agent.id}-${Date.now()}.${ext}`
        const buffer = Buffer.from(await document.arrayBuffer())
        document_url = await uploadToBucket(
          db,
          "professional-writing-documents",
          path,
          buffer,
          document.type || "application/octet-stream",
        )
        if (!document_url) {
          return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
        }
      }

      const image = form.get("image")
      if (image instanceof File && image.size > 0) {
        if (image.size > MAX_BYTES) {
          return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 })
        }
        if (!image.type.startsWith("image/")) {
          return NextResponse.json({ error: "Profile image must be an image file" }, { status: 400 })
        }
        const ext = image.name.split(".").pop() || "jpg"
        const path = `profile-${agent.id}-${Date.now()}.${ext}`
        const buffer = Buffer.from(await image.arrayBuffer())
        image_url = await uploadToBucket(db, "professional-writing-images", path, buffer, image.type)
        if (!image_url) {
          return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
        }
      }

      if (typeof form.get("document_url") === "string" && form.get("document_url")) {
        document_url = String(form.get("document_url"))
      }
      if (typeof form.get("image_url") === "string" && form.get("image_url")) {
        image_url = String(form.get("image_url"))
      }
    } else {
      const body = await request.json()
      service_type = String(body.service_type || "").trim()
      form_data =
        body.form_data && typeof body.form_data === "object"
          ? (body.form_data as Record<string, unknown>)
          : {}
      document_url = body.document_url ? String(body.document_url) : null
      image_url = body.image_url ? String(body.image_url) : null
      cv_type = body.cv_type ? String(body.cv_type) : null
    }
  } catch (e) {
    console.error("[mobile/writing POST parse]", e)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(service_type)) {
    return NextResponse.json(
      { error: "Invalid service_type. Use resume-writing, curriculum-vitae, business-presentation, or international-resume" },
      { status: 400 },
    )
  }

  if (service_type === "international-resume") {
    const fromForm = form_data.cvType ? String(form_data.cvType) : ""
    const resolved =
      cv_type ||
      (fromForm === "Others" && form_data.countryIfOthers
        ? String(form_data.countryIfOthers)
        : fromForm)
    if (!resolved) {
      return NextResponse.json({ error: "cv_type is required for international resume" }, { status: 400 })
    }
    cv_type = resolved
  }

  const row: Record<string, unknown> = {
    agent_id: agent.id,
    service_type,
    status: "pending",
    form_data,
    document_url,
    image_url,
    submitted_at: new Date().toISOString(),
  }
  if (cv_type) row.cv_type = cv_type

  const { data, error } = await db
    .from("professional_writing_submissions")
    .insert([row])
    .select(
      "id, agent_id, service_type, cv_type, status, form_data, document_url, image_url, submitted_at",
    )
    .maybeSingle()

  if (error) {
    console.error("[mobile/writing POST]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    submission: data ? { ...data, service_label: SERVICE_LABELS[service_type] } : data,
  })
}
