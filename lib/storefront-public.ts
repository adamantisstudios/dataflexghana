import { getAdminClient } from "@/lib/supabase-base"
import { isUuid } from "@/lib/storefront-utils"
import {
  type PublicWholesaleProduct,
  type PublicComplianceForm,
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID,
  isComplianceFormSettingItemId,
  complianceFormAdminPrice,
} from "@/lib/storefront-catalog"

export type PublicBundle = {
  id: string
  name: string
  provider: string
  size_gb: number
  base_price: number
  custom_margin: number
  retail_price: number
  image_url?: string | null
}

export type PublicService = {
  id: string
  title: string
  cost: number
  description: string
  image_url: string | null
}

export type PublicProfile = {
  store_name: string | null
  store_slug: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
  whatsapp_channel_url?: string | null
  show_whatsapp_popup?: boolean
}

export type PublicStorefrontResponse = {
  profile: PublicProfile | null
  bundles: PublicBundle[]
  services: PublicService[]
  wholesaleProducts: PublicWholesaleProduct[]
  complianceForms: PublicComplianceForm[]
  unavailable?: boolean
}

const EMPTY_RESPONSE: PublicStorefrontResponse = {
  profile: null,
  bundles: [],
  services: [],
  wholesaleProducts: [],
  complianceForms: [],
}

/** Server-side payload for /api/storefront/public/[agentId] and /store/[segment] page. */
export async function getPublicStorefrontResponse(
  rawAgentId: string,
): Promise<PublicStorefrontResponse> {
  try {
    const agentId = rawAgentId?.trim()

    if (!agentId || !isUuid(agentId)) {
      return { ...EMPTY_RESPONSE }
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
        if (!agentOnly) return { ...EMPTY_RESPONSE }
      } else {
        console.error("public storefront agent lookup:", agentError)
        return { ...EMPTY_RESPONSE }
      }
    } else if (!agent) {
      return { ...EMPTY_RESPONSE, unavailable: true }
    } else if (agent.deleted_at) {
      return { ...EMPTY_RESPONSE, unavailable: true }
    }

    const { data: agentDetails } = await db
      .from("agents")
      .select("full_name, phone_number, momo_number, isapproved")
      .eq("id", agentId)
      .maybeSingle()

    if (!agentDetails) {
      return { ...EMPTY_RESPONSE, unavailable: true }
    }

    const { data: profileRow, error: profileError } = await db
      .from("agent_store_profiles")
      .select(
        "store_name, store_slug, whatsapp_number, phone_number, primary_color, business_info, whatsapp_channel_url, show_whatsapp_popup",
      )
      .eq("agent_id", agentId)
      .maybeSingle()

    if (profileError) {
      console.error("public storefront profile:", profileError)
    }

    const profile: PublicProfile = profileRow
      ? {
          store_name: profileRow.store_name ?? null,
          store_slug: profileRow.store_slug ?? null,
          whatsapp_number: profileRow.whatsapp_number ?? null,
          phone_number: profileRow.phone_number ?? null,
          primary_color: profileRow.primary_color ?? null,
          business_info: profileRow.business_info ?? null,
          whatsapp_channel_url: profileRow.whatsapp_channel_url ?? null,
          show_whatsapp_popup: profileRow.show_whatsapp_popup !== false,
        }
      : {
          store_name: agentDetails.full_name ?? "Data Store",
          store_slug: null,
          whatsapp_number: agentDetails.momo_number ?? agentDetails.phone_number ?? null,
          phone_number: agentDetails.phone_number ?? null,
          primary_color: "#3B82F6",
          business_info: null,
          whatsapp_channel_url: null,
          show_whatsapp_popup: true,
        }

    if (!agentDetails.isapproved) {
      return { profile, bundles: [], services: [], wholesaleProducts: [], complianceForms: [], unavailable: true }
    }

    const { data: settings, error: settingsError } = await db
      .from("agent_store_settings")
      .select("item_id, item_type, custom_margin")
      .eq("agent_id", agentId)
      .eq("is_visible", true)

    if (settingsError) {
      console.error("public storefront settings:", settingsError)
      return { profile, bundles: [], services: [], wholesaleProducts: [], complianceForms: [] }
    }

    const visibleSettings = settings ?? []
    const bundleIds = visibleSettings
      .filter((s) => s.item_type === "data_bundle")
      .map((s) => s.item_id)
    const serviceIds = visibleSettings
      .filter((s) => s.item_type === "referral_service")
      .map((s) => s.item_id)
    const wholesaleIds = visibleSettings
      .filter((s) => s.item_type === "wholesale_product")
      .map((s) => s.item_id)
    const hasCompliance = visibleSettings.some(
      (s) => s.item_type === "compliance_form" && isComplianceFormSettingItemId(s.item_id),
    )

    const marginByBundleId = new Map(
      visibleSettings
        .filter((s) => s.item_type === "data_bundle")
        .map((s) => [s.item_id, Number(s.custom_margin ?? 0)]),
    )
    const marginByWholesaleId = new Map(
      visibleSettings
        .filter((s) => s.item_type === "wholesale_product")
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

    let wholesaleProducts: PublicWholesaleProduct[] = []
    if (wholesaleIds.length > 0) {
      const { data: productRows, error: productsError } = await db
        .from("wholesale_products")
        .select("id, name, description, price, image_urls, category, is_active, quantity")
        .in("id", wholesaleIds)
        .eq("is_active", true)

      if (productsError) {
        console.error("public storefront wholesale:", productsError)
      } else {
        wholesaleProducts = (productRows ?? [])
          .filter((p) => Number(p.quantity ?? 0) > 0)
          .map((p) => {
            const base_price = Number(p.price ?? 0)
            const custom_margin = marginByWholesaleId.get(p.id) ?? 0
            const images = (p.image_urls as string[] | null) || []
            return {
              id: p.id,
              name: p.name,
              description: p.description ?? null,
              base_price,
              custom_margin,
              retail_price: base_price + custom_margin,
              image_url: images[0] || null,
              category: p.category ?? null,
            }
          })
        wholesaleProducts.sort((a, b) => a.name.localeCompare(b.name))
      }
    }

    const complianceForms: PublicComplianceForm[] = hasCompliance
      ? [
          {
            form_type: COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
            title: "Sole Proprietorship Registration",
            description:
              "Register your sole proprietorship business. Pay the registration fee to unlock the application form.",
            admin_price: complianceFormAdminPrice(),
          },
        ]
      : []

    return {
      profile,
      bundles,
      services,
      wholesaleProducts,
      complianceForms,
      unavailable: false,
    }
  } catch (error) {
    console.error("public storefront:", error)
    return { ...EMPTY_RESPONSE }
  }
}
