"use client"

import React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"

interface MediaItem {
  id: string
  media_type: "image" | "audio"
  media_url: string
  file_name: string
  thumbnail_url?: string
  duration?: number
}

interface MediaGalleryProps {
  media: MediaItem[]
  maxVisible?: number
}

export function MediaGallery({ media, maxVisible = 3 }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const images = media.filter((m) => m.media_type === "image")
  const audio = media.filter((m) => m.media_type === "audio")
  const hasMore = images.length > maxVisible
  const visibleImages = images.slice(0, maxVisible)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)
  }

  if (media.length === 0) return null

  return (
    <>
      <div className="space-y-3">
        {/* Images Gallery */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {visibleImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedIndex(index)}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={image.media_url || "/placeholder.svg"}
                    alt={image.file_name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
              {hasMore && (
                <button
                  onClick={() => setSelectedIndex(maxVisible)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">+{images.length - maxVisible}</div>
                    <div className="text-xs text-gray-600">More</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Audio Messages */}
        {audio.length > 0 && (
          <div className="space-y-2">
            {audio.map((audioItem) => (
              <AudioMessage key={audioItem.id} audio={audioItem} />
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Gallery Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all z-10"
            >
              <X size={24} />
            </button>

            {/* Image Viewer */}
            {selectedIndex < images.length && (
              <>
                <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
                  <Image
                    src={images[currentSlide].media_url || "/placeholder.svg"}
                    alt={images[currentSlide].file_name}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>

                    {/* Slide Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-sm">
                      {currentSlide + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function AudioMessage({ audio }: { audio: MediaItem }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <button
        onClick={() => {
          if (audioRef.current) {
            if (isPlaying) {
              audioRef.current.pause()
            } else {
              audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
          }
        }}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate">{audio.file_name}</div>
        <div className="text-xs text-gray-500">{audio.duration ? formatDuration(audio.duration) : "Audio message"}</div>
      </div>
      <audio ref={audioRef} src={audio.media_url} onEnded={() => setIsPlaying(false)} />
    </div>
  )
}
