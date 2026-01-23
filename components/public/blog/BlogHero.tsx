"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface FeaturedBlog {
  id: string
  title: string
  excerpt: string
  featured_image_url: string
  slug: string
  published_at: string
  reading_time: number
  category?: {
    name: string
    color: string
  }
}

export function BlogHero() {
  const [featuredBlogs, setFeaturedBlogs] = useState<FeaturedBlog[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadFeaturedBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select(`
            id,
            title,
            excerpt,
            featured_image_url,
            slug,
            published_at,
            reading_time,
            category:blog_categories(name, color)
          `)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(5)

        if (error) throw error
        setFeaturedBlogs(data || [])
      } catch (error) {
        console.error("Error loading featured blogs:", error)
      }
    }

    loadFeaturedBlogs()
  }, [])

  useEffect(() => {
    if (featuredBlogs.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredBlogs.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [featuredBlogs.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredBlogs.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredBlogs.length) % featuredBlogs.length)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/blogs?search=${encodeURIComponent(searchTerm)}`
    }
  }

  if (featuredBlogs.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">DataFlex Blog</h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto text-balance">
            Stay updated with the latest insights, tips, and industry news from our experts
          </p>
        </div>
      </div>
    )
  }

  const currentBlog = featuredBlogs[currentSlide]

  return (
    <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: currentBlog?.featured_image_url
            ? `url(${currentBlog.featured_image_url})`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Category Badge */}
            {currentBlog?.category && (
              <Badge className="mb-4 text-sm px-3 py-1" style={{ backgroundColor: currentBlog.category.color }}>
                {currentBlog.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance leading-tight">
              {currentBlog?.title || "DataFlex Blog"}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto text-balance">
              {currentBlog?.excerpt ||
                "Stay updated with the latest insights, tips, and industry news from our experts"}
            </p>

            {/* Meta Info */}
            {currentBlog && (
              <div className="flex items-center justify-center gap-4 text-sm text-gray-300 mb-8">
                <span>{new Date(currentBlog.published_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{currentBlog.reading_time} min read</span>
              </div>
            )}

            {/* CTA Button */}
            {currentBlog && (
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 mb-8 px-8 py-3 text-lg font-semibold"
                onClick={() => (window.location.href = `/blogs/${currentBlog.slug}`)}
              >
                Read Article
              </Button>
            )}

            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-blue-200 focus:bg-white/20 focus:border-white/40"
                />
                <Button
                  size="sm"
                  onClick={handleSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 hover:bg-blue-50"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {featuredBlogs.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
            onClick={nextSlide}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {featuredBlogs.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {featuredBlogs.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
