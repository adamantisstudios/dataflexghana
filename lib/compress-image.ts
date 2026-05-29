export type CompressImageOptions = {
  maxWidth?: number
  quality?: number
  mimeType?: "image/jpeg" | "image/webp"
}

export type CompressImageResult = {
  blob: Blob
  width: number
  height: number
  originalSize: number
  compressedSize: number
}

/**
 * Compress an image in the browser using canvas (max width + JPEG quality).
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
  onProgress?: (percent: number) => void,
): Promise<CompressImageResult> {
  const maxWidth = options.maxWidth ?? 800
  const quality = options.quality ?? 0.7
  const mimeType = options.mimeType ?? "image/jpeg"

  onProgress?.(10)

  const dataUrl = await readFileAsDataUrl(file)
  onProgress?.(30)

  const img = await loadImage(dataUrl)
  onProgress?.(50)

  let { width, height } = img
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not create canvas context")
  ctx.drawImage(img, 0, 0, width, height)

  onProgress?.(72)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      mimeType,
      quality,
    )
  })

  onProgress?.(100)

  const ext = mimeType === "image/webp" ? "webp" : "jpg"
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo"
  const outFile = new File([blob], `${baseName}.${ext}`, { type: mimeType })

  return {
    blob: outFile,
    width,
    height,
    originalSize: file.size,
    compressedSize: outFile.size,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Invalid image file"))
    img.src = src
  })
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_PHOTO_BYTES_BEFORE_COMPRESS = 10 * 1024 * 1024
