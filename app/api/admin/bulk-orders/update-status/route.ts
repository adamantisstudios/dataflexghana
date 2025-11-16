import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }

    console.log("[v0] Updating bulk order status:", id, "to", status)

    const { error } = await supabase
      .from("bulk_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating bulk order status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Bulk order status updated successfully")
    return NextResponse.json({ success: true, message: "Status updated successfully" })
  } catch (error) {
    console.error("[v0] Error in update-status:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
