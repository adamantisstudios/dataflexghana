import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const formData = await request.formData()
  const file = formData.get("file")
  const imageType = String(formData.get("image_type") || "document").trim()

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${agent.id}_${imageType}_${Date.now()}.${ext}`
  const filePath = `compliance/${fileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const db = getAdminClient()
  const { error: uploadError } = await db.storage.from("compliance-images").upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    console.error("[mobile/compliance/upload]", uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicData } = db.storage.from("compliance-images").getPublicUrl(filePath)

  return NextResponse.json({
    success: true,
    image_type: imageType,
    image_url: publicData.publicUrl,
    path: filePath,
  })
}
