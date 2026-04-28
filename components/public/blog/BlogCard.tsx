import Link from "next/link"
import { Calendar, Clock, Eye, ArrowRight, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
      month: "long",
      day: "numeric",
    })
  }

  if (featured) {
    return (
      <Card className="overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 group">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-64 sm:h-80 lg:h-96">
            <img
              src={blog.featured_image_url || "/placeholder.svg?height=400&width=600&query=blog featured image"}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.currentTarget.src = "/blog-featured-image.jpg"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

            {blog.category && (
              <Badge
                className="absolute top-4 left-4 text-white border-0 shadow-lg backdrop-blur-sm text-xs sm:text-sm"
                style={{ backgroundColor: blog.category.color }}
              >
                {blog.category.name}
              </Badge>
            )}

            {blog.views_count > 1000 && (
              <Badge className="absolute top-4 right-4 bg-orange-500 text-white border-0 shadow-lg text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{formatDate(blog.published_at)}</span>
                <span className="sm:hidden">{new Date(blog.published_at).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                {blog.reading_time} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                {blog.views_count.toLocaleString()} views
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-800 mb-4 text-balance leading-tight group-hover:text-blue-600 transition-colors">
              {blog.title}
            </h2>

            <p className="text-blue-600 mb-6 text-sm sm:text-base lg:text-lg leading-relaxed line-clamp-3">
              {blog.excerpt}
            </p>

            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 w-fit shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              <Link href={`/blogs/${blog.slug}`}>
                <span className="hidden sm:inline">Read Full Article</span>
                <span className="sm:hidden">Read More</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-white/95 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 group h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 sm:h-52 overflow-hidden">
        <img
          src={blog.featured_image_url || "/placeholder.svg?height=300&width=400&query=blog post image"}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "/blog-post-image.png"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {blog.category && (
          <Badge
            className="absolute top-3 left-3 text-white border-0 shadow-md text-xs"
            style={{ backgroundColor: blog.category.color }}
          >
            {blog.category.name}
          </Badge>
        )}

        <Badge className="absolute top-3 right-3 bg-black/70 text-white border-0 backdrop-blur-sm text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {blog.reading_time} min
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="p-4 sm:p-5 lg:p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">{formatDate(blog.published_at)}</span>
            <span className="sm:hidden">{new Date(blog.published_at).toLocaleDateString()}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {blog.views_count.toLocaleString()}
          </span>
        </div>

        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-blue-800 mb-3 text-balance group-hover:text-blue-600 transition-colors leading-tight">
          <Link href={`/blogs/${blog.slug}`} className="hover:underline">
            {blog.title}
          </Link>
        </h3>

        <p className="text-blue-600 mb-4 leading-relaxed line-clamp-3 flex-grow text-sm sm:text-base">{blog.excerpt}</p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 sm:gap-2">
            {blog.views_count > 500 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                Popular
              </Badge>
            )}
            {blog.reading_time <= 3 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                Quick Read
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 group-hover:bg-blue-100 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
          >
            <Link href={`/blogs/${blog.slug}`}>
              Read More
              <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
