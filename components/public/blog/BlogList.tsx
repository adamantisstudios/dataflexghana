"use client"

import { useState } from "react"
import { BlogCard } from "./BlogCard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, SortAsc, Filter } from "lucide-react"

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
  const [displayCount, setDisplayCount] = useState(6)
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "reading_time">("newest")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // Get unique categories
  const categories = Array.from(new Set(blogs.filter((blog) => blog.category).map((blog) => blog.category!.name))).map(
    (name) => {
      const blog = blogs.find((b) => b.category?.name === name)
      return {
        name,
        slug: blog?.category?.slug || "",
        color: blog?.category?.color || "#3B82F6",
      }
    },
  )

  // Filter and sort blogs
  const filteredAndSortedBlogs = blogs
    .filter((blog) => {
      if (filterCategory === "all") return true
      return blog.category?.name === filterCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.views_count - a.views_count
        case "reading_time":
          return a.reading_time - b.reading_time
        case "newest":
        default:
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      }
    })

  const displayedBlogs = filteredAndSortedBlogs.slice(0, displayCount)
  const hasMore = filteredAndSortedBlogs.length > displayCount

  const loadMore = () => {
    setDisplayCount((prev) => prev + 6)
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-600 mb-2">No blog posts found</h3>
        <p className="text-gray-500">Check back soon for new content!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 items-start justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-lg">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">Filter & Sort</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="reading_time">Quick Reads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Post */}
      {displayedBlogs.length > 0 && (
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800">Featured Post</h2>
          </div>
          <BlogCard blog={displayedBlogs[0]} featured />
        </div>
      )}

      {/* Regular Posts */}
      {displayedBlogs.length > 1 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800">
                {filterCategory === "all" ? "Latest Posts" : `${filterCategory} Posts`}
              </h2>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-4 sm:ml-0">
              {filteredAndSortedBlogs.length - 1} posts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {displayedBlogs.slice(1).map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-6 sm:pt-8">
          <Button
            onClick={loadMore}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
          >
            Load More Posts ({filteredAndSortedBlogs.length - displayCount} remaining)
          </Button>
        </div>
      )}

      {filteredAndSortedBlogs.length === 0 && filterCategory !== "all" && (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-xl border border-blue-200">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">No posts found in "{filterCategory}"</h3>
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            Try selecting a different category or view all posts.
          </p>
          <Button
            onClick={() => setFilterCategory("all")}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            View All Posts
          </Button>
        </div>
      )}
    </div>
  )
}
