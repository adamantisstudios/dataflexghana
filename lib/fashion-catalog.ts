/** Shared fashion product shape for web + mobile APIs. */
export function formatFashionProduct(p: Record<string, unknown>) {
  let timelineDays = (p.estimated_timeline_days as number) || 0
  if (!timelineDays && p.completion_time) {
    const match = String(p.completion_time).match(/\d+/)
    timelineDays = match ? parseInt(match[0], 10) : 0
  }

  const categories = p.fashion_categories as { name?: string } | null

  return {
    id: p.id,
    product_name: p.title,
    product_code: p.product_code || `PROD-${p.id}`,
    description: p.description,
    category_id: p.category_id,
    category_name: categories?.name || "Unknown",
    base_price: parseFloat(String(p.base_price)),
    fabric_cost_included: p.include_fabric_cost,
    completion_time: `${timelineDays} days`,
    estimated_timeline_days: timelineDays,
    express_charge: parseFloat(String(p.express_sewing_charge || p.express_charge || 0)),
    commission_amount: parseFloat(String(p.commission_amount || 0)),
    image_urls: (p.image_urls as string[]) || [],
    image_paths: (p.image_paths as string[]) || [],
    status: p.status,
    created_at: p.created_at,
  }
}

export const FASHION_ASSET_BASE = "https://www.dataflexghana.com"
