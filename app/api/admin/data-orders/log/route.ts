import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
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
    
    console.log("[v0] Received request to data-orders log endpoint:", JSON.stringify(data, null, 2))

    // Validate required fields - only the fields that match the schema
    if (!data.network) {
      console.error("[v0] Missing network field")
      return NextResponse.json(
        { success: false, message: "Missing network field" },
        { status: 400 }
      )
    }
    if (!data.data_bundle) {
      console.error("[v0] Missing data_bundle field")
      return NextResponse.json(
        { success: false, message: "Missing data_bundle field" },
        { status: 400 }
      )
    }
    if (!data.amount) {
      console.error("[v0] Missing amount field")
      return NextResponse.json(
        { success: false, message: "Missing amount field" },
        { status: 400 }
      )
    }
    if (!data.phone_number) {
      console.error("[v0] Missing phone_number field")
      return NextResponse.json(
        { success: false, message: "Missing phone_number field" },
        { status: 400 }
      )
    }
    if (!data.reference_code) {
      console.error("[v0] Missing reference_code field")
      return NextResponse.json(
        { success: false, message: "Missing reference_code field" },
        { status: 400 }
      )
    }
    if (!data.payment_method) {
      console.error("[v0] Missing payment_method field")
      return NextResponse.json(
        { success: false, message: "Missing payment_method field" },
        { status: 400 }
      )
    }

    console.log("[v0] All required fields validated. Processing data bundle order...")

    // Only insert the exact fields that exist in the schema
    const insertData = {
      network: data.network,
      data_bundle: data.data_bundle,
      amount: parseFloat(data.amount),
      phone_number: data.phone_number,
      reference_code: data.reference_code,
      payment_method: data.payment_method,
    }

    console.log("[v0] Insert data prepared:", JSON.stringify(insertData, null, 2))

    // Insert into database using service role
    const { data: result, error } = await supabase
      .from("data_orders_log")
      .insert([insertData])
      .select()

    if (error) {
      console.error("[v0] Supabase insert error:", JSON.stringify(error, null, 2))
      return NextResponse.json(
        { success: false, message: "Failed to log order", error: error.message },
        { status: 500 }
      )
    }

    console.log("[v0] Order successfully logged to database:", JSON.stringify(result, null, 2))
    return NextResponse.json(
      { success: true, message: "Order logged successfully", data: result?.[0] },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] API error logging data order:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred", details: error },
      { status: 500 }
    )
  }
}
