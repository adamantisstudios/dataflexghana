import { getAdminClient } from "@/lib/supabase-base"
import { isUuid } from "@/lib/storefront-utils"
import {
  type PublicWholesaleProduct,
  type PublicComplianceForm,
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
} from "@/lib/storefront-catalog"
import { getVisibleAdPackagesForAgent } from "@/lib/advertising-server"
import type { PublicAdPackage } from "@/lib/advertising-types"
import { listPublishedFarmListings } from "@/lib/farm-server"
import type { PublicFarmListing } from "@/lib/farm-types"
import { getVisibleWritingServicesForAgent } from "@/lib/writing-server"
import type { PublicWritingService } from "@/lib/writing-types"
import { getVisiblePropertiesForAgent, isAgentStorefrontSuspended } from "@/lib/property-server"
import type { PublicPropertyListing } from "@/lib/property-types"
import { getPublicInfluencerForAgent } from "@/lib/influencer-server"
import type { PublicInfluencerProfile } from "@/lib/influencer-types"
import { getPublicAgentProducts, type AgentProduct } from "@/lib/listing-packages-server"

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
  adPackages: PublicAdPackage[]
  farmListings: PublicFarmListing[]
  writingServices: PublicWritingService[]
  properties: PublicPropertyListing[]
  influencer: PublicInfluencerProfile | null
  listingProducts: AgentProduct[]
  /** Approved micro-influencer — premium storefront theme */
  isPremiumInfluencer?: boolean
  unavailable?: boolean
}

const EMPTY_RESPONSE: PublicStorefrontResponse = {
  profile: null,
  bundles: [],
  services: [],
  wholesaleProducts: [],
  complianceForms: [],
  adPackages: [],
  farmListings: [],
  writingServices: [],
  properties: [],
  influencer: null,
  listingProducts: [],
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
      .select("full_name, phone_number, momo_number, isapproved, isbanned")
      .eq("id", agentId)
      .maybeSingle()

    if (!agentDetails) {
      return { ...EMPTY_RESPONSE, unavailable: true }
    }

    if (agentDetails.isbanned) {
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
      return {
        profile,
        bundles: [],
        services: [],
        wholesaleProducts: [],
        complianceForms: [],
        adPackages: [],
        farmListings: [],
        writingServices: [],
        properties: [],
        influencer: null,
        unavailable: true,
      }
    }

    if (await isAgentStorefrontSuspended(agentId)) {
      return {
        profile,
        bundles: [],
        services: [],
        wholesaleProducts: [],
        complianceForms: [],
        adPackages: [],
        farmListings: [],
        writingServices: [],
        properties: [],
        influencer: null,
        unavailable: true,
      }
    }

    const { data: settings, error: settingsError } = await db
      .from("agent_store_settings")
      .select("item_id, item_type, custom_margin")
      .eq("agent_id", agentId)
      .eq("is_visible", true)

    if (settingsError) {
      console.error("public storefront settings:", settingsError)
      return {
        profile,
        bundles: [],
        services: [],
        wholesaleProducts: [],
        complianceForms: [],
        adPackages: [],
        farmListings: [],
        writingServices: [],
        properties: [],
        influencer: null,
      }
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
    const hasCompliance = visibleSettings.some((s) => s.item_type === "compliance_form")

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
              "Includes free nation-wide delivery of all documents to your doorstep within 14 working days. Fill forms easily, sign and submit securely.",
            admin_price: 590,
          },
        ]
      : []

    let adPackages: PublicAdPackage[] = []
    try {
      adPackages = await getVisibleAdPackagesForAgent(agentId)
    } catch (adErr) {
      console.error("public storefront ad packages:", adErr)
    }

    let farmListings: PublicFarmListing[] = []
    try {
      farmListings = await listPublishedFarmListings({ agentId })
    } catch (farmErr) {
      console.error("public storefront farm listings:", farmErr)
    }

    let writingServices: PublicWritingService[] = []
    try {
      writingServices = await getVisibleWritingServicesForAgent(agentId)
    } catch (writingErr) {
      console.error("public storefront writing services:", writingErr)
    }

    let properties: PublicPropertyListing[] = []
    try {
      properties = await getVisiblePropertiesForAgent(agentId)
    } catch (propertyErr) {
      console.error("public storefront properties:", propertyErr)
    }

    let influencer: PublicInfluencerProfile | null = null
    let isPremiumInfluencer = false
    try {
      const { data: infRow } = await db
        .from("influencer_profiles")
        .select("approved")
        .eq("agent_id", agentId)
        .maybeSingle()
      isPremiumInfluencer = Boolean(infRow?.approved)
      influencer = await getPublicInfluencerForAgent(agentId)
    } catch (influencerErr) {
      console.error("public storefront influencer:", influencerErr)
    }

    let listingProducts: AgentProduct[] = []
    try {
      const listingPayload = await getPublicAgentProducts(agentId)
      listingProducts = listingPayload.products
    } catch (listingErr) {
      console.error("public storefront listing products:", listingErr)
    }

    return {
      profile,
      bundles,
      services,
      wholesaleProducts,
      complianceForms,
      adPackages,
      farmListings,
      writingServices,
      properties,
      influencer,
      listingProducts,
      isPremiumInfluencer,
      unavailable: false,
    }
  } catch (error) {
    console.error("public storefront:", error)
    return { ...EMPTY_RESPONSE }
  }
}
