"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Swiper, SwiperSlide } from "swiper/react"
import { Keyboard, Mousewheel } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import Player from "@vimeo/player"
import { ArrowLeft, ChevronDown, ChevronUp, Volume2 } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { TutorialVideoSlide, type TutorialVideoItem } from "@/components/agent/TutorialVideoSlide"
import "swiper/css"
import "./tutorials.css"

const SOUND_ENABLED_KEY = "tutorial_sound_enabled"

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

export default function AgentTutorialsPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<TutorialVideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [showSoundPrompt, setShowSoundPrompt] = useState(true)
  const playersRef = useRef<Map<string, Player>>(new Map())
  const soundEnabledRef = useRef(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SOUND_ENABLED_KEY) === "1"
    if (stored) {
      setSoundEnabled(true)
      setShowSoundPrompt(false)
      soundEnabledRef.current = true
    }
  }, [])

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

  const handleRegisterPlayer = useCallback((id: string, player: Player | null) => {
    if (player) {
      playersRef.current.set(id, player)
    } else {
      playersRef.current.delete(id)
    }
  }, [])

  const unmuteActivePlayer = useCallback(async () => {
    const video = videos[activeIndex]
    if (!video) return
    const player = playersRef.current.get(video.id)
    if (!player) return
    try {
      await player.setMuted(false)
      await player.setVolume(1)
    } catch {
      // ignore
    }
  }, [videos, activeIndex])

  const enableSound = useCallback(async () => {
    soundEnabledRef.current = true
    setSoundEnabled(true)
    setShowSoundPrompt(false)
    sessionStorage.setItem(SOUND_ENABLED_KEY, "1")
    await unmuteActivePlayer()
  }, [unmuteActivePlayer])

  const handleSlideChangeTransitionEnd = useCallback(
    async (swiper: SwiperType) => {
      const index = swiper.activeIndex
      setActiveIndex(index)

      await Promise.all(
        Array.from(playersRef.current.values()).map((player) => player.pause().catch(() => {})),
      )

      const video = videos[index]
      if (!video) return

      const player = playersRef.current.get(video.id)
      if (!player) return

      try {
        await player.play()
        if (soundEnabledRef.current) {
          await player.setMuted(false)
          await player.setVolume(1)
        }
      } catch {
        // ignore
      }
    },
    [videos],
  )

  useEffect(() => {
    return () => {
      playersRef.current.forEach((player) => player.destroy().catch(() => {}))
      playersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (soundEnabledRef.current) {
      void unmuteActivePlayer()
    }
  }, [activeIndex, unmuteActivePlayer])

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
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-black">
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div
        className={`absolute top-4 right-4 z-30 flex flex-col items-center rounded-full bg-black/40 px-2 py-1.5 text-white/80 backdrop-blur-sm transition-opacity duration-700 ${
          showSwipeHint ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-4 w-4" />
        <ChevronDown className="h-4 w-4 -mt-1" />
      </div>

      {showSoundPrompt && activeIndex === 0 && (
        <button
          type="button"
          onClick={enableSound}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 px-6"
        >
          <span className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white backdrop-blur-md">
            <Volume2 className="h-5 w-5" />
            Tap to enable sound
          </span>
        </button>
      )}

      <Swiper
        direction="vertical"
        slidesPerView={1}
        simulateTouch={true}
        touchStartPreventDefault={false}
        loop={false}
        observer
        observeParents
        speed={350}
        resistanceRatio={0.85}
        modules={[Mousewheel, Keyboard]}
        mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
        keyboard={{ enabled: true, onlyInViewport: true }}
        className="tutorials-swiper"
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        onSlideChangeTransitionEnd={handleSlideChangeTransitionEnd}
      >
        {videos.map((video, index) => (
          <SwiperSlide key={video.id} className="!h-[100dvh] !w-screen">
            <TutorialVideoSlide
              video={video}
              isActive={index === activeIndex}
              shouldMount={Math.abs(index - activeIndex) <= 1}
              soundEnabled={soundEnabled}
              onRegisterPlayer={handleRegisterPlayer}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
