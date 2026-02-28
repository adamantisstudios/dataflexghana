import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
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

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "File must be audio" }, { status: 400 })
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
    const buffer = await file.arrayBuffer()

    const contentType = file.type || "audio/webm"

    const { data, error } = await supabaseAdmin.storage.from("teaching-media").upload(`audio/${fileName}`, buffer, {
      contentType,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase audio upload error:", error)
      return NextResponse.json({ error: `Failed to upload audio: ${error.message}` }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from("teaching-media").getPublicUrl(`audio/${fileName}`)

    return NextResponse.json({
      url: urlData.publicUrl,
      filename: file.name,
      path: `audio/${fileName}`,
      size: buffer.byteLength,
      type: contentType,
    })
  } catch (error) {
    console.error("[v0] Audio upload error:", error)
    return NextResponse.json(
      { error: `Failed to upload audio: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
