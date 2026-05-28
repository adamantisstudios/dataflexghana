import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  if (posts.length === 0) return null

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <Card className="border border-gray-100 bg-white shadow-sm sticky top-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-900">Related posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blogs/${post.slug}`}
            className="flex gap-3 rounded-lg p-2 -mx-2 hover:bg-gray-50 transition-colors group"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
              <Image
                src={post.featured_image_url || "/placeholder.svg?height=56&width=56"}
                alt={post.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                {post.title}
              </h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.published_at)}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {post.reading_time}m
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
