import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
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
    const { admin_id, notes } = await request.json()
    const referralId = params.id

    const { error: updateError } = await supabase
      .from("referral_tracking")
      .update({
        admin_approval_status: "approved",
        admin_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", referralId)

    if (updateError) throw updateError

    const { error: auditError } = await supabase.from("invitation_audit_log").insert({
      admin_id,
      referral_id: referralId,
      action: "approved",
      reason: notes,
    })

    if (auditError) console.error("[v0] Audit log error:", auditError)

    return NextResponse.json({
      success: true,
      message: "Invitation approved successfully",
    })
  } catch (error) {
    console.error("[v0] Error approving invitation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to approve invitation",
      },
      { status: 500 },
    )
  }
}
