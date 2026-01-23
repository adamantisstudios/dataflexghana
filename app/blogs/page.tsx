import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import { BlogList } from "@/components/public/blog/BlogList"
import { BlogHero } from "@/components/public/blog/BlogHero"
import { BlogCategories } from "@/components/public/blog/BlogCategories"
import { StructuredData } from "@/components/seo/StructuredData"
import { generateBlogListStructuredData, generateWebsiteStructuredData } from "@/lib/seo"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const siteUrl = "https://dataflexghana.com"

export const metadata: Metadata = {
  title: "Blog | DataFlex - Latest Insights & Updates",
  description:
    "Stay updated with the latest insights, tips, and industry news from DataFlex. Discover expert articles on data management, technology trends, and business solutions.",
  keywords: "DataFlex blog, data management, technology insights, business solutions, industry news",
  authors: [{ name: "DataFlex Team" }],
  openGraph: {
    title: "Blog | DataFlex - Latest Insights & Updates",
    description:
      "Stay updated with the latest insights, tips, and industry news from DataFlex. Discover expert articles on data management, technology trends, and business solutions.",
    url: `${siteUrl}/blogs`,
    siteName: "Dataflexghana.com",
    images: [
      {
        url: `${siteUrl}/images/social-preview-new.jpg`,
        width: 1200,
        height: 630,
        alt: "DataFlex Blog - Latest Insights & Updates",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | DataFlex - Latest Insights & Updates",
    description: "Stay updated with the latest insights, tips, and industry news from DataFlex.",
    images: [`${siteUrl}/images/social-preview-new.jpg`],
    creator: "@dataflexgh",
    site: "@dataflexgh",
  },
  alternates: {
    canonical: `${siteUrl}/blogs`,
  },
}

async function getBlogs() {
  try {
    const { data: blogs, error } = await supabase
      .from("blogs")
      .select(`
        *,
        category:blog_categories(name, slug, color)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (error) {
      console.error("Error fetching blogs:", error)
      return []
    }

    return blogs || []
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return []
  }
}

async function getCategories() {
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

export default async function BlogsPage() {
  const [blogs, categories] = await Promise.all([getBlogs(), getCategories()])

  // Generate structured data
  const blogListStructuredData = generateBlogListStructuredData(
    blogs.map((blog) => ({
      title: blog.title,
      description: blog.excerpt,
      slug: blog.slug,
      published_at: blog.published_at,
      featured_image_url: blog.featured_image_url,
    })),
  )

  const websiteStructuredData = generateWebsiteStructuredData()

  return (
    <>
      <StructuredData data={blogListStructuredData} />
      <StructuredData data={websiteStructuredData} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <BlogHero />
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <BlogList blogs={blogs} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BlogCategories categories={categories} />
            </div>
          </div>
        </div>

        {/* Register As An Agent CTA */}
        <div className="container mx-auto px-4 pb-8">
          <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl border-0">
            <CardContent className="p-6 sm:p-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Ready to Start Earning?</h3>
              <p className="text-emerald-100 mb-6 text-base sm:text-lg">
                Join thousands of successful agents earning commissions on Ghana's premier platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-6 sm:px-8 py-3"
                >
                  <Link href="/agent/register">Register As An Agent</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-emerald-600 font-semibold px-6 sm:px-8 py-3 bg-transparent"
                >
                  <Link href="/agent/login">Agent Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blog Footer */}
        <div className="container mx-auto px-4 pb-8">
          <Card className="bg-gray-900 text-white shadow-xl border-0">
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Brand Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center">
                      <img src="/images/logo-footer.png" alt="DataFlex Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-lg font-bold">Dataflexghana.com</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Ghana's most reliable multi-service platform. Connect with clients and earn generous commissions.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/agent/register" className="text-gray-400 hover:text-white transition-colors">
                        Become an Agent
                      </Link>
                    </li>
                    <li>
                      <Link href="/agent/login" className="text-gray-400 hover:text-white transition-colors">
                        Agent Login
                      </Link>
                    </li>
                    <li>
                      <Link href="/blogs" className="text-gray-400 hover:text-white transition-colors">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                        Terms & Conditions
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Legal Links */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                        Cookie Policy
                      </Link>
                    </li>
                    <li>
                      <a
                        href="mailto:sales.dataflex@gmail.com"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Contact Support
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-700 mt-6 pt-6 text-center">
                <p className="text-gray-400 text-sm">© 2025 Dataflexghana.com. All rights reserved.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
