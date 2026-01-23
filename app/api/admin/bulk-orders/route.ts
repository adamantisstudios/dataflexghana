import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Get AFA submissions
    let afaQuery = supabase.from("mtnafa_registrations").select("*, agents(id, full_name, phone_number)")

    if (status && status !== "all") {
      afaQuery = afaQuery.eq("status", status)
    }

    const { data: afaData, error: afaError } = await afaQuery

    if (afaError) throw afaError

    // Get Bulk Orders
    let bulkQuery = supabase.from("bulk_orders").select("*, agents(id, full_name, phone_number)")

    if (status && status !== "all") {
      bulkQuery = bulkQuery.eq("status", status)
    }

    const { data: bulkData, error: bulkError } = await bulkQuery

    if (bulkError) throw bulkError

    return NextResponse.json({
      status: "success",
      afaSubmissions: afaData || [],
      bulkOrders: bulkData || [],
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 })
  }
}
