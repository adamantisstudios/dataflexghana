import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePaymentPIN } from "@/lib/pin-generator"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const data = await request.json()
    const { agent_id, full_name, phone_number, ghana_card, location, occupation, notes, payment_instructions } = data

    // Validate required fields
    if (!agent_id || !full_name || !phone_number || !ghana_card || !location) {
      return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 })
    }

    // Validate phone format (10 digits, starts with 0-5)
    if (!/^\d{10}$/.test(phone_number) || !/^0[2345]\d{8}$/.test(phone_number)) {
      return NextResponse.json({ status: "error", message: "Invalid phone number format" }, { status: 400 })
    }

    // Validate Ghana Card format
    if (!/^GHA-\d{10}-\d$/i.test(ghana_card)) {
      return NextResponse.json({ status: "error", message: "Invalid Ghana Card format" }, { status: 400 })
    }

    const paymentPin = generatePaymentPIN()

    // Insert into mtnafa_registrations table
    const { data: submission, error } = await supabase
      .from("mtnafa_registrations")
      .insert({
        agent_id,
        full_name,
        phone_number,
        ghana_card: ghana_card.toUpperCase(),
        location,
        occupation: occupation || null,
        notes: notes || null,
        status: "pending_admin_review",
        payment_required: true,
        payment_instructions,
        payment_pin: paymentPin,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ status: "error", message: "Failed to submit registration" }, { status: 500 })
    }

    // Create admin notification
    await supabase.from("admin_notifications").insert({
      type: "afa_submission",
      agent_id,
      submission_id: submission.id,
      preview: `MTN AFA Registration from ${full_name} (${phone_number}) - PIN: ${paymentPin}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      status: "success",
      submission_id: submission.id,
      payment_pin: paymentPin,
      message: "Registration submitted successfully",
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 })
  }
}
