import { getAdminClient } from "@/lib/supabase-base"
import { VOUCHER_PRODUCTS, type EProduct } from "@/lib/voucher-products"

function mapRow(row: Record<string, unknown>): EProduct {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    image_url: String(row.image_url ?? ""),
    price: Number(row.price ?? 0),
    quantity: Number(row.quantity ?? 0),
    status: String(row.status ?? "published"),
  }
}

export async function fetchPublishedVoucherProducts(): Promise<EProduct[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("e_products")
    .select("id, title, description, image_url, price, quantity, status")
    .eq("status", "published")
    .order("title", { ascending: true })

  if (error) {
    console.error("fetchPublishedVoucherProducts:", error)
    return VOUCHER_PRODUCTS.filter((p) => p.status === "published")
  }

  if (!data?.length) {
    return VOUCHER_PRODUCTS.filter((p) => p.status === "published")
  }

  return data.map(mapRow)
}

export async function fetchAllVoucherProducts(): Promise<EProduct[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("e_products")
    .select("id, title, description, image_url, price, quantity, status, created_at, updated_at")
    .order("title", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function seedVoucherProductsFromDefaults(): Promise<{ inserted: number }> {
  const db = getAdminClient()
  const { count, error: countError } = await db
    .from("e_products")
    .select("id", { count: "exact", head: true })

  if (countError) throw new Error(countError.message)
  if ((count ?? 0) > 0) return { inserted: 0 }

  const rows = VOUCHER_PRODUCTS.map((p) => ({
    title: p.title,
    description: p.description,
    image_url: p.image_url,
    price: p.price,
    quantity: p.quantity,
    status: p.status,
  }))

  const { data, error } = await db.from("e_products").insert(rows).select("id")
  if (error) throw new Error(error.message)
  return { inserted: data?.length ?? 0 }
}
