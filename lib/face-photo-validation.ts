"use client"

import { ensureFaceApiModels, loadFaceApi } from "@/lib/face-api-models"

const BRIGHTNESS_MIN = 40
const BRIGHTNESS_MAX = 230
/** Laplacian variance below this threshold is treated as blurry. */
const LAPLACIAN_MIN = 50
const FACE_MIN_RATIO = 0.18
const FACE_MAX_RATIO = 0.68
const FACE_EDGE_MARGIN = 0.04

export type FacePhotoValidationResult =
  | { ok: true; checks: FacePhotoValidationChecks }
  | { ok: false; error: string }

export type FacePhotoValidationChecks = {
  brightness: number
  blurScore: number
  faceCount: number
  faceWidthRatio: number
  faceHeightRatio: number
  centered: boolean
  insideFrame: boolean
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read image"))
    }
    img.src = url
  })
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const maxSide = 720
  let { width, height } = img
  if (width > maxSide || height > maxSide) {
    const scale = maxSide / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

function averageBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d")
  if (!ctx) return 0
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let sum = 0
  const pixels = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return sum / pixels
}

function laplacianVariance(imageData: ImageData): number {
  const { data, width, height } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
  }

  let sum = 0
  let sumSq = 0
  let count = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const lap =
        gray[i - width] + gray[i - 1] - 4 * gray[i] + gray[i + 1] + gray[i + width]
      sum += lap
      sumSq += lap * lap
      count++
    }
  }
  const mean = sum / count
  return sumSq / count - mean * mean
}

function cropFaceRegion(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
): HTMLCanvasElement {
  const pad = 0.1
  const x = Math.max(0, Math.floor(box.x - box.width * pad))
  const y = Math.max(0, Math.floor(box.y - box.height * pad))
  const w = Math.min(canvas.width - x, Math.ceil(box.width * (1 + pad * 2)))
  const h = Math.min(canvas.height - y, Math.ceil(box.height * (1 + pad * 2)))

  const cropped = document.createElement("canvas")
  cropped.width = w
  cropped.height = h
  const ctx = cropped.getContext("2d")
  if (!ctx) return canvas
  ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h)
  return cropped
}

/**
 * Client-side face + quality checks before profile photo upload.
 */
export async function validateFacePhoto(file: File): Promise<FacePhotoValidationResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please select an image file." }
  }

  await ensureFaceApiModels()
  const faceapi = await loadFaceApi()

  const img = await loadImageFromFile(file)
  const canvas = imageToCanvas(img)
  const input = canvas

  const brightness = averageBrightness(canvas)
  if (brightness < BRIGHTNESS_MIN) {
    return { ok: false, error: "Photo is too dark. Please take the photo in a well-lit area." }
  }
  if (brightness > BRIGHTNESS_MAX) {
    return { ok: false, error: "Photo is too bright. Please avoid direct light." }
  }

  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
  const detections = await faceapi.detectAllFaces(input, options).withFaceLandmarks()

  if (detections.length === 0) {
    return { ok: false, error: "Please upload a clear photo showing only your face." }
  }
  if (detections.length > 1) {
    return { ok: false, error: "Please upload a clear photo showing only your face." }
  }

  const detection = detections[0]
  const box = detection.detection.box
  const faceWidthRatio = box.width / canvas.width
  const faceHeightRatio = box.height / canvas.height
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  const centered =
    centerX > canvas.width * 0.32 &&
    centerX < canvas.width * 0.68 &&
    centerY > canvas.height * 0.25 &&
    centerY < canvas.height * 0.66
  const insideFrame =
    box.x > canvas.width * FACE_EDGE_MARGIN &&
    box.y > canvas.height * FACE_EDGE_MARGIN &&
    box.x + box.width < canvas.width * (1 - FACE_EDGE_MARGIN) &&
    box.y + box.height < canvas.height * (1 - FACE_EDGE_MARGIN)

  if (faceWidthRatio < FACE_MIN_RATIO || faceHeightRatio < FACE_MIN_RATIO) {
    return { ok: false, error: "Move closer so your face is clearly visible in the frame." }
  }
  if (faceWidthRatio > FACE_MAX_RATIO || faceHeightRatio > FACE_MAX_RATIO) {
    return { ok: false, error: "Move the phone back slightly so your full head fits in the frame." }
  }
  if (!insideFrame) {
    return { ok: false, error: "Keep your full head inside the frame and try again." }
  }
  if (!centered) {
    return { ok: false, error: "Center your face in the frame and try again." }
  }

  const faceCanvas = cropFaceRegion(canvas, detection.detection.box)
  const faceCtx = faceCanvas.getContext("2d")
  if (!faceCtx) {
    return { ok: false, error: "Could not analyze photo. Please try again." }
  }
  const faceData = faceCtx.getImageData(0, 0, faceCanvas.width, faceCanvas.height)
  const blurScore = laplacianVariance(faceData)
  if (blurScore < LAPLACIAN_MIN) {
    return { ok: false, error: "Photo is blurry. Please hold the camera steady." }
  }

  return {
    ok: true,
    checks: {
      brightness,
      blurScore,
      faceCount: detections.length,
      faceWidthRatio,
      faceHeightRatio,
      centered,
      insideFrame,
    },
  }
}
