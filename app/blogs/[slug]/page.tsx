import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BlogPost } from "@/components/public/blog/BlogPost"
import { RelatedPosts } from "@/components/public/blog/RelatedPosts"
import { BlogCategories } from "@/components/public/blog/BlogCategories"
import { StructuredData } from "@/components/seo/StructuredData"
import { generateBlogStructuredData } from "@/lib/seo"

interface BlogPageProps {
  params: {
    slug: string
  }
}

async function getBlog(slug: string) {
  try {
    const { data: blog, error } = await supabase
      .from("blogs")
      .select(`
        *,
        category:blog_categories(name, slug, color)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single()

    if (error || !blog) {
      return null
    }

    // Increment view count
    await supabase
      .from("blogs")
      .update({ views_count: blog.views_count + 1 })
      .eq("id", blog.id)

    return blog
  } catch (error) {
    console.error("Error fetching blog:", error)
    return null
  }
}

async function getRelatedPosts(categoryId: string, currentBlogId: string) {
  try {
    const { data: relatedPosts, error } = await supabase
      .from("blogs")
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        published_at,
        reading_time,
        category:blog_categories(name, color)
      `)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .neq("id", currentBlogId)
      .order("published_at", { ascending: false })
      .limit(3)

    if (error) {
      console.error("Error fetching related posts:", error)
      return []
    }

    return relatedPosts || []
  } catch (error) {
    console.error("Error fetching related posts:", error)
    return []
  }
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const blog = await getBlog(params.slug)

  if (!blog) {
    return {
      title: "Blog Post Not Found | DataFlex",
      description: "The requested blog post could not be found.",
    }
  }

  const siteUrl = "https://dataflexghana.com"

  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt,
    keywords: blog.meta_keywords || `${blog.title}, DataFlex blog, ${blog.category?.name}`,
    authors: [{ name: "DataFlex Team" }],
    openGraph: {
      title: blog.meta_title || blog.title,
      description: blog.meta_description || blog.excerpt,
      url: `${siteUrl}/blogs/${blog.slug}`,
      siteName: "Dataflexghana.com",
      images: [
        {
          url: blog.featured_image_url || `${siteUrl}/images/social-preview-new.jpg`,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: blog.published_at,
      modifiedTime: blog.updated_at,
      section: blog.category?.name,
      tags: blog.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.meta_title || blog.title,
      description: blog.meta_description || blog.excerpt,
      images: [blog.featured_image_url || `${siteUrl}/images/social-preview-new.jpg`],
      creator: "@dataflexgh",
      site: "@dataflexgh",
    },
    alternates: {
      canonical: `${siteUrl}/blogs/${blog.slug}`,
    },
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
  const blog = await getBlog(params.slug)

  if (!blog) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(blog.category_id, blog.id)

  const { data: categories } = await supabase.from("blog_categories").select("*").order("name")

  // Generate structured data
  const blogStructuredData = generateBlogStructuredData({
    title: blog.title,
    description: blog.excerpt,
    content: blog.content,
    featured_image_url: blog.featured_image_url,
    published_at: blog.published_at,
    updated_at: blog.updated_at,
    slug: blog.slug,
    reading_time: blog.reading_time,
    category: blog.category,
    tags: blog.tags,
  })

  return (
    <>
      <StructuredData data={blogStructuredData} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content - Takes 8 columns on desktop for better centering */}
            <div className="lg:col-span-8">
              <BlogPost blog={blog} />
            </div>

            {/* Sidebar - Takes 4 columns on desktop */}
            <div className="lg:col-span-4 space-y-6">
              <RelatedPosts posts={relatedPosts} />
              {categories && categories.length > 0 && <BlogCategories categories={categories} />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
