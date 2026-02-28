import type { MetadataRoute } from "next"
import { supabase } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"

  // Get all published blogs
  const { data: blogs } = await supabase
    .from("blogs")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })

  // Get all categories
  const { data: categories } = await supabase.from("blog_categories").select("slug").order("name")

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ]

  const blogPages =
    blogs?.map((blog) => ({
      url: `${baseUrl}/blogs/${blog.slug}`,
      lastModified: new Date(blog.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) || []

  const categoryPages =
    categories?.map((category) => ({
      url: `${baseUrl}/blogs/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) || []

  return [...staticPages, ...blogPages, ...categoryPages]
}
