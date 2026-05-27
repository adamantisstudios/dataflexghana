import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { getAgentListingFeatures } from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const BUCKET = "storefront-banners"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const features = await getAgentListingFeatures(agentId)
    if (!features.banner_slider) {
      return NextResponse.json({ error: "Your package does not include banner slider" }, { status: 403 })
    }

    const maxBanners = Math.max(1, Number(features.max_banner_images ?? 3))
    const db = getAdminClient()
    const { count } = await db
      .from("storefront_banners")
      .select("id", { head: true, count: "exact" })
      .eq("agent_id", agentId)

    if ((count ?? 0) >= maxBanners) {
      return NextResponse.json(
        { error: `You can only upload up to ${maxBanners} banner images` },
        { status: 400 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    const ext = file.type.includes("png") ? "png" : "jpg"
    const filePath = `${agentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await db.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
      cacheControl: "31536000",
    })
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(filePath)
    const { data: row, error: insertError } = await db
      .from("storefront_banners")
      .insert({
        agent_id: agentId,
        image_url: urlData.publicUrl,
        order_index: count ?? 0,
      })
      .select("*")
      .single()
    if (insertError) {
      await db.storage.from(BUCKET).remove([filePath])
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: row })
  } catch (error) {
    console.error("[agent storefront banners POST]", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
