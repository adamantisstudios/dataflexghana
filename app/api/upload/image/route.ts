import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    // Validate custom authentication from request headers
    const authToken = request.headers.get("x-agent-id")
    const agentPhone = request.headers.get("x-agent-phone")

    if (!authToken || !agentPhone) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication headers" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
    const buffer = await file.arrayBuffer()

    const { data, error } = await supabaseAdmin.storage.from("teaching-media").upload(`images/${fileName}`, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase image upload error:", error)
      return NextResponse.json({ error: `Failed to upload image: ${error.message}` }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from("teaching-media").getPublicUrl(`images/${fileName}`)

    return NextResponse.json({
      url: urlData.publicUrl,
      filename: file.name,
      path: `images/${fileName}`,
      size: buffer.byteLength,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    return NextResponse.json(
      { error: `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
