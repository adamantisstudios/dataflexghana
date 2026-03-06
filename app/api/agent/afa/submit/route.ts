import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generatePaymentPIN } from "@/lib/pin-generator"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase admin client for API route
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const data = await request.json()
    console.log("[v0] AFA Submission Data:", data)
    const { agent_id, full_name, phone_number, ghana_card, date_of_birth, location, occupation, notes, payment_instructions } = data

    // Validate required fields
    if (!full_name || !phone_number) {
      console.error("[v0] Missing required fields - full_name:", full_name, "phone_number:", phone_number)
      return NextResponse.json({ status: "error", message: "Full name and phone number are required" }, { status: 400 })
    }

    // Normalize and validate phone number
    const normalizedPhone = phone_number.replace(/\D/g, "").slice(-10)
    if (!/^\d{10}$/.test(normalizedPhone)) {
      console.error("[v0] Invalid phone format - original:", phone_number, "normalized:", normalizedPhone)
      return NextResponse.json(
        { status: "error", message: "Invalid phone number format. Must be 10 digits" },
        { status: 400 },
      )
    }

    // Validate Ghana Card format
    const cardValue = ghana_card ? ghana_card.trim() : "NOT_PROVIDED"

    const paymentPin = generatePaymentPIN()

    console.log("[v0] Attempting to insert AFA registration with data:", {
      agent_id: agent_id || null,
      full_name,
      phone_number: normalizedPhone,
      ghana_card: cardValue.toUpperCase(),
      location: location || "NOT_PROVIDED",
    })

    // Insert into mtnafa_registrations table
    const { data: submission, error } = await supabase
      .from("mtnafa_registrations")
      .insert([
        {
          agent_id: agent_id || null,
          full_name: full_name.trim(),
          phone_number: normalizedPhone,
          ghana_card: cardValue.toUpperCase(),
          date_of_birth: date_of_birth || null,
          location: (location || "NOT_PROVIDED").trim(),
          occupation: occupation ? occupation.trim() : null,
          notes: notes ? notes.trim() : null,
          status: "pending_admin_review",
          payment_required: true,
          payment_instructions: payment_instructions || "",
          payment_pin: paymentPin,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Database insertion error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to submit registration: " + (error.message || "Database error"),
          details: error.details,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully inserted AFA registration:", submission.id)

    // Create admin notification - wrapped in try-catch since this is non-critical
    try {
      await supabase.from("admin_notifications").insert({
        type: "afa_submission",
        agent_id: agent_id || null,
        submission_id: submission.id,
        preview: `MTN AFA Registration from ${full_name} (${normalizedPhone}) - PIN: ${paymentPin}`,
        created_at: new Date().toISOString(),
      })
    } catch (notificationError) {
      console.warn("[v0] Failed to create notification, but registration was successful:", notificationError)
    }

    return NextResponse.json({
      status: "success",
      submission_id: submission.id,
      payment_pin: paymentPin,
      message: "Registration submitted successfully",
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
