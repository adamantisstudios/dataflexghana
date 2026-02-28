import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string
  published_at: string
  reading_time: number
  category?: {
    name: string
    color: string
  }
}

interface RelatedPostsProps {
  posts: RelatedPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200 sticky top-8">
      <CardHeader>
        <CardTitle className="text-blue-800">Related Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/blogs/${post.slug}`} className="block group">
            <div className="flex gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
              {/* Thumbnail */}
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={post.featured_image_url || "/placeholder.svg?height=100&width=100&query=blog thumbnail"}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {post.category && (
                  <Badge className="text-xs text-white border-0 mb-1" style={{ backgroundColor: post.category.color }}>
                    {post.category.name}
                  </Badge>
                )}

                <h4 className="font-semibold text-blue-800 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.published_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time}m
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
