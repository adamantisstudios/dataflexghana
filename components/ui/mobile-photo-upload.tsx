"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  onFile: (file: File) => void
  disabled?: boolean
  uploading?: boolean
  label?: string
  className?: string
  variant?: "outline" | "default" | "secondary"
}

export function MobilePhotoUpload({
  onFile,
  disabled,
  uploading,
  label = "Choose Photo",
  className,
  variant = "outline",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ""
        }}
      />
      <Button
        type="button"
        variant={variant}
        disabled={disabled || uploading}
        className={cn("w-full sm:w-auto", className)}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Camera className="h-4 w-4 mr-2" />
        )}
        {uploading ? "Uploading…" : label}
      </Button>
    </>
  )
}
