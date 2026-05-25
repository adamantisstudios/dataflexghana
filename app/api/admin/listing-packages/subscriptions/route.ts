import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { activateListingSubscription } from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    const action = String(body.action ?? "").trim()

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (action === "activate") {
      await activateListingSubscription(id)
      return NextResponse.json({ success: true })
    }

    if (action === "cancel") {
      const db = getAdminClient()
      await db.from("agent_listing_subscriptions").update({ status: "cancelled" }).eq("id", id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e) {
    console.error("[admin listing subscriptions]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    )
  }
}
