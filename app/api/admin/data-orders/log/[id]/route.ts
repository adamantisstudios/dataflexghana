import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 })
    }

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

    const { error } = await supabase
      .from("data_orders_log")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting data order log:", error)
      return NextResponse.json(
        { success: false, message: "Failed to delete order", error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Order deleted successfully" },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("[v0] API error deleting data order log:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
