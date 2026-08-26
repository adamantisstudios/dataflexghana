import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 4)
    const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 4), 100)

    const { data: products, error } = await supabase
      .from("wholesale_products")
      .select("*")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`[v0] API Error at ${timestamp}:`, error)
      return NextResponse.json({ products: [], timestamp })
    }


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
