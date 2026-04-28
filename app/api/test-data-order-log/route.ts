import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

/**
 * TEST ENDPOINT - Remove after verification
 * This endpoint tests the data order logging functionality
 */
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

    console.log("[v0] TEST: Creating test data order record")

    const testData = {
      paying_pin: "TEST-" + Date.now(),
      beneficiary_number: "0551234567",
      data_bundle: "1GB Test Bundle",
      network: "MTN",
      quantity: 1,
      amount: 50,
      phone_number: "0551234567",
    }

    console.log("[v0] TEST: Inserting test data:", testData)

    const { data: result, error } = await supabase
      .from("data_orders_log")
      .insert([testData])
      .select()

    if (error) {
      console.error("[v0] TEST: Insert error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Database insert failed",
          error: error.message,
          details: error,
        },
        { status: 500 }
      )
    }

    console.log("[v0] TEST: Insert successful:", result)

    // Now verify we can read it back
    const { data: verifyData, error: verifyError } = await supabase
      .from("data_orders_log")
      .select("*")
      .eq("paying_pin", testData.paying_pin)
      .single()

    if (verifyError) {
      console.error("[v0] TEST: Verification read error:", verifyError)
      return NextResponse.json(
        {
          success: false,
          message: "Insert successful but verification read failed",
          insertResult: result,
          verifyError: verifyError.message,
        },
        { status: 500 }
      )
    }

    console.log("[v0] TEST: Verification successful:", verifyData)

    return NextResponse.json(
      {
        success: true,
        message: "Test data order logged successfully and verified",
        insertedRecord: result?.[0],
        verifiedRecord: verifyData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] TEST: API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test failed with error",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    console.log("[v0] TEST: Fetching all data orders")

    const { data, error, count } = await supabase
      .from("data_orders_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] TEST: Fetch error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Fetch failed",
          error: error.message,
        },
        { status: 500 }
      )
    }

    console.log("[v0] TEST: Fetch successful, found", count, "records")

    return NextResponse.json(
      {
        success: true,
        message: "Data orders fetched successfully",
        count: count || 0,
        records: data || [],
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] TEST: API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test failed with error",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
