"use client"

import { useState } from "react"
import { BlogCard } from "./BlogCard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"

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

interface BlogListProps {
  blogs: Blog[]
}

export function BlogList({ blogs }: BlogListProps) {
  const [displayCount, setDisplayCount] = useState(9)
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "reading_time">("newest")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const categories = Array.from(
    new Set(blogs.filter((blog) => blog.category).map((blog) => blog.category!.name)),
  ).map((name) => {
    const blog = blogs.find((b) => b.category?.name === name)
    return { name, slug: blog?.category?.slug || "", color: blog?.category?.color || "#10b981" }
  })

  const filteredAndSortedBlogs = blogs
    .filter((blog) => filterCategory === "all" || blog.category?.name === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.views_count - a.views_count
        case "reading_time":
          return a.reading_time - b.reading_time
        default:
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      }
    })

  const displayedBlogs = filteredAndSortedBlogs.slice(0, displayCount)
  const hasMore = filteredAndSortedBlogs.length > displayCount

  if (blogs.length === 0) {
    return (
      <div className="py-20 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
        <p className="mt-1 text-sm text-gray-500">Check back soon for new articles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {filteredAndSortedBlogs.length} article{filteredAndSortedBlogs.length !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-10 w-full sm:w-44 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: "newest" | "popular" | "reading_time") => setSortBy(v)}>
            <SelectTrigger className="h-10 w-full sm:w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="reading_time">Quick reads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {displayedBlogs.length > 0 && (
        <div className="mb-8">
          <BlogCard blog={displayedBlogs[0]} featured />
        </div>
      )}

      {displayedBlogs.length > 1 && (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {displayedBlogs.slice(1).map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setDisplayCount((p) => p + 9)}
            className="h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Load more
          </Button>
        </div>
      )}

      {filteredAndSortedBlogs.length === 0 && filterCategory !== "all" && (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-500 mb-3">No posts in this category.</p>
          <Button variant="ghost" size="sm" onClick={() => setFilterCategory("all")}>
            View all posts
          </Button>
        </div>
      )}
    </div>
  )
}
