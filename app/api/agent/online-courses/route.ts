import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/** Public published courses for the agent mobile / dashboard online-courses tab. */
export async function GET() {
  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("online_courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("GET /api/agent/online-courses:", error)
      return NextResponse.json({ error: "Failed to load courses" }, { status: 500 })
    }

    return NextResponse.json({ success: true, courses: data || [] })
  } catch (e) {
    console.error("GET /api/agent/online-courses:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
