-- Add features JSONB column to listing_packages
ALTER TABLE listing_packages ADD COLUMN IF NOT EXISTS features JSONB;

-- Update existing seed rows with feature defaults
UPDATE listing_packages SET features = '{
  "whatsapp_button": false,
  "whatsapp_widget": false,
  "whatsapp_group": false,
  "social_share": false,
  "featured_badge": false,
  "priority": false,
  "analytics": false,
  "heatmap": false,
  "reviews": false,
  "qr_code": false,
  "custom_slug": false,
  "video_embed": false,
  "email_support": false,
  "blog_posts": 0,
  "banner_slider": false,
  "sold_badge": false,
  "inquiry_form": false,
  "stock_counter": false,
  "related_products": false,
  "limited_offer_badge": false,
  "product_boost": false,
  "coupon_codes": false,
  "affiliate_share_link": false,
  "verified_seller_badge": false,
  "pdf_brochure": false,
  "max_images": 1
}'::jsonb WHERE name = 'Starter';

UPDATE listing_packages SET features = '{
  "whatsapp_button": true,
  "whatsapp_widget": true,
  "whatsapp_group": false,
  "social_share": true,
  "featured_badge": false,
  "priority": false,
  "analytics": true,
  "heatmap": false,
  "reviews": true,
  "qr_code": true,
  "custom_slug": false,
  "video_embed": false,
  "email_support": false,
  "blog_posts": 5,
  "banner_slider": false,
  "sold_badge": true,
  "inquiry_form": true,
  "stock_counter": true,
  "related_products": true,
  "limited_offer_badge": false,
  "product_boost": false,
  "coupon_codes": false,
  "affiliate_share_link": true,
  "verified_seller_badge": false,
  "pdf_brochure": false,
  "max_images": 2
}'::jsonb WHERE name = 'Growth';

UPDATE listing_packages SET features = '{
  "whatsapp_button": true,
  "whatsapp_widget": true,
  "whatsapp_group": true,
  "social_share": true,
  "featured_badge": true,
  "priority": true,
  "analytics": true,
  "heatmap": true,
  "reviews": true,
  "qr_code": true,
  "custom_slug": true,
  "video_embed": true,
  "email_support": true,
  "blog_posts": -1,
  "banner_slider": true,
  "sold_badge": true,
  "inquiry_form": true,
  "stock_counter": true,
  "related_products": true,
  "limited_offer_badge": true,
  "product_boost": true,
  "coupon_codes": true,
  "affiliate_share_link": true,
  "verified_seller_badge": true,
  "pdf_brochure": true,
  "max_images": 4,
  "max_banner_images": 3
}'::jsonb WHERE name = 'Ultimate';

-- New tables

CREATE TABLE IF NOT EXISTS storefront_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storefront_heatmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    x INT NOT NULL,
    y INT NOT NULL,
    clicks INT DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE
);

-- Enable RLS
ALTER TABLE storefront_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_heatmap ENABLE ROW LEVEL SECURITY;

-- Block direct client access (use service role via API)
DROP POLICY IF EXISTS "Block anon/authenticated" ON storefront_banners;
CREATE POLICY "Block anon/authenticated" ON storefront_banners AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated" ON agent_blog_posts;
CREATE POLICY "Block anon/authenticated" ON agent_blog_posts AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated" ON storefront_heatmap;
CREATE POLICY "Block anon/authenticated" ON storefront_heatmap AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Add to realtime publication (optional, for future realtime features)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'storefront_banners') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE storefront_banners;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'agent_blog_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_blog_posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'storefront_heatmap') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE storefront_heatmap;
  END IF;
END $$;