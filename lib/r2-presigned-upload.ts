import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getR2Client, getR2PublicUrl } from "@/lib/r2-client"

export async function createR2PresignedPutUrl(
  objectKey: string,
  contentType: string,
  bucketName: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const key = objectKey.replace(/^\/+/, "")
  const normalizedContentType = contentType.trim() || "application/octet-stream"

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: normalizedContentType,
  })

  const signedAt = new Date().toISOString()
  console.log("[R2 presign] signing PUT at server time:", signedAt, {
    bucket: bucketName,
    key,
    contentType: normalizedContentType,
    expiresInSeconds,
  })

  const client = getR2Client()
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export function buildVideoObjectKey(channelId: string, ext: string): string {
  const token = `${channelId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `channel-videos/${token}.${ext}`
}

export function resolvePublicUrlAfterUpload(objectKey: string, bucketName: string): string {
  return getR2PublicUrl(objectKey, bucketName)
}
