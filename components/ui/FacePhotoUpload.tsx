"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ensureFaceApiModels } from "@/lib/face-api-models"
import { validateFacePhoto } from "@/lib/face-photo-validation"
import { MobilePhotoUpload } from "@/components/ui/mobile-photo-upload"

export const FACE_PHOTO_INSTRUCTION =
  "Please upload a clear, well-lit photo showing only your face. This helps us verify your identity and build trust in the community."

type Props = {
  onFile: (file: File) => void
  disabled?: boolean
  uploading?: boolean
  label?: string
  className?: string
  variant?: "outline" | "default" | "secondary"
  /** Show identity verification hint above the button (default true). */
  showInstruction?: boolean
  instructionClassName?: string
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
}: Props) {
  const [modelsLoading, setModelsLoading] = useState(false)
  const [validating, setValidating] = useState(false)

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
        await ensureFaceApiModels()
        const result = await validateFacePhoto(file)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        onFile(file)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not verify photo")
      } finally {
        setValidating(false)
      }
    },
    [onFile],
  )

  const busy = modelsLoading || validating || uploading

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
      />
    </div>
  )
}
