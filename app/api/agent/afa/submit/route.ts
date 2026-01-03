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
    console.log("[v0] AFA Submission Data:", data)
    const { agent_id, full_name, phone_number, ghana_card, location, occupation, notes, payment_instructions } = data

    // Validate required fields
    if (!full_name || !phone_number) {
      return NextResponse.json({ status: "error", message: "Full name and phone number are required" }, { status: 400 })
    }

    // Validate phone format (relaxed to any 10 digits)
    if (!/^\d{10}$/.test(phone_number)) {
      return NextResponse.json(
        { status: "error", message: "Invalid phone number format. Must be 10 digits" },
        { status: 400 },
      )
    }

    // Validate Ghana Card format
    const cardValue = ghana_card ? ghana_card.trim() : "NOT_PROVIDED"

    const paymentPin = generatePaymentPIN()

    // Insert into mtnafa_registrations table
    const { data: submission, error } = await supabase
      .from("mtnafa_registrations")
      .insert({
        agent_id: agent_id || null, // allow null agent_id
        full_name,
        phone_number,
        ghana_card: cardValue.toUpperCase(),
        location: location || "NOT_PROVIDED", // provide default location
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
