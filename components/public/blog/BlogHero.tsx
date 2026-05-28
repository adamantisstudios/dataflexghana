"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"

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
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 text-center sm:py-16">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-5xl">DataFlex Blog</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-gray-600 sm:text-lg">
            Stay updated with the latest insights, tips, and industry news from our experts
          </p>
        </div>
      </section>
    )
  }

  const currentBlog = featuredBlogs[currentSlide]

  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-5xl">DataFlex Blog</h1>
          <p className="mt-3 max-w-3xl text-sm text-gray-600 sm:text-base">
            Product updates, earning tips, and practical guides for agents and partners.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: currentBlog?.featured_image_url
            ? `url(${currentBlog.featured_image_url})`
            : "linear-gradient(135deg, #22c55e 0%, #0f172a 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[420px] sm:min-h-[520px] flex items-center">
        <div className="w-full px-5 py-8 sm:px-8">
          <div className="max-w-4xl text-white">
            {/* Category Badge */}
            {currentBlog?.category && (
              <Badge className="mb-4 bg-emerald-500 text-white border-0" style={{ backgroundColor: currentBlog.category.color }}>
                {currentBlog.category.name}
              </Badge>
            )}

            {/* Title */}
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance leading-tight">
              {currentBlog?.title || "DataFlex Blog"}
            </h2>

            {/* Excerpt */}
            <p className="text-sm md:text-lg text-gray-100 mb-6 max-w-3xl text-balance">
              {currentBlog?.excerpt ||
                "Stay updated with the latest insights, tips, and industry news from our experts"}
            </p>

            {/* Meta Info */}
            {currentBlog && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200 mb-6">
                <span>{new Date(currentBlog.published_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{currentBlog.reading_time} min read</span>
              </div>
            )}

            {/* CTA Button */}
            {currentBlog && (
              <Button
                size="lg"
                className="mb-6 min-h-[44px] bg-emerald-500 text-white hover:bg-emerald-600 px-6 text-sm sm:text-base"
                onClick={() => (window.location.href = `/blogs/${currentBlog.slug}`)}
              >
                Read Article
              </Button>
            )}

            {/* Search Bar */}
            <div className="max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11 pl-10 pr-24 bg-white/95 border-white/60 text-gray-900 placeholder:text-gray-500"
                />
                <Button
                  size="sm"
                  onClick={handleSearch}
                  className="absolute right-1 top-1/2 h-9 -translate-y-1/2 bg-emerald-500 text-white hover:bg-emerald-600"
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
            className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 text-white hover:bg-white/20 z-20"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 text-white hover:bg-white/20 z-20"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {featuredBlogs.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
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
      </div>
    </section>
  )
}
