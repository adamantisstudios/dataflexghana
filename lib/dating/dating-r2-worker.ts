/** Server-side client for the Cloudflare R2 upload Worker (no AWS S3 SDK). */

export function getR2WorkerConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.R2_UPLOAD_WORKER_URL?.trim().replace(/\/$/, "")
  const token = process.env.R2_WORKER_SERVICE_TOKEN?.trim()
  if (!baseUrl) {
    throw new Error("Missing environment variable: R2_UPLOAD_WORKER_URL")
  }
  if (!token) {
    throw new Error("Missing environment variable: R2_WORKER_SERVICE_TOKEN")
  }
  return { baseUrl, token }
}

function workerAuthHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/** POST multipart file to Worker; returns R2 object key. */
export async function uploadFileToR2Worker(
  file: Blob,
  filename: string,
): Promise<{ key: string }> {
  const { baseUrl, token } = getR2WorkerConfig()
  const formData = new FormData()
  formData.append("file", file, filename)

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: workerAuthHeaders(token),
    body: formData,
  })

  const body = (await res.json().catch(() => ({}))) as { key?: string; error?: string }
  if (!res.ok) {
    throw new Error(body.error || `Worker upload failed (${res.status})`)
  }
  if (!body.key) {
    throw new Error("Worker upload returned no key")
  }
  return { key: body.key }
}

/** GET object bytes from Worker by storage key. */
export async function fetchObjectFromR2Worker(key: string): Promise<Response> {
  const { baseUrl, token } = getR2WorkerConfig()
  const url = `${baseUrl}?key=${encodeURIComponent(key)}`
  return fetch(url, {
    method: "GET",
    headers: workerAuthHeaders(token),
    cache: "no-store",
  })
}

/** DELETE object from Worker/R2 by storage key. */
export async function deleteObjectFromR2Worker(key: string): Promise<void> {
  const { baseUrl, token } = getR2WorkerConfig()
  const url = `${baseUrl}?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: "DELETE",
    headers: workerAuthHeaders(token),
  })
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "")
    throw new Error(`Worker delete failed (${res.status}): ${text}`)
  }
}
