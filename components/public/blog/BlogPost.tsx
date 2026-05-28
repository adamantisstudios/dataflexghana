"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, Eye, ArrowLeft, Share2, User } from "lucide-react"
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
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: blog.title, text: blog.excerpt, url: window.location.href })
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/blogs"
        className="mb-8 inline-flex items-center text-sm text-gray-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to blog
      </Link>

      <header className="mb-6 text-center sm:mb-8">
        {blog.category && (
          <Link href={`/blogs/category/${blog.category.slug}`} className="inline-block mb-4">
            <Badge
              className="text-white border-0 text-xs font-normal"
              style={{ backgroundColor: blog.category.color }}
            >
              {blog.category.name}
            </Badge>
          </Link>
        )}

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight tracking-tight text-balance">
          {blog.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            DataFlex Team
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(blog.published_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {blog.reading_time} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {blog.views_count.toLocaleString()} views
          </span>
        </div>

        {blog.excerpt && (
          <p className="mt-5 text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">{blog.excerpt}</p>
        )}
      </header>

      {blog.featured_image_url && (
        <figure className="mb-10 -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden bg-gray-100">
          <div className="relative w-full aspect-[2/1] sm:aspect-[21/9] max-h-[420px]">
            <Image
              src={blog.featured_image_url}
              alt={blog.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </figure>
      )}

      <div
        className="blog-content text-base text-gray-700"
        dangerouslySetInnerHTML={{ __html: processMarkdown(blog.content) }}
      />

      {blog.tags && blog.tags.length > 0 && (
        <footer className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Tags</p>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-700">
                {tag}
              </Badge>
            ))}
          </div>
        </footer>
      )}

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-100 text-sm text-gray-500">
        <span>Updated {formatDate(blog.updated_at)}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-emerald-700 hover:text-emerald-800">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-gray-600">
            <Link href="/blogs">More articles</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
