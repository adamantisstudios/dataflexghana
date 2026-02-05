import { supabase } from "./supabase"

/**
 * Uploads a wholesale product image to Supabase Storage
 * @param file The file to upload
 * @param onProgress Callback for upload progress
 * @returns The public URL of the uploaded image
 */
export async function uploadWholesaleProductImage(
  file: File,
  onProgress?: (progress: { percentage: number }) => void,
): Promise<string> {
  try {
    // 1. Validate file
    if (!file) throw new Error("No file provided")
    if (file.size > 5 * 1024 * 1024) throw new Error("File size exceeds 5MB limit")

    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    console.log("[v0] Starting upload to 'wholesale-products':", filePath)

    // 2. Perform upload
    const { data, error: uploadError } = await supabase.storage.from("wholesale-products").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Storage upload error details:", uploadError)

      if (uploadError.message.includes("violates row-level security policy")) {
        throw new Error(
          "Authentication/Permission error: The upload was blocked by security policies. " +
            "Please ensure you have run the latest SQL setup script (v3) to enable permissive access.",
        )
      }

      if (uploadError.message.includes("bucket")) {
        throw new Error("Storage bucket 'wholesale-products' not found. Please run the setup SQL.")
      }
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // 3. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("wholesale-products").getPublicUrl(filePath)

    if (onProgress) onProgress({ percentage: 100 })

    return publicUrl
  } catch (error) {
    console.error("[v0] Error in uploadWholesaleProductImage:", error)
    throw error
  }
}
