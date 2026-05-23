import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import sharp from "sharp"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const BUCKET = "farm-produce"
const MAX_WIDTH = 1200

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, and WebP images are allowed (no videos)" },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: "Image must be 8MB or smaller" }, { status: 400 })
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const compressed = await sharp(inputBuffer)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const db = getAdminClient()

    const { error } = await db.storage.from(BUCKET).upload(path, compressed, {
      contentType: "image/webp",
      upsert: false,
    })

    if (error) {
      console.error("[farmers/upload-photo]", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
    })
  } catch (err) {
    console.error("[farmers/upload-photo]", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
}
