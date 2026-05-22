import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
])

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only images (JPEG, PNG, WebP, GIF) and PDF are allowed" },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: "File must be 10MB or smaller" }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `grocery/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
    const buffer = await file.arrayBuffer()

    const db = getAdminClient()
    const { error } = await db.storage.from("teaching-media").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[api/grocery/upload]", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from("teaching-media").getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
      filename: file.name,
    })
  } catch (err) {
    console.error("[api/grocery/upload]", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
}
