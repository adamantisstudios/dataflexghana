/**
 * Diagnostic: upload a tiny JPEG to the dating photos bucket via production R2 client config.
 * Run: npx tsx scripts/test-r2-upload.ts
 */
import { config } from "dotenv"
import { resolve } from "node:path"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getR2Client, getR2Endpoint, requireEnv } from "../lib/r2-client"
import { formatS3ErrorBody, getR2RequestLogMeta } from "../lib/r2-s3-error"

config({ path: resolve(process.cwd(), ".env.local") })

const BUCKET =
  process.env.R2_DATING_PHOTOS_BUCKET_NAME?.trim() || "dataflex-dating-photos"
const KEY = "diagnostic/test-upload.jpg"

/** Minimal valid JPEG (1x1). */
const TEST_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "base64",
)

async function main() {
  console.log("=== R2 diagnostic upload ===\n")

  const accountId = requireEnv("R2_ACCOUNT_ID")
  const endpoint = getR2Endpoint(accountId)
  const accessKeyPrefix = requireEnv("R2_ACCESS_KEY_ID").slice(0, 5)

  console.log("Env (sanitized):")
  console.log("  R2_ACCOUNT_ID length:", accountId.length)
  console.log("  endpoint:", endpoint)
  console.log("  R2_ACCESS_KEY_ID prefix:", accessKeyPrefix)
  console.log("  bucket:", BUCKET)
  console.log("  key:", KEY)
  console.log("  server UTC:", new Date().toISOString())
  console.log()

  const logMeta = getR2RequestLogMeta(BUCKET, KEY, "image/jpeg")
  console.log("Client config:", logMeta)
  console.log()

  const client = getR2Client()

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Body: TEST_JPEG,
        ContentType: "image/jpeg",
      }),
    )
    console.log("SUCCESS: uploaded", KEY, "to", BUCKET)
    process.exit(0)
  } catch (err) {
    console.error("FAILED: PutObject error\n")
    const xml = await formatS3ErrorBody(err)
    if (xml) {
      console.error("--- S3 error XML ---")
      console.error(xml)
      console.error("--- end XML ---\n")
    }
    console.error(err)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error("Unhandled:", e)
  process.exit(1)
})
