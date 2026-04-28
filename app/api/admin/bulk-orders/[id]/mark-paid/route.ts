import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const data = await request.json()
    const { admin_id } = data

    // Update bulk order
    const { error } = await supabase
      .from("bulk_orders")
      .update({
        status: "paid",
        admin_processed_by: admin_id,
        admin_processed_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (error) throw error

    return NextResponse.json({
      status: "success",
      message: "Bulk order marked as paid",
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 })
  }
}
