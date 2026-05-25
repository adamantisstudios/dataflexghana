-- Page view analytics (sandboxed)

CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    agent_id UUID REFERENCES agents(id),
    visitor_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_page_views_created_at ON analytics_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_path ON analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_agent_id ON analytics_page_views(agent_id);

ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON analytics_page_views;
CREATE POLICY "Block anon/authenticated" ON analytics_page_views AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
