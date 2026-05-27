// lib/listing-package-utils.ts

export interface ListingFeatures {
    whatsapp_button: boolean;
    whatsapp_widget: boolean;
    whatsapp_group: boolean;
    social_share: boolean;
    featured_badge: boolean;
    priority: boolean;
    analytics: boolean;
    heatmap: boolean;
    reviews: boolean;
    qr_code: boolean;
    custom_slug: boolean;
    video_embed: boolean;
    email_support: boolean;
    blog_posts: number;        // 0 = none, positive = limit, -1 = unlimited
    banner_slider: boolean;
    sold_badge: boolean;
    inquiry_form: boolean;
    stock_counter: boolean;
    related_products: boolean;
    limited_offer_badge: boolean;
    product_boost: boolean;
    coupon_codes: boolean;
    affiliate_share_link: boolean;
    verified_seller_badge: boolean;
    pdf_brochure: boolean;
    max_images: number;
    max_listings?: number;      // for free tier, optional; for paid, uses listing_packages.max_listings
    max_banner_images?: number; // optional, for Ultimate
  }
  
  export function getDefaultFreeFeatures(): ListingFeatures {
    return {
      whatsapp_button: true,
      whatsapp_widget: true,
      whatsapp_group: false,
      social_share: false,
      featured_badge: false,
      priority: false,
      analytics: false,
      heatmap: false,
      reviews: false,
      qr_code: false,
      custom_slug: false,
      video_embed: false,
      email_support: false,
      blog_posts: 0,
      banner_slider: false,
      sold_badge: false,
      inquiry_form: false,
      stock_counter: false,
      related_products: false,
      limited_offer_badge: false,
      product_boost: false,
      coupon_codes: false,
      affiliate_share_link: false,
      verified_seller_badge: false,
      pdf_brochure: false,
      max_images: 1,
      max_listings: 5,
    };
  }
  
  const DEFAULT_STARTER_FEATURES: ListingFeatures = {
    whatsapp_button: false,
    whatsapp_widget: false,
    whatsapp_group: false,
    social_share: false,
    featured_badge: false,
    priority: false,
    analytics: false,
    heatmap: false,
    reviews: false,
    qr_code: false,
    custom_slug: false,
    video_embed: false,
    email_support: false,
    blog_posts: 0,
    banner_slider: false,
    sold_badge: false,
    inquiry_form: false,
    stock_counter: false,
    related_products: false,
    limited_offer_badge: false,
    product_boost: false,
    coupon_codes: false,
    affiliate_share_link: false,
    verified_seller_badge: false,
    pdf_brochure: false,
    max_images: 1,
    max_listings: 20,
  };
  
  const DEFAULT_GROWTH_FEATURES: ListingFeatures = {
    ...DEFAULT_STARTER_FEATURES,
    whatsapp_button: true,
    whatsapp_widget: true,
    social_share: true,
    analytics: true,
    reviews: true,
    qr_code: true,
    sold_badge: true,
    inquiry_form: true,
    stock_counter: true,
    related_products: true,
    affiliate_share_link: true,
    max_images: 2,
    blog_posts: 5,
    max_listings: 30,
  };
  
  const DEFAULT_ULTIMATE_FEATURES: ListingFeatures = {
    ...DEFAULT_STARTER_FEATURES,
    whatsapp_button: true,
    whatsapp_widget: true,
    whatsapp_group: true,
    social_share: true,
    featured_badge: true,
    priority: true,
    analytics: true,
    heatmap: true,
    reviews: true,
    qr_code: true,
    custom_slug: true,
    video_embed: true,
    email_support: true,
    blog_posts: -1,
    banner_slider: true,
    sold_badge: true,
    inquiry_form: true,
    stock_counter: true,
    related_products: true,
    limited_offer_badge: true,
    product_boost: true,
    coupon_codes: true,
    affiliate_share_link: true,
    verified_seller_badge: true,
    pdf_brochure: true,
    max_images: 4,
    max_listings: 60,
    max_banner_images: 3,
  };
  
  export function getPackageFeatures(
    packageRow: { features: any; name: string; max_listings?: number }
  ): ListingFeatures {
    if (packageRow.features) {
      // merge the stored JSON with the package's max_listings if not present in features
      const features = typeof packageRow.features === 'string'
        ? JSON.parse(packageRow.features)
        : packageRow.features;
      if (features.max_listings === undefined && packageRow.max_listings) {
        features.max_listings = packageRow.max_listings;
      }
      return features as ListingFeatures;
    }
    // backward compatibility
    switch (packageRow.name) {
      case 'Growth':
        return { ...DEFAULT_GROWTH_FEATURES };
      case 'Ultimate':
        return { ...DEFAULT_ULTIMATE_FEATURES };
      case 'Starter':
      default:
        return { ...DEFAULT_STARTER_FEATURES };
    }
  }
  
  export function getActiveAgentFeatures(
    subscription: { package: { features: any; name: string; max_listings?: number } } | null
  ): ListingFeatures {
    if (subscription && subscription.package) {
      return getPackageFeatures(subscription.package);
    }
    return getDefaultFreeFeatures();
  }