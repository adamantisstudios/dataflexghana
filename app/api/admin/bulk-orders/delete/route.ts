import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return Response.json({ error: "Bulk order ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              console.error("Error setting cookies:", error)
            }
          },
        },
      },
    )

    // Delete the bulk order (items cascade delete via foreign key)
    const { error: deleteError } = await supabase.from("bulk_orders").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting bulk order:", deleteError)
      return Response.json({ error: "Failed to delete bulk order" }, { status: 500 })
    }

    return Response.json({ success: true, message: "Bulk order deleted successfully" })
  } catch (error) {
    console.error("Error in delete bulk order route:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
