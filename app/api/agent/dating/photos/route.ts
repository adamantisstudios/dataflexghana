import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getDatingProfile, recalculateProfileCompleteness } from "@/lib/dating/dating-server"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES_BEFORE_COMPRESS,
} from "@/lib/compress-image"
import {
  MAX_PHOTOS_PER_PROFILE,
  countProfilePhotos,
  getDatingR2Config,
  getPhotosForProfile,
  uploadProfilePhoto,
} from "@/lib/dating/dating-photos-server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

function normalizeMimeType(file: File): string {
  if (file.type && ALLOWED_IMAGE_TYPES.includes(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith(".png")) return "image/png"
  if (name.endsWith(".webp")) return "image/webp"
  return "image/jpeg"
}

/** Accept File or Blob entries from multipart form data (Node / Next.js). */
function collectUploadFiles(formData: FormData): File[] {
  const files: File[] = []

  const addEntry = (entry: FormDataEntryValue | null) => {
    if (!entry || typeof entry !== "object") return
    if (!("arrayBuffer" in entry) || typeof entry.arrayBuffer !== "function") return
    const blob = entry as Blob
    const name =
      "name" in entry && typeof (entry as File).name === "string"
        ? (entry as File).name
        : "photo.jpg"
    files.push(new File([blob], name, { type: normalizeMimeType(entry as File) }))
  }

  for (const entry of formData.getAll("files")) addEntry(entry)
  if (files.length === 0) addEntry(formData.get("file"))

  return files
}

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return jsonError("Unauthorized", 401)

  try {
    getDatingR2Config()
  } catch (configErr) {
    const msg = configErr instanceof Error ? configErr.message : "R2 configuration error"
    console.error("[dating/photos POST] R2 config:", msg)
    return jsonError(msg, 500)
  }

  try {
    const profile = await getDatingProfile(agentId)
    if (!profile) {
      return jsonError("Create your dating profile first", 400)
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formErr) {
      const msg = formErr instanceof Error ? formErr.message : "Invalid form data"
      console.error("[dating/photos POST] formData parse failed:", msg)
      return jsonError(`Could not read upload: ${msg}`, 400)
    }

    const files = collectUploadFiles(formData)
    if (files.length === 0) {
      const keys = [...formData.keys()]
      console.error("[dating/photos POST] no files in form; keys:", keys)
      return jsonError("No files provided — use form field 'files' or 'file'", 400, {
        received_fields: keys,
      })
    }

    const current = await countProfilePhotos(profile.id)
    if (current + files.length > MAX_PHOTOS_PER_PROFILE) {
      return jsonError(`Maximum ${MAX_PHOTOS_PER_PROFILE} photos per profile`, 400)
    }

    const uploaded = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const contentType = normalizeMimeType(file)

      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return jsonError("Only JPEG, PNG, and WebP images are allowed", 400, {
          received_type: file.type || "(empty)",
        })
      }
      if (file.size > MAX_PHOTO_BYTES_BEFORE_COMPRESS) {
        return jsonError("Each image must be under 10MB", 400)
      }

      let buffer: Buffer
      try {
        const bytes = await file.arrayBuffer()
        buffer = Buffer.from(bytes)
      } catch (readErr) {
        const msg = readErr instanceof Error ? readErr.message : "Read failed"
        console.error("[dating/photos POST] arrayBuffer failed:", msg, { index: i, size: file.size })
        return jsonError(`Could not read file ${i + 1}: ${msg}`, 400)
      }

      if (buffer.length === 0) {
        return jsonError(`File ${i + 1} is empty`, 400)
      }

      try {
        const photo = await uploadProfilePhoto(
          profile.id,
          agentId,
          buffer,
          contentType,
          extFromMime(contentType),
        )
        uploaded.push(photo)
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : "Upload failed"
        console.error("[dating/photos POST] uploadProfilePhoto failed:", {
          index: i,
          fileName: file.name,
          size: file.size,
          contentType,
          bufferBytes: buffer.length,
          error: msg,
          stack: uploadErr instanceof Error ? uploadErr.stack : undefined,
        })
        return jsonError(msg, 500, { file_index: i + 1, file_name: file.name })
      }
    }

    const photos = await getPhotosForProfile(profile.id)

    try {
      const completeness = await recalculateProfileCompleteness(profile.id)
      const { error: updateErr } = await getAdminClient()
        .from("dating_profiles")
        .update({ profile_completeness: completeness, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
      if (updateErr) {
        console.error("[dating/photos POST] completeness update failed:", updateErr.message)
      }
    } catch (compErr) {
      console.error("[dating/photos POST] completeness recalc failed:", compErr)
    }

    return NextResponse.json({ success: true, photos, uploaded })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed"
    const name = e instanceof Error ? e.name : "Error"
    console.error("[dating/photos POST] unhandled error:", {
      name,
      message,
      stack: e instanceof Error ? e.stack : undefined,
    })
    return jsonError(message, 500)
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return jsonError("Unauthorized", 401)

  const profile = await getDatingProfile(agentId)
  if (!profile) return NextResponse.json({ success: true, photos: [] })

  const photos = await getPhotosForProfile(profile.id)
  return NextResponse.json({ success: true, photos })
}
