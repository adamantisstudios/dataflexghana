import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    const { admin_id, reason } = await request.json()
    const referralId = params.id

    console.log("[v0] Rejecting invitation:", referralId)

    const { error: updateError } = await supabase
      .from("referral_links")
      .update({
        admin_approval_status: "rejected",
        admin_rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referralId)

    if (updateError) throw updateError

    // Log the rejection action
    const { error: auditError } = await supabase.from("invitation_audit_log").insert({
      admin_id,
      referral_id: referralId,
      action: "rejected",
      reason,
    })

    if (auditError) console.error("[v0] Audit log error:", auditError)

    console.log("[v0] Invitation rejected successfully")

    return NextResponse.json({
      success: true,
      message: "Invitation rejected successfully",
    })
  } catch (error) {
    console.error("[v0] Error rejecting invitation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reject invitation",
      },
      { status: 500 },
    )
  }
}
