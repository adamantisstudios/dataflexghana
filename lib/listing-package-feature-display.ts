import type { ListingFeatures } from "@/lib/listing-package-utils"

export type FeatureGroup = { label: string; items: string[] }

export function getEnabledFeatureGroups(features: ListingFeatures): FeatureGroup[] {
  const groups: FeatureGroup[] = [
    { label: "Storefront", items: [] },
    { label: "Product tools", items: [] },
    { label: "Promotion", items: [] },
    { label: "Extras", items: [] },
  ]

  const g = (i: number, text: string) => {
    groups[i].items.push(text)
  }

  if (features.whatsapp_button) g(0, "WhatsApp buy button")
  if (features.whatsapp_widget) g(0, "WhatsApp floating widget")
  if (features.social_share) g(0, "Social share buttons")
  if (features.whatsapp_group) g(0, "WhatsApp group link")

  const maxImg = Number(features.max_images) || 1
  g(1, `${maxImg} image${maxImg !== 1 ? "s" : ""} per product`)
  if (features.video_embed) g(1, "Video embed")
  if (features.qr_code) g(1, "QR code on product")
  if (features.reviews) g(1, "Reviews & ratings")
  if (features.stock_counter) g(1, "Stock counter")
  if (features.related_products) g(1, "Related products")
  if (features.inquiry_form) g(1, "Inquiry form")
  if (features.pdf_brochure) g(1, "PDF brochure")

  if (features.featured_badge) g(2, "Featured badge")
  if (features.priority) g(2, "Priority placement")
  if (features.limited_offer_badge) g(2, "Limited-time offers")
  if (features.product_boost) g(2, "Product boost")
  if (features.coupon_codes) g(2, "Coupon codes")
  if (features.sold_badge) g(2, "Sold badge")
  if (features.affiliate_share_link) g(2, "Share & earn link")

  if (features.analytics) g(3, "Listing analytics")
  if (features.heatmap) g(3, "Click heatmap")
  const blog = Number(features.blog_posts ?? 0)
  if (blog > 0) g(3, blog === -1 ? "Unlimited blog posts" : `${blog} blog posts`)
  if (features.banner_slider) {
    const banners = Number(features.max_banner_images ?? 3)
    g(3, `Homepage banner slider (${banners} images)`)
  }
  if (features.email_support) g(3, "Email support")
  if (features.custom_slug) g(3, "Custom storefront slug")
  if (features.verified_seller_badge) g(3, "Verified seller badge")

  return groups.filter((group) => group.items.length > 0)
}
