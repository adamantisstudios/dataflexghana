import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { isUuid } from "@/lib/storefront-utils"

export const dynamic = "force-dynamic"

const EMPTY_RESPONSE = {
  profile: null,
  bundles: [] as PublicBundle[],
  services: [] as PublicService[],
}

type PublicBundle = {
  id: string
  name: string
  provider: string
  size_gb: number
  base_price: number
  custom_margin: number
  retail_price: number
  image_url?: string | null
}

type PublicService = {
  id: string
  title: string
  cost: number
  description: string
  image_url: string | null
}

type PublicProfile = {
  store_name: string | null
  store_slug: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId: rawAgentId } = await params
    const agentId = rawAgentId?.trim()

    if (!agentId || !isUuid(agentId)) {
      return NextResponse.json(EMPTY_RESPONSE)
    }

    const db = getAdminClient()

    const { data: agent, error: agentError } = await db
      .from("agents")
      .select("id, deleted_at")
      .eq("id", agentId)
      .maybeSingle()

    if (agentError) {
      if (agentError.message?.includes("deleted_at")) {
        const { data: agentOnly } = await db.from("agents").select("id").eq("id", agentId).maybeSingle()
        if (!agentOnly) return NextResponse.json(EMPTY_RESPONSE)
      } else {
        console.error("public storefront agent lookup:", agentError)
        return NextResponse.json(EMPTY_RESPONSE)
      }
    } else if (!agent) {
      return NextResponse.json(EMPTY_RESPONSE)
    } else if (agent.deleted_at) {
      return NextResponse.json(EMPTY_RESPONSE)
    }

    const { data: profileRow, error: profileError } = await db
      .from("agent_store_profiles")
      .select(
        "store_name, store_slug, whatsapp_number, phone_number, primary_color, business_info",
      )
      .eq("agent_id", agentId)
      .maybeSingle()

    if (profileError) {
      console.error("public storefront profile:", profileError)
    }

    const profile: PublicProfile | null = profileRow
      ? {
          store_name: profileRow.store_name ?? null,
          store_slug: profileRow.store_slug ?? null,
          whatsapp_number: profileRow.whatsapp_number ?? null,
          phone_number: profileRow.phone_number ?? null,
          primary_color: profileRow.primary_color ?? null,
          business_info: profileRow.business_info ?? null,
        }
      : null

    const { data: settings, error: settingsError } = await db
      .from("agent_store_settings")
      .select("item_id, item_type, custom_margin")
      .eq("agent_id", agentId)
      .eq("is_visible", true)

    if (settingsError) {
      console.error("public storefront settings:", settingsError)
      return NextResponse.json({ profile, bundles: [], services: [] })
    }

    const visibleSettings = settings ?? []
    const bundleIds = visibleSettings
      .filter((s) => s.item_type === "data_bundle")
      .map((s) => s.item_id)
    const serviceIds = visibleSettings
      .filter((s) => s.item_type === "referral_service")
      .map((s) => s.item_id)

    const marginByBundleId = new Map(
      visibleSettings
        .filter((s) => s.item_type === "data_bundle")
        .map((s) => [s.item_id, Number(s.custom_margin ?? 0)]),
    )

    let bundles: PublicBundle[] = []

    if (bundleIds.length > 0) {
      const { data: bundleRows, error: bundlesError } = await db
        .from("data_bundles")
        .select("id, name, provider, size_gb, price, image_url, is_active")
        .in("id", bundleIds)
        .eq("is_active", true)

      if (bundlesError) {
        console.error("public storefront bundles:", bundlesError)
      } else {
        bundles = (bundleRows ?? []).map((b) => {
          const base_price = Number(b.price ?? 0)
          const custom_margin = marginByBundleId.get(b.id) ?? 0
          return {
            id: b.id,
            name: b.name,
            provider: b.provider,
            size_gb: Number(b.size_gb ?? 0),
            base_price,
            custom_margin,
            retail_price: base_price + custom_margin,
            image_url: b.image_url ?? null,
          }
        })
        bundles.sort((a, b) => a.provider.localeCompare(b.provider) || a.size_gb - b.size_gb)
      }
    }

    let services: PublicService[] = []

    if (serviceIds.length > 0) {
      const { data: serviceRows, error: servicesError } = await db
        .from("services")
        .select("id, title, description, image_url, image_urls, product_cost, commission_amount, service_type")
        .in("id", serviceIds)
        .eq("service_type", "referral")

      if (servicesError) {
        console.error("public storefront services:", servicesError)
      } else {
        services = (serviceRows ?? []).map((s) => {
          const images = (s.image_urls as string[] | null) || []
          const image_url = (s.image_url as string | null) || images[0] || null
          const cost = Number(s.product_cost ?? s.commission_amount ?? 0)
          return {
            id: s.id,
            title: s.title,
            cost,
            description: s.description ?? "",
            image_url,
          }
        })
        services.sort((a, b) => a.title.localeCompare(b.title))
      }
    }

    return NextResponse.json({
      profile,
      bundles,
      services,
    })
  } catch (error) {
    console.error("public storefront:", error)
    return NextResponse.json(EMPTY_RESPONSE)
  }
}
