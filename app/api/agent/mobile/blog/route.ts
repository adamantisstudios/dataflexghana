import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { sanitizeSearchTerm } from "@/lib/postgrest-search"

export const dynamic = "force-dynamic"

const LIST_FIELDS =
  "id, title, slug, excerpt, featured_image_url, published_at, reading_time, views_count, tags, category:blog_categories(id, name, slug, color)"

async function getSinglePost(slug: string) {
  const supabase = getAdminClient()

  const { data: post, error } = await supabase
    .from("blogs")
    .select("*, category:blog_categories(id, name, slug, color)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  await supabase
    .from("blogs")
    .update({ views_count: (post.views_count ?? 0) + 1 })
    .eq("id", post.id)

  let related: unknown[] = []
  if (post.category_id) {
    const { data } = await supabase
      .from("blogs")
      .select(LIST_FIELDS)
      .eq("category_id", post.category_id)
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3)
    related = data || []
  }

  return NextResponse.json({ success: true, post, related })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const slug = (searchParams.get("slug") || "").trim()
    if (slug) {
      return await getSinglePost(slug)
    }

    const search = (searchParams.get("search") || "").trim()
    const category = (searchParams.get("category") || "").trim()
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10) || 12, 1), 50)

    const supabase = getAdminClient()

    const { data: categoryRows } = await supabase
      .from("blog_categories")
      .select("id, name, slug, description, color")
      .order("name")
    const categories = categoryRows || []

    let query = supabase
      .from("blogs")
      .select(LIST_FIELDS, { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (category && category !== "all") {
      const matched = categories.find((c) => c.slug === category || c.id === category)
      if (!matched) {
        return NextResponse.json({
          success: true,
          posts: [],
          categories,
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
      query = query.eq("category_id", matched.id)
    }

    const safeSearch = sanitizeSearchTerm(search)
    if (safeSearch) {
      query = query.or(`title.ilike.%${safeSearch}%,excerpt.ilike.%${safeSearch}%`)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    const posts = data || []
    const total = count ?? posts.length

    return NextResponse.json({
      success: true,
      posts,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load blog posts"
    console.error("[mobile/blog] GET failed:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
