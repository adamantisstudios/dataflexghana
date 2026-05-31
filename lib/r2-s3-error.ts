import { getR2Endpoint, requireEnv } from "@/lib/r2-client"

/** Metadata safe to log for R2 PutObject debugging (no secrets). */
export function getR2RequestLogMeta(bucket: string, key: string, contentType: string) {
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID")
  return {
    endpoint: getR2Endpoint(),
    region: "auto",
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED" as const,
    responseChecksumValidation: "WHEN_REQUIRED" as const,
    bucket,
    key,
    contentType,
    accessKeyIdPrefix: accessKeyId.slice(0, 5),
    serverUtc: new Date().toISOString(),
  }
}

/** Extract raw S3/R2 error XML or body from AWS SDK v3 errors. */
export async function formatS3ErrorBody(err: unknown): Promise<string | undefined> {
  if (!err || typeof err !== "object") return undefined
  const e = err as {
    $response?: { body?: unknown; statusCode?: number }
    response?: { body?: unknown; statusCode?: number }
  }
  const body = e.$response?.body ?? e.response?.body
  if (body == null) return undefined

  try {
    if (typeof body === "string") return body
    if (body instanceof Uint8Array) return new TextDecoder().decode(body)
    const withTransform = body as { transformToString?: () => Promise<string> }
    if (typeof withTransform.transformToString === "function") {
      return await withTransform.transformToString()
    }
    return String(body)
  } catch (readErr) {
    return `[could not read S3 error body: ${readErr instanceof Error ? readErr.message : String(readErr)}]`
  }
}

export async function logS3PutObjectError(
  label: string,
  err: unknown,
  meta: ReturnType<typeof getR2RequestLogMeta> & { bytes?: number },
): Promise<void> {
  const xml = await formatS3ErrorBody(err)
  const awsErr = err as {
    name?: string
    message?: string
    Code?: string
    $metadata?: { httpStatusCode?: number; requestId?: string }
    stack?: string
  }
  console.error(`[${label}] R2 PutObject failed:`, {
    ...meta,
    errorName: awsErr.name,
    errorMessage: awsErr.message,
    errorCode: awsErr.Code,
    httpStatusCode: awsErr.$metadata?.httpStatusCode,
    requestId: awsErr.$metadata?.requestId,
    s3ErrorXml: xml,
    stack: awsErr.stack,
  })
}
