import { type NextRequest, NextResponse } from "next/server"
import { authenticateOpsDevice } from "@/lib/ops/auth"
import { ackOpsInboxItem } from "@/lib/ops/notify-admin-ops"

export const dynamic = "force-dynamic"

/**
 * POST /api/ops/inbox/[id]/ack
 * Clears a sticky / pestering notification after admin attends to it on the phone.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateOpsDevice(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }

    const result = await ackOpsInboxItem(id, auth.device.id)
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to acknowledge" },
        { status: result.error === "Inbox item not found" ? 404 : 500 },
      )
    }

    return NextResponse.json({ success: true, id, acked: true })
  } catch (err) {
    console.error("[api/ops/inbox/ack]", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
