"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageMedia {
  id: string
  media_url: string
  file_name: string
  width?: number
  height?: number
}

interface ImageGalleryGridProps {
  images: ImageMedia[]
  onDelete?: (imageId: string) => void
}

export function ImageGalleryGrid({ images, onDelete }: ImageGalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  if (images.length === 0) return null

  const displayImages = images.slice(0, 4)
  const remainingCount = Math.max(0, images.length - 4)

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  return (
    <>
      {/* WhatsApp-style grid layout */}
      <div className="grid grid-cols-2 gap-2 my-3">
        {displayImages.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => {
              setSelectedIndex(index)
              setIsOpen(true)
            }}
          >
            <img
              src={image.media_url || "/placeholder.svg"}
              alt={image.file_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />

            {index === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{remainingCount}</span>
              </div>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(image.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full h-screen max-h-screen p-0 bg-black border-0">
          <DialogTitle className="sr-only">Image Gallery Viewer</DialogTitle>

          <div className="relative w-full h-full flex items-center justify-center">
            {selectedIndex !== null && (
              <>
                {/* Main image */}
                <img
                  src={images[selectedIndex].media_url || "/placeholder.svg"}
                  alt={images[selectedIndex].file_name}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {selectedIndex + 1} / {images.length}
                </div>

                {/* Close button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
