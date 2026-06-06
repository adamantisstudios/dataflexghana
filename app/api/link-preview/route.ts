import { type NextRequest, NextResponse } from "next/server"
import { isBlockedIP, CACHE_CONFIG } from "@/lib/link-preview-cache"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

interface CachedPreview {
  id: string
  url: string
  title: string
  description: string
  image?: string
  domain: string
  cached_at: string
  expires_at: string
  fetch_error?: string
}

async function getCachedPreview(url: string): Promise<CachedPreview | null> {
  try {
    const { data, error } = await supabase
      .from("link_preview_cache")
      .select("*")
      .eq("url", url)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching cached preview:", error)
    }

    return data || null
  } catch (error) {
    console.error("[v0] Error in getCachedPreview:", error)
    return null
  }
}

async function setCachedPreview(preview: Omit<CachedPreview, "id" | "cached_at" | "expires_at">) {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CACHE_CONFIG.TTL_DAYS * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from("link_preview_cache").upsert(
      {
        url: preview.url,
        title: preview.title,
        description: preview.description,
        image: preview.image,
        domain: preview.domain,
        fetch_error: preview.fetch_error,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "url" },
    )

    if (error) {
      console.error("[v0] Error caching preview:", error)
    }
  } catch (error) {
    console.error("[v0] Error in setCachedPreview:", error)
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
}

function extractMetaContent(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1])
  }
  return undefined
}

function resolvePreviewImage(image: string | undefined, pageUrl: URL): string | undefined {
  if (!image) return undefined
  try {
    return new URL(decodeHtmlEntities(image), pageUrl).toString()
  } catch {
    return undefined
  }
}

async function fetchLinkPreview(url: string): Promise<CachedPreview | null> {
  try {
    // Check cache first
    const cached = await getCachedPreview(url)
    if (cached) {
      return cached
    }

    // Validate URL
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      console.error("[v0] Invalid URL:", url)
      return null
    }

    // SSRF protection
    if (isBlockedIP(urlObj.hostname)) {
      console.warn(`[v0] Blocked request to private IP: ${urlObj.hostname}`)
      return null
    }

    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CACHE_CONFIG.TIMEOUT_SECONDS * 1000)

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("[v0] Fetch error:", fetchError)

      const preview: Omit<CachedPreview, "id" | "cached_at" | "expires_at"> = {
        url,
        title: urlObj.hostname,
        description: "Click to open link",
        domain: urlObj.hostname,
        fetch_error: fetchError instanceof Error ? fetchError.message : "Fetch failed",
      }
      await setCachedPreview(preview)
      return { ...preview, id: "", cached_at: "", expires_at: "" }
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      const preview: Omit<CachedPreview, "id" | "cached_at" | "expires_at"> = {
        url,
        title: urlObj.hostname,
        description: "Click to open link",
        domain: urlObj.hostname,
        fetch_error: `HTTP ${response.status}`,
      }
      await setCachedPreview(preview)
      return { ...preview, id: "", cached_at: "", expires_at: "" }
    }

    // Check content length
    const contentLength = response.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > CACHE_CONFIG.MAX_RESPONSE_SIZE_MB * 1024 * 1024) {
      console.warn(`[v0] Response too large: ${contentLength} bytes`)
      const preview: Omit<CachedPreview, "id" | "cached_at" | "expires_at"> = {
        url,
        title: urlObj.hostname,
        description: "Click to open link",
        domain: urlObj.hostname,
        fetch_error: "Response too large",
      }
      await setCachedPreview(preview)
      return { ...preview, id: "", cached_at: "", expires_at: "" }
    }

    let html: string
    try {
      html = await response.text()
    } catch (textError) {
      console.error("[v0] Error reading response text:", textError)
      const preview: Omit<CachedPreview, "id" | "cached_at" | "expires_at"> = {
        url,
        title: urlObj.hostname,
        description: "Click to open link",
        domain: urlObj.hostname,
        fetch_error: "Failed to read response",
      }
      await setCachedPreview(preview)
      return { ...preview, id: "", cached_at: "", expires_at: "" }
    }

    const title =
      extractMetaContent(html, "og:title") ||
      extractMetaContent(html, "twitter:title") ||
      decodeHtmlEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "") ||
      urlObj.hostname

    const description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "twitter:description") ||
      extractMetaContent(html, "description") ||
      "Click to open link"

    const image = resolvePreviewImage(
      extractMetaContent(html, "og:image:secure_url") ||
        extractMetaContent(html, "og:image") ||
        extractMetaContent(html, "twitter:image"),
      urlObj,
    )

    const preview: Omit<CachedPreview, "id" | "cached_at" | "expires_at"> = {
      url,
      title,
      description,
      image,
      domain: urlObj.hostname,
    }

    await setCachedPreview(preview)

    return { ...preview, id: "", cached_at: "", expires_at: "" }
  } catch (error) {
    console.error("[v0] Unexpected error in fetchLinkPreview:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const preview = await fetchLinkPreview(url)

    if (!preview) {
      return NextResponse.json({ error: "Failed to fetch preview" }, { status: 500 })
    }

    return NextResponse.json({
      title: preview.title,
      description: preview.description,
      image: preview.image,
      domain: preview.domain,
    })
  } catch (error) {
    console.error("[v0] Error in GET handler:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch preview"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
