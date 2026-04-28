import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BlogList } from "@/components/public/blog/BlogList"
import { BlogCategories } from "@/components/public/blog/BlogCategories"
import { StructuredData } from "@/components/seo/StructuredData"
import { generateSEOMetadata, generateBlogListStructuredData } from "@/lib/seo"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

async function getCategory(slug: string) {
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
  const category = await getCategory(params.slug)

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
  const category = await getCategory(params.slug)

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

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Category Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block w-4 h-4 rounded-full mb-4" style={{ backgroundColor: category.color }} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
            {category.description && <p className="text-xl text-blue-100 max-w-2xl mx-auto">{category.description}</p>}
            <p className="text-blue-200 mt-4">
              {blogs.length} {blogs.length === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <BlogList blogs={blogs} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BlogCategories categories={allCategories} currentCategory={category.slug} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
