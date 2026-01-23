import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, admin_id } = body

    if (!status || !admin_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Status and admin_id are required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Updating invitation status:", id, "to", status, "by admin:", admin_id)

    const { data: existingCredit, error: fetchError } = await supabase
      .from("referral_credits")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existingCredit) {
      console.error("[v0] Error fetching referral credit:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Referral credit not found",
        },
        { status: 404 },
      )
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed"],
      confirmed: ["credited"],
      credited: ["paid_out"],
      paid_out: [],
    }

    const allowedNextStatuses = validTransitions[existingCredit.status as string] || []
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${existingCredit.status} to ${status}`,
        },
        { status: 400 },
      )
    }

    const updateData: any = {
      status: status,
    }

    if (status === "confirmed") {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === "credited") {
      updateData.credited_at = new Date().toISOString()
    } else if (status === "paid_out") {
      updateData.paid_out_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("referral_credits")
      .update(updateData)
      .eq("id", id)
      .select()

    if (error) {
      console.error("[v0] Error updating referral credit:", error)
      throw error
    }

    console.log("[v0] Invitation status updated successfully:", data)

    try {
      await supabase.from("invitation_audit_log").insert({
        admin_id,
        referral_id: id,
        action: `status_changed_to_${status}`,
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.warn("[v0] Failed to create audit log:", logError)
      // Don't fail the entire request if audit log fails
    }

    return NextResponse.json({
      success: true,
      data: data?.[0],
      message: `Invitation status updated to ${status}`,
    })
  } catch (error) {
    console.error("[v0] Error updating invitation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update invitation",
      },
      { status: 500 },
    )
  }
}
