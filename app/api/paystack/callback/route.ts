import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logAuditFromRequest } from "@/lib/audit-logger"
import {
  buildAdminWhatsAppUrl,
  extractOrderDetailsFromPaystackMetadata,
  formatNoRegistrationDataBundleMessage,
  isNoRegistrationPaystackMetadata,
} from "@/lib/no-registration-order-whatsapp"
import {
  AGENT_REGISTRATION_PAYMENT_TYPE,
  isAgentRegistrationPaystackMetadata,
} from "@/lib/paystack-registration"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

type PaystackMetadata = Record<string, unknown> & {
  phone?: string
  reference?: string
  service?: string
  timestamp?: string
  source?: string
  order_type?: string
  orderNetwork?: string
  orderDataBundle?: string
  registration_type?: string
}

function flattenPaystackMetadata(raw: unknown): PaystackMetadata {
  if (!raw || typeof raw !== "object") return {}
  const meta = { ...(raw as PaystackMetadata) }

  const customFields = (raw as { custom_fields?: Array<{ variable_name?: string; value?: string }> })
    .custom_fields
  if (Array.isArray(customFields)) {
    for (const field of customFields) {
      if (field.variable_name && field.value != null && meta[field.variable_name] == null) {
        meta[field.variable_name] = field.value
      }
    }
  }

  return meta
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

    const metadata = flattenPaystackMetadata(data.data.metadata || {})
    const amount = data.data.amount / 100

    if (isAgentRegistrationPaystackMetadata(metadata)) {
      const agentName = String(metadata.agent_name || "")
      const agentEmail = String(metadata.email || "")

      await logAuditFromRequest(request, {
        actorType: "system",
        action: "payment_received",
        targetTable: "paystack_payments",
        targetId: reference,
        newData: {
          amount,
          phone: metadata.phone,
          registration_type: AGENT_REGISTRATION_PAYMENT_TYPE,
          payment_type: AGENT_REGISTRATION_PAYMENT_TYPE,
        },
      })

      const registerUrl = new URL("https://www.dataflexghana.com/agent/register")
      registerUrl.searchParams.set("payment", "success")
      registerUrl.searchParams.set("reference", reference)

      return NextResponse.redirect(registerUrl.toString(), 302)
    }

    const isNoRegistrationOrder =
      isNoRegistrationPaystackMetadata(metadata) ||
      String(metadata.service || "")
        .toLowerCase()
        .includes("data bundle")

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
          paystack_customer_code: data.data.customer?.customer_code,
          metadata: metadata,
          created_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Error storing payment record:", insertError)
      }

      if (isNoRegistrationOrder) {
        const orderDetails = extractOrderDetailsFromPaystackMetadata(metadata, reference, amount)
        const network = orderDetails.network
        const dataBundle = orderDetails.bundle

        const { error: dataOrderError } = await supabase.from("data_orders_log").insert([
          {
            network,
            data_bundle: dataBundle,
            amount,
            phone_number: orderDetails.phone,
            reference_code: String(metadata.reference || reference),
            payment_method: "paystack",
          },
        ])

        if (dataOrderError) {
          console.error("Error storing data bundle order log:", dataOrderError)
        }
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
    }

    await logAuditFromRequest(request, {
      actorType: "system",
      action: "payment_received",
      targetTable: "paystack_payments",
      targetId: reference,
      newData: {
        amount,
        phone: metadata.phone,
        service: metadata.service,
        source: metadata.source,
        order_type: metadata.order_type,
      },
    })

    const redirectUrl = new URL("/no-registration", request.url)
    redirectUrl.searchParams.set("payment", "success")
    redirectUrl.searchParams.set("reference", reference)
    redirectUrl.searchParams.set("amount", amount.toFixed(2))

    if (isNoRegistrationOrder) {
      const orderDetails = extractOrderDetailsFromPaystackMetadata(metadata, reference, amount)
      const whatsappMessage = formatNoRegistrationDataBundleMessage(orderDetails)
      const whatsappUrl = buildAdminWhatsAppUrl(whatsappMessage)

      redirectUrl.searchParams.set("whatsapp_url", whatsappUrl)
      redirectUrl.searchParams.set("phone", orderDetails.phone)
      redirectUrl.searchParams.set("network", orderDetails.network)
      redirectUrl.searchParams.set("bundle", orderDetails.bundle)
      redirectUrl.searchParams.set("service", orderDetails.bundle)
    } else if (metadata.phone) {
      redirectUrl.searchParams.set("phone", String(metadata.phone))
      if (metadata.service) redirectUrl.searchParams.set("service", String(metadata.service))
    }

    return NextResponse.redirect(redirectUrl)
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
