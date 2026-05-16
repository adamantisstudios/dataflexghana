import { getAdminClient } from "./supabase-base"
import { supabase as browserSupabase } from "./supabase-client"

function storageClient() {
  return typeof window === "undefined" ? getAdminClient() : browserSupabase
}

/**
 * Upload a salon service image to Supabase storage
 * @param file - The image file to upload
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns The public URL of the uploaded image
 */
export async function uploadSalonServiceImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Validate file
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Please upload a valid image file")
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be less than 5MB")
    }

    console.log(`[v0] Starting salon image upload: ${file.name}`)

    // Create a unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop() || "jpg"
    const uniqueFilename = `salon/services/${random}_${timestamp}.${fileExtension}`

    // Upload to Supabase storage
    const { data, error } = await storageClient().storage
      .from("salon-images")
      .upload(uniqueFilename, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error(`[v0] Salon image upload error: ${error.message}`)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get the public URL
    const { data: publicUrlData } = storageClient().storage
      .from("salon-images")
      .getPublicUrl(data.path)

    console.log(`[v0] Salon image upload successful: ${publicUrlData.publicUrl}`)

    // Call progress callback if provided
    if (typeof onProgress === "function") {
      try {
        onProgress(100)
      } catch (callbackError) {
        console.warn(`[v0] Progress callback error (non-fatal):`, callbackError)
      }
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error(`[v0] Error in uploadSalonServiceImage:`, error)
    throw error
  }
}

/**
 * Delete a salon service image from Supabase storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteSalonServiceImage(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split("/")
    const filePath = urlParts.slice(-2).join("/")

    const { error } = await storageClient().storage
      .from("salon-images")
      .remove([filePath])

    if (error) {
      console.error("Error deleting salon image:", error)
      throw new Error(`Delete failed: ${error.message}`)
    }

    console.log(`[v0] Salon image deleted successfully: ${filePath}`)
  } catch (error) {
    console.error(`[v0] Error deleting salon image:`, error)
    throw error
  }
}

/**
 * Upload multiple salon service images
 * @param files - Array of image files to upload
 * @param onProgress - Optional callback for overall progress (0-100)
 * @returns Array of public URLs for uploaded images
 */
export async function uploadSalonServiceImages(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadSalonServiceImage(files[i], undefined)
      uploadedUrls.push(url)

      if (typeof onProgress === "function") {
        try {
          const progress = Math.round(((i + 1) / files.length) * 100)
          onProgress(progress)
        } catch (callbackError) {
          console.warn(`[v0] Progress callback error in salon batch upload:`, callbackError)
        }
      }
    } catch (error) {
      console.error(`Failed to upload salon image ${files[i].name}:`, error)
    }
  }

  if (uploadedUrls.length === 0) {
    throw new Error("No images were successfully uploaded")
  }

  return uploadedUrls
}
