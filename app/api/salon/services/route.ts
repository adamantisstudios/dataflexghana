import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

function formatService(service: Record<string, unknown>) {
  const categories = service.salon_categories as { name?: string } | null
  return {
    ...service,
    category_name: categories?.name || service.category_name || "",
    provider_contact: service.provider_contact || service.provider_phone || "",
    provider_social:
      service.provider_social ??
      (service.provider_social_media as { handles?: string })?.handles ??
      service.provider_social_media ??
      "",
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "500", 10)
    const category = searchParams.get("category")
    const supabase = getAdminClient()

    let query = supabase
      .from("salon_services")
      .select(`*, salon_categories(name)`)
      .eq("status", "active")

    if (category && category !== "all") {
      query = query.eq("category_id", parseInt(category, 10))
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit)

    if (error) {
      throw error
    }

    const formatted = (data || []).map((s) => formatService(s as Record<string, unknown>))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error("Services API Error:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from("salon_services")
      .insert([
        {
          service_name: body.service_name,
          service_code: body.service_code,
          description: body.description,
          category_id: body.category_id,
          base_price: body.base_price,
          express_price: body.express_price || null,
          duration_minutes: body.duration_minutes,
          provider_name: body.provider_name,
          provider_contact: body.provider_contact || body.provider_phone || null,
          provider_location: body.provider_location || null,
          provider_availability: body.provider_availability || null,
          provider_social_media: body.provider_social || body.provider_social_media || null,
          image_urls: body.image_urls || [],
          status: "active",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Service ID is required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const updateData: Record<string, unknown> = {
      service_name: body.service_name,
      service_code: body.service_code,
      description: body.description,
      category_id: body.category_id,
      base_price: body.base_price,
      express_price: body.express_price || null,
      duration_minutes: body.duration_minutes,
      provider_name: body.provider_name,
      provider_contact: body.provider_contact || body.provider_phone || null,
      provider_location: body.provider_location || null,
      provider_availability: body.provider_availability || null,
      provider_social_media: body.provider_social || body.provider_social_media || null,
      status: body.status || "active",
      updated_at: new Date().toISOString(),
    }

    if (body.image_urls) {
      updateData.image_urls = body.image_urls
    }

    const { data, error } = await supabase.from("salon_services").update(updateData).eq("id", body.id).select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const { error } = await supabase.from("salon_services").delete().eq("id", parseInt(id, 10))

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
