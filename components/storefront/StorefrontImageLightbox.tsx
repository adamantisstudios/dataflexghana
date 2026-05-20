"use client"

import Image from "next/image"
import { X } from "lucide-react"

type Props = {
  src: string | null
  alt?: string
  onClose: () => void
}

export function StorefrontImageLightbox({ src, alt = "", onClose }: Props) {
  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-8 w-8" />
      </button>
      <Image
        src={src}
        alt={alt}
        width={900}
        height={900}
        className="max-h-[90vh] w-auto max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
