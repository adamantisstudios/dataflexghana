import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { compressListingProductImage } from "@/lib/listing-product-image"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const BUCKET = "teaching-media"

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  if (user.role !== "agent") {
    return NextResponse.json({ error: "Agents only" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const { buffer } = await compressListingProductImage(file)
    const path = `listing-products/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const db = getAdminClient()

    const { error } = await db.storage.from(BUCKET).upload(`images/${path}`, buffer, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(`images/${path}`)
    return NextResponse.json({ success: true, url: urlData.publicUrl, path: `images/${path}` })
  } catch (err) {
    console.error("[listing-products upload]", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
})
