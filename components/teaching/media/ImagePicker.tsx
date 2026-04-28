"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface SelectedImage {
  file: File
  preview: string
  name: string
}

interface ImagePickerProps {
  onImagesSelected: (images: File[]) => void
  maxImages?: number
  disabled?: boolean
}

export function ImagePicker({ onImagesSelected, maxImages = 10, disabled = false }: ImagePickerProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    const newImages: SelectedImage[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }))

    const combined = [...selectedImages, ...newImages].slice(0, maxImages)
    setSelectedImages(combined)
    onImagesSelected(combined.map((img) => img.file))

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const updated = selectedImages.filter((_, i) => i !== index)
    setSelectedImages(updated)
    onImagesSelected(updated.map((img) => img.file))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || selectedImages.length >= maxImages}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={18} />
          <span className="text-sm font-medium">Add Images</span>
        </button>
        {selectedImages.length > 0 && (
          <span className="text-xs text-gray-500">
            {selectedImages.length}/{maxImages}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {selectedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {selectedImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={image.preview || "/placeholder.svg"} alt={image.name} fill className="object-cover" />
              </div>
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
