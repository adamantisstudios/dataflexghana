"use client"

import { useCallback, useRef, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { compressImageFile } from "@/lib/compress-image"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { parseJsonResponse } from "@/lib/agent-auth-utils"
import { toast } from "sonner"
import { DatingPhotoImage } from "@/components/agent/dating/DatingPhotoImage"
import { resolveDatingPhotoUrl } from "@/lib/dating/dating-photo-client"
import { cn } from "@/lib/utils"

export type DatingPhoto = {
  id: string
  profile_id: string
  public_url: string
  order_index: number
}

type Props = {
  photos: DatingPhoto[]
  onPhotosChange: (photos: DatingPhoto[]) => void
  maxPhotos?: number
  className?: string
}

export function datingPhotoServeUrl(photoId: string, publicUrl?: string | null) {
  return resolveDatingPhotoUrl({ id: photoId, public_url: publicUrl })
}

export function DatingPhotoUploader({ photos, onPhotosChange, maxPhotos = 5, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [compressPct, setCompressPct] = useState<number | null>(null)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      const remaining = maxPhotos - photos.length
      if (remaining <= 0) {
        toast.error(`Maximum ${maxPhotos} photos`)
        return
      }
      const toUpload = list.slice(0, remaining)
      setUploading(true)

      try {
        const formData = new FormData()
        for (const file of toUpload) {
          setCompressPct(0)
          const { blob } = await compressImageFile(file, { maxWidth: 800, quality: 0.7 }, (p) =>
            setCompressPct(p),
          )
          formData.append("files", blob, file.name.replace(/\.[^.]+$/, ".jpg"))
        }

        setCompressPct(null)
        const res = await fetch("/api/agent/dating/photos", {
          method: "POST",
          headers: getAgentAuthHeaders(),
          body: formData,
        })
        const { data } = await parseJsonResponse(res)
        if (!res.ok) {
          toast.error(data.error || "Upload failed")
          return
        }
        onPhotosChange(data.photos ?? [])
        toast.success("Photo uploaded")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed")
      } finally {
        setUploading(false)
        setCompressPct(null)
      }
    },
    [maxPhotos, onPhotosChange, photos.length],
  )

  const deletePhoto = async (photoId: string) => {
    const res = await fetch(`/api/agent/dating/photos/${photoId}`, {
      method: "DELETE",
      headers: getAgentAuthHeaders(),
    })
    const { data } = await parseJsonResponse(res)
    if (!res.ok) {
      toast.error(data.error || "Delete failed")
      return
    }
    onPhotosChange(photos.filter((p) => p.id !== photoId))
  }

  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] ?? null)

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files)
          e.target.value = ""
        }}
      />

      <div
        className="grid grid-cols-3 gap-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files)
        }}
      >
        {slots.map((photo, i) => (
          <div
            key={photo?.id ?? `empty-${i}`}
            className={cn(
              "relative aspect-square rounded-xl border-2 border-dashed overflow-hidden",
              photo ? "border-rose-200" : "border-gray-200 bg-gray-50",
            )}
          >
            {photo ? (
              <>
                <DatingPhotoImage
                  photo={{ id: photo.id, public_url: photo.public_url }}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                  onClick={() => void deletePhoto(photo.id)}
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={uploading || photos.length >= maxPhotos}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400"
                onClick={() => inputRef.current?.click()}
              >
                {uploading && i === photos.length ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                    <span className="text-[10px] text-rose-600">
                      {compressPct != null ? `Compressing ${compressPct}%…` : "Uploading…"}
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6" />
                    <span className="text-[10px]">Add photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500">
        Tap or drag up to {maxPhotos} photos. Images are compressed before upload.
      </p>
    </div>
  )
}
