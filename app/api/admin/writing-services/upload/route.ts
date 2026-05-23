import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const BUCKET = "writing-documents"
const MAX_BYTES = 15 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const orderId = String(formData.get("order_id") ?? "").trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "File must be under 15MB" }, { status: 400 })
    }

    const mime = file.type || "application/pdf"
    if (!mime.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ success: false, error: "Only PDF files are allowed" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const prefix = orderId ? `completed/${orderId}` : "completed"
    const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`

    const db = getAdminClient()
    const { error: uploadError } = await db.storage.from(BUCKET).upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
}
