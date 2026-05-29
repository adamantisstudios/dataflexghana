import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Blog id is required" }, { status: 400 })
  }

  const db = getAdminClient()

  // Unpublish first so the post never appears on public pages even if hard delete fails
  const { error: unpublishError } = await db
    .from("blogs")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (unpublishError) {
    console.error("[admin/blogs DELETE] unpublish:", unpublishError)
    return NextResponse.json({ error: unpublishError.message }, { status: 500 })
  }

  const { error: deleteError } = await db.from("blogs").delete().eq("id", id)

  if (deleteError) {
    console.error("[admin/blogs DELETE]:", deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
