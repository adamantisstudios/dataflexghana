import { supabase } from "./supabase"

export type UploadTarget = "admin" | "agent"

/**
 * Upload a property image to Supabase storage
 * @param file - The image file to upload
 * @param target - Upload target: "admin" or "agent" (determines bucket)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns The public URL of the uploaded image
 */
export async function uploadPropertyImage(
  file: File,
  target: UploadTarget = "agent",
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Validate file
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Please upload a valid image file")
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image size must be less than 10MB")
    }

    // Determine bucket based on target
    const bucketName = target === "admin" ? "admin-property-images" : "agent-property-images"

    console.log(`[v0] Starting upload to '${bucketName}': properties/${file.name}`)

    // Create a unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop() || "jpg"
    const uniqueFilename = `properties/${random}_${timestamp}.${fileExtension}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFilename, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error(`[v0] Error in uploadPropertyImage: ${error.message}`)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    console.log(`[v0] Upload successful: ${publicUrlData.publicUrl}`)

    // Call progress callback if provided (after successful upload)
    if (typeof onProgress === "function") {
      try {
        onProgress(100)
      } catch (callbackError) {
        console.warn(`[v0] Progress callback error (non-fatal):`, callbackError)
      }
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error(`[v0] Error in uploadPropertyImage:`, error)
    throw error
  }
}

/**
 * Delete a property image from Supabase storage
 * @param imageUrl - The public URL of the image to delete
 * @param target - The bucket to delete from: "admin" or "agent"
 */
export async function deletePropertyImage(imageUrl: string, target: UploadTarget = "agent"): Promise<void> {
  try {
    // Determine bucket based on target
    const bucketName = target === "admin" ? "admin-property-images" : "agent-property-images"

    // Extract the file path from the public URL
    const urlParts = imageUrl.split("/")
    const filePath = urlParts.slice(-2).join("/") // Get 'properties/filename'

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error("Error deleting image:", error)
      throw new Error(`Delete failed: ${error.message}`)
    }

    console.log(`[v0] Image deleted successfully from ${bucketName}: ${filePath}`)
  } catch (error) {
    console.error(`[v0] Error deleting image:`, error)
    throw error
  }
}

/**
 * Upload multiple property images
 * @param files - Array of image files to upload
 * @param target - Upload target: "admin" or "agent"
 * @param onProgress - Optional callback for overall progress (0-100)
 * @returns Array of public URLs for uploaded images
 */
export async function uploadPropertyImages(
  files: File[],
  target: UploadTarget = "agent",
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadPropertyImage(files[i], target, undefined)
      uploadedUrls.push(url)

      // Update overall progress
      if (typeof onProgress === "function") {
        try {
          const progress = Math.round(((i + 1) / files.length) * 100)
          onProgress(progress)
        } catch (callbackError) {
          console.warn(`[v0] Progress callback error in batch upload:`, callbackError)
        }
      }
    } catch (error) {
      console.error(`Failed to upload ${files[i].name}:`, error)
      // Continue with next file instead of throwing
    }
  }

  if (uploadedUrls.length === 0) {
    throw new Error("No images were successfully uploaded")
  }

  return uploadedUrls
}
