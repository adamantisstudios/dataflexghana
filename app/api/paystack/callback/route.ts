import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

interface PaystackMetadata {
  phone: string
  reference: string
  service: string
  timestamp: string
}

export async function GET(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY environment variable is not set")
      return NextResponse.redirect(
        new URL(
          "/no-registration?payment=failed&message=Payment service is not properly configured",
          request.url,
        ),
      )
    }

    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.redirect(
        new URL("/no-registration?payment=failed&message=No payment reference provided", request.url),
      )
    }

    // Verify payment with Paystack
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Paystack verification failed:", data)
      return NextResponse.redirect(
        new URL(
          `/no-registration?payment=failed&message=${encodeURIComponent(data.message || "Payment verification failed")}`,
          request.url,
        ),
      )
    }

    if (data.data.status !== "success") {
      return NextResponse.redirect(
        new URL(
          `/no-registration?payment=failed&message=${encodeURIComponent("Payment was not successful")}`,
          request.url,
        ),
      )
    }

    const metadata = data.data.metadata as PaystackMetadata
    const amount = data.data.amount / 100 // Convert from pesewas to cedis

    // Store payment record in database
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      )

      const { error: insertError } = await supabase.from("paystack_payments").insert([
        {
          reference: reference,
          amount: amount,
          phone: metadata.phone,
          service: metadata.service,
          status: "completed",
          paystack_reference: data.data.reference,
          paystack_customer_code: data.data.customer.customer_code,
          metadata: metadata,
          created_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Error storing payment record:", insertError)
        // Continue anyway - payment was successful
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue - payment was still successful
    }

    // Prepare WhatsApp message with payment details
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    const whatsappMessage = `DATA BUNDLE ORDER

${metadata.service}
Phone Number: ${metadata.phone}

💳 PAYMENT REFERENCE: ${reference}

✅ PAYMENT CONFIRMED via Paystack
Amount Paid: ₵${amount.toFixed(2)}

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

⏱️ PROCESSING TIME: Data processing and delivery takes 10-30 minutes after payment confirmation.

Please process this order.`

    const encodedMessage = encodeURIComponent(whatsappMessage)
    const whatsappNumber = "233242799990" // WhatsApp number

    // Redirect to WhatsApp with payment confirmation
    return NextResponse.redirect(
      new URL(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, request.url),
    )
  } catch (error) {
    console.error("Paystack callback error:", error)
    return NextResponse.redirect(
      new URL(
        `/no-registration?payment=failed&message=${encodeURIComponent("An error occurred during payment verification")}`,
        request.url,
      ),
    )
  }
}
