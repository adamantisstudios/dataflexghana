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

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
    const buffer = await file.arrayBuffer()

    const { data, error } = await supabaseAdmin.storage.from("teaching-media").upload(`documents/${fileName}`, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase document upload error:", error)
      return NextResponse.json({ error: `Failed to upload document: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("teaching-media").getPublicUrl(`documents/${fileName}`)

    return NextResponse.json({
      url: urlData.publicUrl,
      filename: file.name,
      fileType: file.type,
      path: `documents/${fileName}`,
    })
  } catch (error) {
    console.error("[v0] Document upload error:", error)
    return NextResponse.json(
      { error: `Failed to upload document: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
