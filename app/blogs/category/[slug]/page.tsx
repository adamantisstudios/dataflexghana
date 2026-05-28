import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAdminClient } from "@/lib/supabase-base";
import { BlogList } from "@/components/public/blog/BlogList"
import { BlogCategories } from "@/components/public/blog/BlogCategories"
import { StructuredData } from "@/components/seo/StructuredData"
import { generateSEOMetadata, generateBlogListStructuredData } from "@/lib/seo"

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCategory(slug: string) {
  const supabase = getAdminClient()
  try {
    const { data: category, error } = await supabase.from("blog_categories").select("*").eq("slug", slug).single()

    if (error || !category) {
      return null
    }

    return category
  } catch (error) {
    console.error("Error fetching category:", error)
    return null
  }
}

async function getBlogsByCategory(categoryId: string) {
  const supabase = getAdminClient()
  try {
    const { data: blogs, error } = await supabase
      .from("blogs")
      .select(`
        *,
        category:blog_categories(name, slug, color)
      `)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (error) {
      console.error("Error fetching blogs by category:", error)
      return []
    }

    return blogs || []
  } catch (error) {
    console.error("Error fetching blogs by category:", error)
    return []
  }
}

async function getAllCategories() {
  const supabase = getAdminClient()
  try {
    const { data: categories, error } = await supabase.from("blog_categories").select("*").order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return categories || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: "Category Not Found | DataFlex Blog",
      description: "The requested category could not be found.",
    }
  }

  return generateSEOMetadata({
    title: `${category.name} | DataFlex Blog`,
    description: category.description || `Browse all blog posts in the ${category.name} category on DataFlex Blog.`,
    keywords: `${category.name}, DataFlex blog, ${category.name} articles`,
    url: `/blogs/category/${category.slug}`,
    type: "website",
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  const [blogs, allCategories] = await Promise.all([getBlogsByCategory(category.id), getAllCategories()])

  // Generate structured data
  const categoryStructuredData = generateBlogListStructuredData(
    blogs.map((blog) => ({
      title: blog.title,
      description: blog.excerpt,
      slug: blog.slug,
      published_at: blog.published_at,
      featured_image_url: blog.featured_image_url,
    })),
  )

  return (
    <>
      <StructuredData data={categoryStructuredData} />

      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
            <div className="inline-block h-3 w-3 rounded-full mb-4" style={{ backgroundColor: category.color }} />
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="mt-3 max-w-xl mx-auto text-base text-gray-600">{category.description}</p>
            )}
            <p className="mt-3 text-sm text-gray-500">
              {blogs.length} {blogs.length === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <BlogList blogs={blogs} />
            </div>
            <aside className="lg:col-span-4">
              <BlogCategories categories={allCategories} currentCategory={category.slug} />
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
