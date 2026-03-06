import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

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

    // Fetch all data orders from the data_orders_log table
    console.log("[v0] Fetching data orders from data_orders_log table")
    const { data, error, count } = await supabase
      .from("data_orders_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error fetching data orders log:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch data orders log", error: error.message },
        { status: 500 }
      )
    }

    console.log("[v0] Successfully fetched data orders log:", {
      count: count || 0,
      dataLength: data?.length || 0,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Data orders log fetched successfully",
        data: data || [],
        count: count || 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] API error fetching data orders log:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred", error: error.message },
      { status: 500 }
    )
  }
}
