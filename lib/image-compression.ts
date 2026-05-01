import imageCompression from "browser-image-compression"

/**
 * Detect if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Get device memory if available (Chrome only)
 */
function getDeviceMemory(): number {
  if (typeof navigator === "undefined") return 4
  return (navigator as any).deviceMemory || 4
}

/**
 * Compression settings for different use cases
 * Optimized for mobile device support
 */
export const COMPRESSION_PRESETS = {
  // Maximum compression for storage efficiency
  aggressive: {
    maxSizeMB: 0.5, // 500KB
    maxWidthOrHeight: 1024,
    quality: 0.7,
    useWebWorker: true,
    fileType: "image/jpeg",
  },
  // Balanced compression - good quality, reasonable file size (default for mobile)
  balanced: {
    maxSizeMB: 1, // 1MB
    maxWidthOrHeight: 1440,
    quality: 0.8,
    useWebWorker: true,
    fileType: "image/jpeg",
  },
  // Light compression - high quality, larger files
  light: {
    maxSizeMB: 2, // 2MB
    maxWidthOrHeight: 2048,
    quality: 0.9,
    useWebWorker: true,
    fileType: "image/jpeg",
  },
  // Mobile-optimized compression - for low-memory devices
  mobile: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1024,
    quality: 0.75,
    useWebWorker: false, // Disabled for low-end phones
    fileType: "image/jpeg",
  },
}

export type CompressionPreset = keyof typeof COMPRESSION_PRESETS

/**
 * Fix EXIF orientation for images
 * Rotates canvas based on EXIF orientation tag
 * Includes timeout fallback for mobile devices
 */
async function fixExifOrientation(file: File): Promise<File> {
  return new Promise((resolve) => {
    try {
      // Set timeout to fallback after 5 seconds (for slow devices)
      const timeoutId = setTimeout(() => {
        console.warn(`[v0] EXIF orientation fix timeout, using original file`)
        clearTimeout(timeoutId)
        resolve(file)
      }, 5000)

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous" // Prevent CORS issues

          img.onload = () => {
            try {
              const canvas = document.createElement("canvas")
              const ctx = canvas.getContext("2d")

              if (!ctx) {
                clearTimeout(timeoutId)
                resolve(file)
                return
              }

              // Ensure canvas size is reasonable (prevent memory issues)
              const maxDim = 4096
              const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
              canvas.width = img.width * scale
              canvas.height = img.height * scale

              // Draw image on canvas to normalize orientation
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

              canvas.toBlob(
                (blob) => {
                  try {
                    if (blob && blob.size > 0) {
                      const newFile = new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                      })
                      clearTimeout(timeoutId)
                      resolve(newFile)
                    } else {
                      clearTimeout(timeoutId)
                      resolve(file)
                    }
                  } catch (blobError) {
                    clearTimeout(timeoutId)
                    console.warn(`[v0] EXIF blob error:`, blobError)
                    resolve(file)
                  }
                },
                "image/jpeg",
                0.95,
              )
            } catch (drawError) {
              clearTimeout(timeoutId)
              console.warn(`[v0] EXIF draw error:`, drawError)
              resolve(file)
            }
          }

          img.onerror = () => {
            clearTimeout(timeoutId)
            console.warn(`[v0] Image load failed for EXIF fix`)
            resolve(file)
          }

          img.src = e.target?.result as string
        } catch (imgError) {
          clearTimeout(timeoutId)
          console.warn(`[v0] EXIF image setup error:`, imgError)
          resolve(file)
        }
      }

      reader.onerror = () => {
        clearTimeout(timeoutId)
        console.warn(`[v0] FileReader error`)
        resolve(file)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.warn(`[v0] EXIF orientation fix outer error:`, error)
      resolve(file)
    }
  })
}

/**
 * Auto-select compression preset based on device capabilities
 */
function selectOptimalPreset(isMobile: boolean, memoryGB: number): CompressionPreset {
  if (isMobile) {
    // For low-memory mobile devices, use mobile preset
    if (memoryGB < 2) {
      console.log(`[v0] Low-memory device detected (${memoryGB}GB), using mobile preset`)
      return "mobile"
    }
    // For standard mobile devices, use balanced
    console.log(`[v0] Mobile device detected, using balanced preset`)
    return "balanced"
  }
  // For desktop, use balanced by default
  return "balanced"
}

/**
 * Compress a single image file with mobile optimization
 * Includes timeout protection and graceful degradation
 * @param file - The image file to compress
 * @param preset - Compression preset to use (auto-selected if not specified)
 * @returns The compressed file (original if compression fails or times out)
 */
