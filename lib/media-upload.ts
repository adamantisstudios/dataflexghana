import { supabase } from "@/lib/supabase"
import { getStoredAgent } from "@/lib/agent-auth"

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export async function uploadImageToSupabase(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  try {
    const agent = getStoredAgent()
    if (!agent) {
      throw new Error("Not authenticated")
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${agent.id}_image_${Date.now()}.${fileExt}`
    const filePath = `teaching/${fileName}`

    const { error: uploadError } = await supabase.storage.from("teaching-media").upload(filePath, file)

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from("teaching-media").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    throw error
  }
}

export async function uploadAudioToSupabase(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  try {
    const agent = getStoredAgent()
    if (!agent) {
      throw new Error("Not authenticated")
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${agent.id}_audio_${Date.now()}.${fileExt}`
    const filePath = `teaching/${fileName}`

    const { error: uploadError } = await supabase.storage.from("teaching-media").upload(filePath, file)

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from("teaching-media").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("[v0] Audio upload error:", error)
    throw error
  }
}

export async function uploadDocumentToSupabase(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  try {
    const agent = getStoredAgent()
    if (!agent) {
      throw new Error("Not authenticated")
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${agent.id}_document_${Date.now()}.${fileExt}`
    const filePath = `teaching/${fileName}`

    const { error: uploadError } = await supabase.storage.from("teaching-media").upload(filePath, file)

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from("teaching-media").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("[v0] Document upload error:", error)
    throw error
  }
}

// Keep old function names for backward compatibility
export async function uploadImageToBlob(file: File, onProgress?: (progress: UploadProgress) => void): Promise<string> {
  return uploadImageToSupabase(file, onProgress)
}

export async function uploadAudioToBlob(file: File, onProgress?: (progress: UploadProgress) => void): Promise<string> {
  return uploadAudioToSupabase(file, onProgress)
}

export async function uploadDocumentToBlob(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  return uploadDocumentToSupabase(file, onProgress)
}

export async function uploadMultipleImages(
  files: File[],
  onProgress?: (progress: UploadProgress) => void,
): Promise<string[]> {
  const urls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const url = await uploadImageToSupabase(files[i], (progress) => {
      if (onProgress) {
        const totalProgress = {
          loaded: progress.loaded + i * 1000000,
          total: files.reduce((sum, f) => sum + f.size, 0),
          percentage: ((i + progress.percentage / 100) / files.length) * 100,
        }
        onProgress(totalProgress)
      }
    })
    urls.push(url)
  }

  return urls
}

export async function uploadMultipleDocuments(
  files: File[],
  onProgress?: (progress: UploadProgress) => void,
): Promise<string[]> {
  const urls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const url = await uploadDocumentToSupabase(files[i], (progress) => {
      if (onProgress) {
        const totalProgress = {
          loaded: progress.loaded + i * 1000000,
          total: files.reduce((sum, f) => sum + f.size, 0),
          percentage: ((i + progress.percentage / 100) / files.length) * 100,
        }
        onProgress(totalProgress)
      }
    })
    urls.push(url)
  }

  return urls
}
