import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .in("status", ["Published", "Featured"])
      .eq("is_approved", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ properties: data || [] })
  } catch (error) {
    console.error("public properties:", error)
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 })
  }
}
