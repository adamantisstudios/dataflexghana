"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  onFile: (file: File) => void
  disabled?: boolean
  uploading?: boolean
  label?: string
  className?: string
  variant?: "outline" | "default" | "secondary"
  captureOnly?: boolean
  facingMode?: "user" | "environment"
}

export function MobilePhotoUpload({
  onFile,
  disabled,
  uploading,
  label = "Choose Photo",
  className,
  variant = "outline",
  captureOnly = false,
  facingMode = "environment",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const isMobileCaptureDevice =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraReady(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return

    let cancelled = false
    const video = videoRef.current
    video.srcObject = streamRef.current

    const handleReady = () => {
      if (!cancelled) setCameraReady(true)
    }

    video.addEventListener("loadedmetadata", handleReady)
    video.addEventListener("canplay", handleReady)

    video
      .play()
      .then(() => {
        if (!cancelled) setCameraReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError("Camera opened, but the preview could not start. Close and try again.")
        }
      })

    return () => {
      cancelled = true
      video.removeEventListener("loadedmetadata", handleReady)
      video.removeEventListener("canplay", handleReady)
      video.pause()
      video.srcObject = null
    }
  }, [cameraOpen])

  const openCamera = async () => {
    if (!captureOnly) {
      inputRef.current?.click()
      return
    }

    if (!isMobileCaptureDevice) {
      setCameraError("Photo verification must be completed with a phone camera.")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Your browser cannot open the camera. Please use your phone browser.")
      return
    }

    setCameraError(null)
    setCameraReady(false)
    setCameraStarting(true)
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 720 },
            height: { ideal: 960 },
          },
          audio: false,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError("Could not open the phone camera. Please allow camera access and try again.")
    } finally {
      setCameraStarting(false)
    }
  }

  const closeCamera = () => {
    stopCamera()
    setCameraOpen(false)
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return

    const maxSide = 1280
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight))
    const width = Math.round(video.videoWidth * scale)
    const height = Math.round(video.videoHeight * scale)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.72)
    })
    if (!blob) {
      setCameraError("Could not capture the photo. Please try again.")
      return
    }

    closeCamera()
    onFile(
      new File([blob], `phone-verification-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      }),
    )
  }

  return (
    <>
      {!captureOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture={facingMode}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ""
          }}
        />
      )}
      <Button
        type="button"
        variant={variant}
        disabled={disabled || uploading}
        className={cn("w-full sm:w-auto", className)}
        onClick={openCamera}
      >
        {uploading || cameraStarting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Camera className="h-4 w-4 mr-2" />
        )}
        {uploading ? "Uploading..." : cameraStarting ? "Opening camera..." : label}
      </Button>
      {cameraError && <p className="mt-2 text-xs text-red-600">{cameraError}</p>}
      {cameraOpen && (
        <div className="fixed inset-0 z-[80] bg-black text-white">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain bg-black" />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting camera...
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[48vh] max-h-[520px] aspect-[3/4] rounded-[999px] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
          </div>
          <div className="absolute left-0 right-0 top-0 flex justify-end p-4">
            <Button type="button" variant="secondary" size="icon" onClick={closeCamera}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/80 to-transparent p-5">
            <p className="text-center text-sm">Keep your face inside the oval in bright light.</p>
            <Button type="button" className="mx-auto flex h-14 w-14 rounded-full p-0" onClick={capturePhoto}>
              <Camera className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
