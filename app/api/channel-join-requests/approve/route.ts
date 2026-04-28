import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("channel_join_requests")
      .update({
        status: "approved",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Join request approved" })
  } catch (error: any) {
    console.error("[v0] Error approving join request:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
