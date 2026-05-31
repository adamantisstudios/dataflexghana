import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES_BEFORE_COMPRESS } from "@/lib/compress-image"
import { getDatingProfile, recalculateProfileCompleteness } from "@/lib/dating/dating-server"
import {
  countProfilePhotos,
  getDatingPhotoServePath,
  getPhotosForProfile,
  insertProfilePhotoRecord,
  MAX_PHOTOS_PER_PROFILE,
} from "@/lib/dating/dating-photos"
import { uploadFileToR2Worker } from "@/lib/dating/dating-r2-worker"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status })
}

function normalizeMimeType(file: File): string {
  if (file.type && ALLOWED_IMAGE_TYPES.includes(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith(".png")) return "image/png"
  if (name.endsWith(".webp")) return "image/webp"
  return "image/jpeg"
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return jsonError("Unauthorized", 401)

  try {
    const profile = await getDatingProfile(agentId)
    if (!profile) {
      return jsonError("Create your dating profile first", 400)
    }

    const formData = await request.formData()
    const entry = formData.get("file")
    if (!entry || typeof entry === "string") {
      return jsonError("No file provided — use form field 'file'", 400)
    }

    const file = entry as File
    const contentType = normalizeMimeType(file)

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return jsonError("Only JPEG, PNG, and WebP images are allowed", 400)
    }
    if (file.size > MAX_PHOTO_BYTES_BEFORE_COMPRESS) {
      return jsonError("Image must be under 10MB", 400)
    }
    if (file.size === 0) {
      return jsonError("File is empty", 400)
    }

    const current = await countProfilePhotos(profile.id)
    if (current >= MAX_PHOTOS_PER_PROFILE) {
      return jsonError(`Maximum ${MAX_PHOTOS_PER_PROFILE} photos per profile`, 400)
    }

    const safeFilename = (file.name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_")
    const { key } = await uploadFileToR2Worker(file, safeFilename)
    const photo = await insertProfilePhotoRecord(profile.id, key)

    try {
      const completeness = await recalculateProfileCompleteness(profile.id)
      await getAdminClient()
        .from("dating_profiles")
        .update({ profile_completeness: completeness, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
    } catch (compErr) {
      console.error("[dating/upload] completeness recalc failed:", compErr)
    }

    const photos = await getPhotosForProfile(profile.id)
    const url = getDatingPhotoServePath(photo.id)

    return NextResponse.json({
      success: true,
      photo,
      url,
      photos,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed"
    console.error("[dating/upload]", message, e)
    return jsonError(message, 500)
  }
}
