import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase.from("fashion_categories").select("*").order("name")

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error("Error fetching fashion categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}
