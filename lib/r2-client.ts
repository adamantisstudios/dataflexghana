import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

export function getR2Client(): S3Client {
  const accountId = requireEnv("R2_ACCOUNT_ID")
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  })
}

export function getR2PublicUrl(objectKey: string, bucketName?: string): string {
  const bucket = bucketName || requireEnv("R2_BUCKET_NAME")
  const accountId = requireEnv("R2_ACCOUNT_ID")
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/")
  return `https://pub-${accountId}.r2.dev/${bucket}/${encodedKey}`
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
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  return getR2PublicUrl(objectKey, bucket)
}

export function getAttachmentsBucketName(): string {
  return process.env.R2_ATTACHMENTS_BUCKET_NAME || "dataflex-channel-attachments"
}

/** Remove an object from R2 (e.g. rollback after failed DB insert). */
export async function deleteFromR2(objectKey: string, bucketName?: string): Promise<void> {
  const bucket = bucketName || requireEnv("R2_BUCKET_NAME")
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
}
