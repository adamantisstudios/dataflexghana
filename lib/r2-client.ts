import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

/** Read required R2 env var with whitespace trimmed (avoids signature/auth failures). */
export function requireEnv(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

/** Cloudflare R2 S3-compatible endpoint: https://<account_id>.r2.cloudflarestorage.com */
export function getR2Endpoint(accountId?: string): string {
  const id = (accountId ?? requireEnv("R2_ACCOUNT_ID")).trim()
  return `https://${id}.r2.cloudflarestorage.com`
}

/**
 * Shared S3 client for Cloudflare R2.
 * SDK ≥3.729 adds default CRC32 checksums that R2 does not support — use WHEN_REQUIRED.
 * @see https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
 */
export function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  })
}

/** Channel audio lectures bucket (public read via R2_PUBLIC_URL_BASE or stream API). */
export function getChannelAudioBucketName(): string {
  return (
    process.env.R2_CHANNEL_AUDIO_BUCKET_NAME?.trim() ||
    process.env.R2_BUCKET_NAME?.trim() ||
    "dataflex-channel-audio"
  )
}

export function getAttachmentsBucketName(): string {
  return process.env.R2_ATTACHMENTS_BUCKET_NAME?.trim() || "dataflex-channel-attachments"
}

function encodeObjectKey(objectKey: string): string {
  return objectKey
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

/**
 * Public URL for an R2 object.
 *
 * Configure `R2_PUBLIC_URL_BASE` to the bucket's public r2.dev URL from Cloudflare
 * (e.g. https://pub-xxxxxxxx.r2.dev) — do NOT include the bucket name in the path.
 *
 * Optional: `R2_CHANNEL_AUDIO_PUBLIC_URL_BASE` for the audio bucket only.
 */
export function getR2PublicUrl(objectKey: string, bucketName?: string): string {
  const bucket = bucketName || requireEnv("R2_BUCKET_NAME")
  const keyPath = encodeObjectKey(objectKey)

  const channelBase = process.env.R2_CHANNEL_AUDIO_PUBLIC_URL_BASE?.replace(/\/$/, "")
  if (bucket === getChannelAudioBucketName() && channelBase) {
    return `${channelBase}/${keyPath}`
  }

  const publicBase = process.env.R2_PUBLIC_URL_BASE?.replace(/\/$/, "")
  if (publicBase) {
    return `${publicBase}/${keyPath}`
  }

  const accountId = requireEnv("R2_ACCOUNT_ID")
  console.warn(
    "[R2] R2_PUBLIC_URL_BASE is not set. Public audio URLs may return 403 until you enable public access and set R2_PUBLIC_URL_BASE in .env.local",
  )
  return `https://pub-${accountId}.r2.dev/${keyPath}`
}

export async function uploadBufferToR2(
  buffer: Buffer,
  objectKey: string,
  contentType: string,
  bucketName?: string,
): Promise<string> {
  const bucket = bucketName || requireEnv("R2_BUCKET_NAME")
  const client = getR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey.replace(/^\/+/, ""),
      Body: buffer,
      ContentType: contentType,
    }),
  )

  return getR2PublicUrl(objectKey, bucket)
}

/** Stream object bytes from R2 (for authenticated playback proxy). */
export async function getR2ObjectStream(
  objectKey: string,
  options?: { bucketName?: string; range?: string },
) {
  const bucket = options?.bucketName || requireEnv("R2_BUCKET_NAME")
  const client = getR2Client()
  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey.replace(/^\/+/, ""),
      Range: options?.range,
    }),
  )
}

/** Remove an object from R2 (e.g. rollback after failed DB insert). */
export async function deleteFromR2(objectKey: string, bucketName?: string): Promise<void> {
  const bucket = bucketName || requireEnv("R2_BUCKET_NAME")
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey.replace(/^\/+/, "") }))
}
