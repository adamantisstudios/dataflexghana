import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase.from("salon_categories").select("*").order("name")

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: data || [], categories: data || [] })
  } catch (error) {
    console.error("Categories API Error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from("salon_categories")
      .insert([{ name: body.name, description: body.description }])
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ data: data?.[0] })
  } catch (error) {
    console.error("Category Creation Error:", error)
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 400 })
  }
}
