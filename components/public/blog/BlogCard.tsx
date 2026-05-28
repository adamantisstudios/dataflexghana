import Link from "next/link"
import Image from "next/image"
import { Calendar, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string
  published_at: string
  reading_time: number
  views_count: number
  category?: {
    name: string
    slug: string
    color: string
  }
}

interface BlogCardProps {
  blog: Blog
  featured?: boolean
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const imageSrc = blog.featured_image_url || "/placeholder.svg?height=240&width=400"

  if (featured) {
    return (
      <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
        <Link href={`/blogs/${blog.slug}`} className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[220px] bg-gray-100">
            <Image
              src={imageSrc}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {blog.category && (
              <Badge
                className="absolute top-3 left-3 text-white border-0 text-xs"
                style={{ backgroundColor: blog.category.color }}
              >
                {blog.category.name}
              </Badge>
            )}
          </div>
          <CardContent className="flex flex-col justify-center p-6 md:p-8">
            <time className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(blog.published_at)}
            </time>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-snug group-hover:text-emerald-700 transition-colors">
              {blog.title}
            </h2>
            <p className="text-base text-gray-600 leading-relaxed line-clamp-3 mb-4">{blog.excerpt}</p>
            <span className="inline-flex items-center text-sm font-medium text-emerald-700">
              Read More
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </CardContent>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col">
      <Link href={`/blogs/${blog.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-[16/10] bg-gray-100">
          <Image
            src={imageSrc}
            alt={blog.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {blog.category && (
            <Badge
              className="absolute top-3 left-3 text-white border-0 text-xs"
              style={{ backgroundColor: blog.category.color }}
            >
              {blog.category.name}
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-col flex-1 p-5">
          <time className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(blog.published_at)}
          </time>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
            {blog.title}
          </h3>
          <p className="text-base text-gray-600 leading-relaxed line-clamp-3 flex-1 mb-4">{blog.excerpt}</p>
          <span className="inline-flex items-center text-sm font-medium text-emerald-700 mt-auto">
            Read More
            <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </CardContent>
      </Link>
    </Card>
  )
}
