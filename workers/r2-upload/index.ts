/**
 * Cloudflare Worker: private R2 upload/serve for dating photos.
 * Bind bucket as BUCKET; set SERVICE_TOKEN secret (wrangler secret put SERVICE_TOKEN).
 */

export interface Env {
  BUCKET: R2Bucket
  SERVICE_TOKEN: string
}

function isAuthorized(request: Request, env: Env): boolean {
  const auth = request.headers.get("Authorization")?.trim() ?? ""
  const token = env.SERVICE_TOKEN?.trim() ?? ""
  if (!token) return false
  return auth === `Bearer ${token}` || auth === token
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

async function handlePost(request: Request, env: Env): Promise<Response> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError("Invalid form data", 400)
  }

  const entry = formData.get("file")
  if (!entry || typeof entry === "string") {
    return jsonError("Missing form field: file", 400)
  }

  const file = entry as File
  const rawName = file.name || "upload.jpg"
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload.jpg"
  const key = `uploads/${crypto.randomUUID()}-${safeName}`
  const contentType = file.type?.trim() || "application/octet-stream"

  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType },
  })

  return Response.json({ key })
}

async function handleGet(key: string, env: Env): Promise<Response> {
  const object = await env.BUCKET.get(key)
  if (!object) {
    return new Response("Not Found", { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set("etag", object.httpEtag)
  headers.set("Cache-Control", "private, max-age=3600")

  return new Response(object.body, { status: 200, headers })
}

async function handleDelete(key: string, env: Env): Promise<Response> {
  await env.BUCKET.delete(key)
  return new Response(null, { status: 204 })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) {
      return new Response("Unauthorized", { status: 401 })
    }

    const url = new URL(request.url)

    if (request.method === "POST") {
      return handlePost(request, env)
    }

    if (request.method === "GET") {
      const key = url.searchParams.get("key")?.trim()
      if (!key) return jsonError("Missing query param: key", 400)
      return handleGet(key, env)
    }

    if (request.method === "DELETE") {
      const key = url.searchParams.get("key")?.trim()
      if (!key) return jsonError("Missing query param: key", 400)
      return handleDelete(key, env)
    }

    return new Response("Method Not Allowed", { status: 405 })
  },
}
