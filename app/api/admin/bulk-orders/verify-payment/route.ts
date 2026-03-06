import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
    const { order_id, verified } = data

    if (!order_id) {
      return NextResponse.json(
        { status: "error", message: "order_id is required" },
        { status: 400 }
      )
    }

    const updateData = verified
      ? {
          payment_verified: true,
          payment_verified_at: new Date().toISOString(),
        }
      : {
          payment_verified: false,
          payment_verified_at: null,
        }

    const { data: updated, error } = await supabase
      .from("bulk_orders")
      .update(updateData)
      .eq("id", order_id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Payment verification error:", error)
      return NextResponse.json(
        { status: "error", message: "Failed to verify payment" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "success",
      message: verified ? "Payment marked as verified" : "Payment verification removed",
      data: updated,
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { status: "error", message: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
