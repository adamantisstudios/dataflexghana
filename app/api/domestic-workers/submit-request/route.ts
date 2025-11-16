import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const body = await request.json()

    const { error } = await supabase.from("domestic_workers_client_requests").insert([body])

    if (error) {
      console.error("Supabase error:", error)
      return Response.json({ message: error.message || "Failed to submit request" }, { status: 400 })
    }

    return Response.json({ success: true, message: "Request submitted successfully" })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
