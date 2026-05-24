import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { error } = await db.from("video_comments").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Comment deleted" })
  } catch (error) {
    console.error("admin channel comment DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
