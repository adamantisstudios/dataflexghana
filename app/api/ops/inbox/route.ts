import { type NextRequest, NextResponse } from "next/server"
import { authenticateOpsDevice } from "@/lib/ops/auth"
import { listOpsInbox } from "@/lib/ops/notify-admin-ops"

export const dynamic = "force-dynamic"

/**
 * GET /api/ops/inbox?since=&unacked_only=1&limit=100
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateOpsDevice(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get("since")
    const unackedOnly =
      searchParams.get("unacked_only") === "1" || searchParams.get("unackedOnly") === "true"
    const limit = Number(searchParams.get("limit") ?? 100)

    const items = await listOpsInbox({ since, unackedOnly, limit })

    return NextResponse.json({
      success: true,
      device_id: auth.device.id,
      count: items.length,
      unacked_count: items.filter((i) => i.requires_ack && !i.acked_at).length,
      items,
    })
  } catch (err) {
    console.error("[api/ops/inbox]", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
