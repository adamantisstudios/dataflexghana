"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "./image-with-fallback"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  images: (string | undefined | null)[]
  currentIndex: number
  onIndexChange: (index: number) => void
  alt: string
}

export function ImageModal({ isOpen, onClose, images, currentIndex, onIndexChange, alt }: ImageModalProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [imageKey, setImageKey] = useState(0) // Force re-render key

  // Filter out invalid images
  const validImages = images.filter((img) => img && typeof img === "string" && img.trim() !== "")
  const hasMultipleImages = validImages.length > 1

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), Math.max(0, validImages.length - 1))
  const currentImage = validImages[safeCurrentIndex] || "/placeholder.svg"

  // Update image key when index changes to force re-render
  useEffect(() => {
    setImageKey((prev) => prev + 1)
  }, [safeCurrentIndex, currentImage])

  const nextImage = useCallback(() => {
    if (hasMultipleImages && validImages.length > 0) {
      const nextIndex = safeCurrentIndex === validImages.length - 1 ? 0 : safeCurrentIndex + 1
      onIndexChange(nextIndex)
    }
  }, [safeCurrentIndex, validImages.length, hasMultipleImages, onIndexChange])

  const prevImage = useCallback(() => {
    if (hasMultipleImages && validImages.length > 0) {
      const prevIndex = safeCurrentIndex === 0 ? validImages.length - 1 : safeCurrentIndex - 1
      onIndexChange(prevIndex)
    }
  }, [safeCurrentIndex, validImages.length, hasMultipleImages, onIndexChange])

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < validImages.length) {
        onIndexChange(index)
      }
    },
    [validImages.length, onIndexChange],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          e.preventDefault()
          prevImage()
          break
        case "ArrowRight":
          e.preventDefault()
          nextImage()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, nextImage, prevImage])

  // Touch/swipe handling
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextImage()
    } else if (isRightSwipe) {
      prevImage()
    }
  }

  if (validImages.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <VisuallyHidden.Root>
          <DialogTitle>
            {alt} - Image {safeCurrentIndex + 1} of {validImages.length}
          </DialogTitle>
          <DialogDescription>
            Property image gallery showing {alt}. Use arrow keys or swipe to navigate between images.
          </DialogDescription>
        </VisuallyHidden.Root>

        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-0 h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {safeCurrentIndex + 1} / {validImages.length}
            </div>
          )}

          {/* Previous button */}
          {hasMultipleImages && (
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0 h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Next button */}
          {hasMultipleImages && (
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0 h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Main image */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <ImageWithFallback
              key={`${imageKey}-${safeCurrentIndex}`} // Force re-render with unique key
              src={currentImage || "/placeholder.svg"}
              alt={`${alt} - Image ${safeCurrentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-opacity duration-300"
              fallbackSrc="/placeholder.svg"
            />
          </div>

          {/* Image thumbnails for multiple images */}
          {hasMultipleImages && validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
              {validImages.map((img, index) => (
                <button
                  key={`thumb-${index}`}
                  onClick={() => goToImage(index)}
                  className={cn(
                    "w-12 h-12 rounded overflow-hidden border-2 transition-all flex-shrink-0",
                    index === safeCurrentIndex
                      ? "border-white scale-110"
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-white/50",
                  )}
                >
                  <ImageWithFallback
                    src={img || "/placeholder.svg"}
                    alt={`${alt} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    fallbackSrc="/placeholder.svg"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
