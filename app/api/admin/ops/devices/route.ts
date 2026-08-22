import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { createOpsDevice } from "@/lib/ops/auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/** List ops devices (no secrets). Admin only. */
export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const db = getAdminClient()
  const { data, error } = await db
    .from("ops_devices")
    .select("id, label, api_key_prefix, enabled, last_seen_at, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, devices: data ?? [] })
}

/**
 * Create a new ops device API key. Plaintext key returned once.
 * Body: { label?: string }
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const label = String(body.label ?? "payment-phone").trim() || "payment-phone"
    const created = await createOpsDevice(label)
    if (!created) {
      return NextResponse.json(
        { success: false, error: "Failed to create device (run migration 090?)" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      device_id: created.deviceId,
      api_key: created.plaintextKey,
      api_key_prefix: created.prefix,
      warning: "Store this API key now — it will not be shown again.",
    })
  } catch (err) {
    console.error("[api/admin/ops/devices]", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
