import type { ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  fetchMaintenanceStatusServer,
  shouldBypassMaintenanceServer,
} from "@/lib/maintenance-server"

function pathnameFromHeaders(headerStore: Headers): { pathname: string; known: boolean } {
  const candidates = [
    headerStore.get("x-pathname"),
    headerStore.get("x-url"),
    headerStore.get("x-middleware-request-url"),
    headerStore.get("next-url"),
  ].filter(Boolean) as string[]

  for (const requestUrl of candidates) {
    try {
      const pathname = requestUrl.startsWith("http")
        ? new URL(requestUrl).pathname
        : requestUrl.startsWith("/")
          ? requestUrl.split("?")[0]
          : `/${requestUrl.split("?")[0]}`
      return { pathname, known: true }
    } catch {
      continue
    }
  }

  return { pathname: "/", known: false }
}

export default async function MaintenanceGate({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const { pathname, known } = pathnameFromHeaders(headerStore)

  if (known && (await shouldBypassMaintenanceServer(pathname))) {
    return children
  }

  const maintenance = await fetchMaintenanceStatusServer()
  if (!maintenance?.isEnabled) {
    return children
  }

  redirect("/maintenance")
}
