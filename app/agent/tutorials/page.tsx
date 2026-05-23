"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { sanitizeTutorialEmbed } from "@/lib/tutorial-embed"
import "swiper/css"

interface TutorialVideo {
  id: string
  title: string
  platform: string
  embed_code: string
}

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

export default function AgentTutorialsPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<TutorialVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    fetch("/api/agent/tutorials", { headers: getAgentAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setVideos(data.videos || []))
      .catch((err) => console.error("Failed to load tutorials:", err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/agent/dashboard")
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-sm text-white/70">No tutorials available yet.</p>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div
        className={`absolute top-4 right-4 z-10 flex flex-col items-center rounded-full bg-black/40 px-2 py-1.5 text-white/80 backdrop-blur-sm transition-opacity duration-700 ${
          showSwipeHint ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-4 w-4" />
        <ChevronDown className="h-4 w-4 -mt-1" />
      </div>

      <Swiper
        direction="vertical"
        slidesPerView={1}
        simulateTouch
        loop={false}
        observer
        observeParents
        className="h-screen w-screen"
        onSlideChange={(swiper: SwiperType) => setActiveIndex(swiper.activeIndex)}
      >
        {videos.map((video, index) => (
          <SwiperSlide key={video.id} className="relative h-screen w-screen overflow-hidden bg-black">
            {index === activeIndex && (
              <div
                className="tutorial-embed absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
                dangerouslySetInnerHTML={{ __html: sanitizeTutorialEmbed(video.embed_code) }}
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-8 pt-16">
              <p className="text-sm font-medium text-white">{video.title}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
