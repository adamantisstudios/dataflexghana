"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ImageGalleryProps {
  images: (string | undefined)[]
  workerName: string
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export default function ImageGallery({ images, workerName, isOpen, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Filter out undefined/empty images
  const validImages = images.filter((img): img is string => Boolean(img))

  if (!isOpen || validImages.length === 0) return null

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-white/80 rounded-full hover:bg-white">
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="relative h-[70vh] flex items-center justify-center">
          <img
            src={validImages[currentIndex] || "/placeholder.svg"}
            alt={`${workerName} - Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          {validImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 p-2 bg-white/80 rounded-full hover:bg-white">
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              <button onClick={nextImage} className="absolute right-4 p-2 bg-white/80 rounded-full hover:bg-white">
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>
            </>
          )}
        </div>

        <div className="p-4 text-center text-sm text-gray-600 bg-gray-50">
          {workerName} ({currentIndex + 1} of {validImages.length})
        </div>
      </div>
    </div>
  )
}
