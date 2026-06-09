"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ensureFaceApiModels } from "@/lib/face-api-models"
import { validateFacePhoto } from "@/lib/face-photo-validation"
import { compressImage, type CompressionPreset } from "@/lib/image-compression"
import { MobilePhotoUpload } from "@/components/ui/mobile-photo-upload"

export const FACE_PHOTO_INSTRUCTION =
  "Take a clear, well-lit phone camera selfie with your face centered in the frame. Photos that pass the automatic checks are approved instantly."

export type FacePhotoUploadResult = {
  autoApproved: boolean
  reviewReason?: string
}

type Props = {
  onFile: (file: File, result: FacePhotoUploadResult) => void
  disabled?: boolean
  uploading?: boolean
  label?: string
  className?: string
  variant?: "outline" | "default" | "secondary"
  /** Show identity verification hint above the button (default true). */
  showInstruction?: boolean
  instructionClassName?: string
  phoneCaptureOnly?: boolean
  manualFallbackOnFailure?: boolean
  compressionPreset?: CompressionPreset
}

export function FacePhotoUpload({
  onFile,
  disabled,
  uploading,
  label = "Choose Photo",
  className,
  variant = "outline",
  showInstruction = true,
  instructionClassName,
  phoneCaptureOnly = false,
  manualFallbackOnFailure = false,
  compressionPreset = "mobile",
}: Props) {
  const [modelsLoading, setModelsLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    let cancelled = false
    setModelsLoading(true)
    ensureFaceApiModels()
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load face verification. Check your connection and try again.")
        }
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      setValidating(true)
      try {
        setCompressing(true)
        const compressed = await compressImage(file, compressionPreset)
        setCompressing(false)
        await ensureFaceApiModels()
        const result = await validateFacePhoto(compressed)
        if (!result.ok) {
          toast.error(result.error)
          if (manualFallbackOnFailure) {
            onFile(compressed, { autoApproved: false, reviewReason: result.error })
          }
          return
        }
        onFile(compressed, { autoApproved: true })
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not verify photo"
        toast.error(message)
        if (manualFallbackOnFailure) {
          try {
            const compressed = await compressImage(file, compressionPreset)
            onFile(compressed, { autoApproved: false, reviewReason: message })
          } catch {
            onFile(file, { autoApproved: false, reviewReason: message })
          }
        }
      } finally {
        setCompressing(false)
        setValidating(false)
      }
    },
    [compressionPreset, manualFallbackOnFailure, onFile],
  )

  const busy = modelsLoading || validating || compressing || uploading

  return (
    <div className="space-y-2 w-full">
      {showInstruction && (
        <p
          className={cn(
            "text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg p-3 leading-relaxed",
            instructionClassName,
          )}
        >
          {FACE_PHOTO_INSTRUCTION}
        </p>
      )}
      {(modelsLoading || validating) && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          {modelsLoading ? "Loading face verification…" : "Checking your photo…"}
        </p>
      )}
      <MobilePhotoUpload
        onFile={handleFile}
        disabled={disabled || busy}
        uploading={busy}
        label={label}
        className={className}
        variant={variant}
        captureOnly={phoneCaptureOnly}
        facingMode="user"
        outputSize={1080}
        outputQuality={0.9}
      />
    </div>
  )
}
