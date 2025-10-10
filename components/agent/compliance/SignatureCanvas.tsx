"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Pen, RotateCcw, Check } from "lucide-react"
import { toast } from "sonner"

interface SignatureCanvasProps {
  onSignatureCapture: (dataUrl: string) => void
  onCancel?: () => void
}

export function SignatureCanvas({ onSignatureCapture, onCancel }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set drawing styles
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    setHasSignature(true)

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setSignaturePreview(null)
  }

  const commitSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!hasSignature) {
      toast.error("Please sign before committing")
      return
    }

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png")
    setSignaturePreview(dataUrl)
    onSignatureCapture(dataUrl)
    toast.success("Signature captured successfully!")
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Signature *</Label>
      <Card className="p-4 border-2 border-emerald-300">
        {!signaturePreview ? (
          <>
            <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
              <Pen className="h-4 w-4" />
              <span>Sign in the box below using your mouse or touch screen</span>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={clearSignature}
                disabled={!hasSignature}
                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                type="button"
                onClick={commitSignature}
                disabled={!hasSignature}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <Check className="h-4 w-4 mr-2" />
                Commit
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 text-sm text-green-600 font-medium flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Signature captured successfully</span>
            </div>
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
              <img src={signaturePreview || "/placeholder.svg"} alt="Signature" className="max-h-48 mx-auto" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSignaturePreview(null)
                clearSignature()
              }}
              className="w-full mt-4 border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Redo Signature
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