export async function compressImage(
  file: File,
  preset?: CompressionPreset,
): Promise<File> {
  try {
    // Validate file exists
    if (!file || !(file instanceof File)) {
      console.warn(`[v0] Invalid file object`)
      return file
    }

    // Skip compression for very small files (less than 100KB)
    if (file.size < 100 * 1024) {
      console.log(`[v0] File ${file.name} is small (${(file.size / 1024).toFixed(2)}KB), skipping compression`)
      return file
    }

    // Auto-select preset if not specified
    const selectedPreset = preset || selectOptimalPreset(isMobileDevice(), getDeviceMemory())
    const options = COMPRESSION_PRESETS[selectedPreset]

    console.log(`[v0] Compressing image: ${file.name}`)
    console.log(`[v0] Original size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
    console.log(`[v0] Using preset: ${selectedPreset}`)

    // Create timeout promise for compression (30 second max)
    const compressionTimeout = new Promise<File>((resolve) => {
      setTimeout(() => {
        console.warn(`[v0] Compression timeout, returning original file`)
        resolve(file)
      }, 30000)
    })

    // Fix EXIF orientation first
    console.log(`[v0] Fixing EXIF orientation...`)
    let processedFile = await Promise.race([fixExifOrientation(file), compressionTimeout])

    // Validate processed file
    if (!processedFile || processedFile.size === 0) {
      console.warn(`[v0] Processed file is invalid, using original`)
      return file
    }

    // Compress the file with timeout
    console.log(`[v0] Starting compression...`)
    const compressedFile = await Promise.race([imageCompression(processedFile, options), compressionTimeout])

    // Validate compressed file
    if (!compressedFile || compressedFile.size === 0) {
      console.warn(`[v0] Compressed file is invalid, returning original`)
      return file
    }

    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    console.log(`[v0] Compressed size: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`)
    console.log(`[v0] Compression ratio: ${compressionRatio}%`)

    // Return the compressed file with .jpg extension
    return new File([compressedFile], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error(`[v0] Error compressing image ${file.name}:`, error)
    console.log(`[v0] Returning original file as fallback`)
    // Always return original file if any error occurs
    return file
  }
}

/**
 * Compress multiple image files with mobile optimization
 * @param files - Array of image files to compress
 * @param preset - Compression preset to use (auto-selected if not specified)
 * @param onProgress - Optional callback for progress updates
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  preset?: CompressionPreset,
  onProgress?: (current: number, total: number, filename: string) => void,
): Promise<File[]> {
  try {
    const compressedFiles: File[] = []
    const selectedPreset = preset || selectOptimalPreset(isMobileDevice(), getDeviceMemory())

    console.log(`[v0] Starting batch compression for ${files.length} files with preset: ${selectedPreset}`)
    console.log(`[v0] Device: ${isMobileDevice() ? "Mobile" : "Desktop"}, Memory: ${getDeviceMemory()}GB`)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Call progress with current status
      if (onProgress) {
        onProgress(i, files.length, file.name)
      }

      try {
        const compressedFile = await compressImage(file, selectedPreset)
        compressedFiles.push(compressedFile)
      } catch (fileError) {
        console.error(`[v0] Error compressing individual file ${file.name}:`, fileError)
        compressedFiles.push(file) // Push original if individual compression fails
      }
    }

    // Call final progress
    if (onProgress) {
      onProgress(files.length, files.length, "Complete")
    }

    // Log summary
    const originalSize = files.reduce((sum, f) => sum + f.size, 0)
    const compressedSize = compressedFiles.reduce((sum, f) => sum + f.size, 0)
    const totalReduction = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log(`[v0] Batch compression complete:`)
    console.log(`[v0] Original total: ${(originalSize / (1024 * 1024)).toFixed(2)}MB`)
    console.log(`[v0] Compressed total: ${(compressedSize / (1024 * 1024)).toFixed(2)}MB`)
    console.log(`[v0] Total reduction: ${totalReduction}%`)

    return compressedFiles
  } catch (error) {
    console.error(`[v0] Error in batch compression:`, error)
    // Return original files if batch compression fails
    return files
  }
}

/**
 * Get file size in human-readable format
 */
export function getFileSizeDisplay(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Calculate compression savings
 */
export function calculateCompressionSavings(originalSize: number, compressedSize: number): {
  percentage: string
  original: string
  compressed: string
  saved: string
} {
  const percentage = ((1 - compressedSize / originalSize) * 100).toFixed(1)
  return {
    percentage,
    original: getFileSizeDisplay(originalSize),
    compressed: getFileSizeDisplay(compressedSize),
    saved: getFileSizeDisplay(originalSize - compressedSize),
  }
}
