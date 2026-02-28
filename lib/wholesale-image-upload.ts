import { supabase } from "./supabase"

/**
 * Upload a wholesale product image to Supabase storage
 * @param file - The image file to upload
 * @param agentId - The agent ID for organizing uploads (optional)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns The public URL of the uploaded image
 */
export async function uploadWholesaleProductImage(
  file: File,
  agentId?: string,
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

    console.log(`[v0] Starting upload to 'wholesale-products': products/${file.name}`)

    // Create a unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop() || "jpg"
    const uniqueFilename = `products/${random}_${timestamp}.${fileExtension}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("wholesale-products")
      .upload(uniqueFilename, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error(`[v0] Error in uploadWholesaleProductImage: ${error.message}`)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("wholesale-products")
      .getPublicUrl(data.path)

    console.log(`[v0] Upload successful: ${publicUrlData.publicUrl}`)

    // Call progress callback if provided (after successful upload)
    if (typeof onProgress === "function") {
      try {
        onProgress(100)
      } catch (callbackError) {
        console.warn(`[v0] Progress callback error (non-fatal):`, callbackError)
        // Don't throw - callback errors shouldn't break the upload
      }
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error(`[v0] Error in uploadWholesaleProductImage:`, error)
    throw error
  }
}

/**
 * Delete a wholesale product image from Supabase storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteWholesaleProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the public URL
    const urlParts = imageUrl.split("/")
    const filePath = urlParts.slice(-2).join("/") // Get 'products/filename'

    const { error } = await supabase.storage
      .from("wholesale-products")
      .remove([filePath])

    if (error) {
      console.error("Error deleting image:", error)
      throw new Error(`Delete failed: ${error.message}`)
    }

    console.log(`[v0] Image deleted successfully: ${filePath}`)
  } catch (error) {
    console.error(`[v0] Error deleting image:`, error)
    throw error
  }
}

/**
 * Upload multiple product images
 * @param files - Array of image files to upload
 * @param agentId - The agent ID for organizing uploads
 * @param onProgress - Optional callback for overall progress (0-100)
 * @returns Array of public URLs for uploaded images
 */
export async function uploadWholesaleProductImages(
  files: File[],
  agentId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadWholesaleProductImage(files[i], agentId, undefined)
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
