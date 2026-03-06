import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    console.log(`[v0] API: Fetching latest wholesale products at ${timestamp}`)

    const { data: products, error } = await supabase
      .from("wholesale_products")
      .select("*")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("created_at", { ascending: false })
      .limit(4) // Increase limit to 4 products for 2x2 grid display

    if (error) {
      console.error(`[v0] API Error at ${timestamp}:`, error)
      return NextResponse.json({ products: [], timestamp })
    }

    console.log(`[v0] API: Found ${products?.length || 0} products at ${timestamp}`)
    console.log(
      "[v0] API: Product details:",
      products?.map((p) => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        quantity: p.quantity,
      })) || [],
    )

    const transformedProducts = (products || []).map((product) => ({
      ...product,
      image_urls: product.image_urls || ["/placeholder.svg"],
    }))

    const response = NextResponse.json({
      products: transformedProducts,
      timestamp,
      fetchedAt: timestamp,
      totalCount: transformedProducts.length,
    })

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    const timestamp = new Date().toISOString()
    console.error(`[v0] API Error at ${timestamp}:`, error)
    return NextResponse.json({ products: [], error: "Failed to fetch products", timestamp })
  }
}
