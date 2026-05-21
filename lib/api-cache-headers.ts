import { NextResponse } from "next/server"

/** Short-lived cache for frequently polled read-only GET APIs. */
export const READ_ONLY_GET_CACHE_CONTROL =
  "public, max-age=60, stale-while-revalidate=300"

export function jsonWithReadOnlyGetCache<T>(body: T, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", READ_ONLY_GET_CACHE_CONTROL)
  return response
}
