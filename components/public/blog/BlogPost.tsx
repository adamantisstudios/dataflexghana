"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, Eye, ArrowLeft, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { processMarkdown } from "@/lib/markdown"

interface Blog {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url: string
  published_at: string
  updated_at: string
  reading_time: number
  views_count: number
  tags: string[]
  category?: {
    name: string
    slug: string
    color: string
  }
}

interface BlogPostProps {
  blog: Blog
}

export function BlogPost({ blog }: BlogPostProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast here
    }
  }

  return (
    <article className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
        <Link href="/blogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>
      </Button>

      {/* Article Header */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-blue-200">
        <CardContent className="p-6 md:p-8">
          {/* Category */}
          {blog.category && (
            <Link href={`/blogs/category/${blog.category.slug}`}>
              <Badge
                className="text-white border-0 mb-4 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: blog.category.color }}
              >
                {blog.category.name}
              </Badge>
            </Link>
          )}

          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-800 mb-6 text-balance leading-tight">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-600 mb-6">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm md:text-base">Published {formatDate(blog.published_at)}</span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm md:text-base">{blog.reading_time} min read</span>
            </span>
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm md:text-base">{blog.views_count} views</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-lg md:text-xl text-blue-600 leading-relaxed font-medium">{blog.excerpt}</p>
          )}
        </CardContent>
      </Card>

      {/* Featured Image */}
      {blog.featured_image_url && (
        <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
          <div className="relative h-48 md:h-64 lg:h-96">
            <Image
              src={blog.featured_image_url || "/placeholder.svg"}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </Card>
      )}

      {/* Article Content */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
        <CardContent className="p-6 md:p-8">
          <div
            className="prose prose-base md:prose-lg lg:prose-xl max-w-none
              prose-headings:text-blue-800 prose-headings:font-bold prose-headings:leading-tight
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-blue-800
              prose-ul:text-gray-700 prose-ol:text-gray-700
              prose-li:text-gray-700 prose-li:mb-1
              prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-800 prose-blockquote:p-4 prose-blockquote:rounded-lg
              prose-code:text-blue-800 prose-code:bg-blue-100 prose-code:px-2 prose-code:py-1 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
              prose-img:rounded-lg prose-img:shadow-md
              prose-table:border-collapse prose-table:border prose-table:border-gray-300
              prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2
              prose-td:border prose-td:border-gray-300 prose-td:p-2
              [&_.heading-1]:text-3xl [&_.heading-1]:md:text-4xl [&_.heading-1]:font-bold [&_.heading-1]:text-blue-800 [&_.heading-1]:mb-6 [&_.heading-1]:mt-8
              [&_.heading-2]:text-2xl [&_.heading-2]:md:text-3xl [&_.heading-2]:font-bold [&_.heading-2]:text-blue-800 [&_.heading-2]:mb-4 [&_.heading-2]:mt-6
              [&_.heading-3]:text-xl [&_.heading-3]:md:text-2xl [&_.heading-3]:font-bold [&_.heading-3]:text-blue-800 [&_.heading-3]:mb-3 [&_.heading-3]:mt-5
              [&_.heading-4]:text-lg [&_.heading-4]:md:text-xl [&_.heading-4]:font-semibold [&_.heading-4]:text-blue-800 [&_.heading-4]:mb-2 [&_.heading-4]:mt-4
              [&_.heading-5]:text-base [&_.heading-5]:md:text-lg [&_.heading-5]:font-semibold [&_.heading-5]:text-blue-800 [&_.heading-5]:mb-2 [&_.heading-5]:mt-3
              [&_.heading-6]:text-sm [&_.heading-6]:md:text-base [&_.heading-6]:font-semibold [&_.heading-6]:text-blue-800 [&_.heading-6]:mb-2 [&_.heading-6]:mt-3
              [&_.code-block]:bg-gray-900 [&_.code-block]:text-gray-100 [&_.code-block]:p-4 [&_.code-block]:rounded-lg [&_.code-block]:overflow-x-auto [&_.code-block]:my-4
              [&_.custom-blockquote]:border-l-4 [&_.custom-blockquote]:border-blue-300 [&_.custom-blockquote]:bg-blue-50 [&_.custom-blockquote]:text-blue-800 [&_.custom-blockquote]:p-4 [&_.custom-blockquote]:rounded-lg [&_.custom-blockquote]:my-4 [&_.custom-blockquote]:italic
              [&_.table-wrapper]:overflow-x-auto [&_.table-wrapper]:my-4
              [&_.custom-table]:w-full [&_.custom-table]:border-collapse [&_.custom-table]:border [&_.custom-table]:border-gray-300 [&_.custom-table]:rounded-lg [&_.custom-table]:overflow-hidden
              [&_.custom-table-th]:border [&_.custom-table-th]:border-gray-300 [&_.custom-table-th]:bg-gray-100 [&_.custom-table-th]:p-3 [&_.custom-table-th]:text-left [&_.custom-table-th]:font-semibold [&_.custom-table-th]:text-blue-800
              [&_.custom-table-td]:border [&_.custom-table-td]:border-gray-300 [&_.custom-table-td]:p-3 [&_.custom-table-td]:text-gray-700
              [&_.custom-list]:my-4 [&_.custom-list]:pl-6
              [&_.custom-list-item]:mb-2 [&_.custom-list-item]:text-gray-700
              [&_.custom-paragraph]:mb-4 [&_.custom-paragraph]:text-gray-700 [&_.custom-paragraph]:leading-relaxed
              [&_.custom-strong]:font-bold [&_.custom-strong]:text-blue-800
              [&_.custom-em]:italic [&_.custom-em]:text-blue-700
              [&_.custom-code]:text-blue-800 [&_.custom-code]:bg-blue-100 [&_.custom-code]:px-2 [&_.custom-code]:py-1 [&_.custom-code]:rounded [&_.custom-code]:text-sm
              [&_.custom-link]:text-blue-600 [&_.custom-link]:no-underline hover:[&_.custom-link]:underline
              [&_.custom-image]:rounded-lg [&_.custom-image]:shadow-md [&_.custom-image]:my-4 [&_.custom-image]:max-w-full [&_.custom-image]:h-auto"
            dangerouslySetInnerHTML={{ __html: processMarkdown(blog.content) }}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Article Footer */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">Last updated: {formatDate(blog.updated_at)}</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share Article
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Link href="/blogs">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  More Articles
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl border-0">
        <CardContent className="p-6 md:p-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-4">Ready to Start Earning?</h3>
          <p className="text-emerald-100 mb-6 text-base md:text-lg">
            Join thousands of successful agents earning commissions on Ghana's premier platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-6 md:px-8 py-3"
            >
              <Link href="/agent/register">Register As An Agent</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-emerald-600 font-semibold px-6 md:px-8 py-3 bg-transparent"
            >
              <Link href="/agent/login">Agent Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 text-white shadow-xl border-0">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center">
                  <img src="/images/logo-footer.png" alt="DataFlex Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-lg font-bold">Dataflexghana.com</span>
              </div>
              <p className="text-gray-400 text-sm">
                Ghana's most reliable multi=service platform. Connect with clients and earn generous commissions.
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

          <div className="border-t border-gray-700 mt-6 md:mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">© 2025 Dataflex Ghana. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
