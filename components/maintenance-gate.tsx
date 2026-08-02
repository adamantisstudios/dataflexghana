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

function isMaintenanceRequest(headerStore: Headers): boolean {
  const candidates = [
    headerStore.get("x-pathname"),
    headerStore.get("x-url"),
    headerStore.get("x-middleware-request-url"),
    headerStore.get("next-url"),
    headerStore.get("referer"),
  ].filter(Boolean) as string[]

  return candidates.some((value) => {
    try {
      const path = value.startsWith("http") ? new URL(value).pathname : value.split("?")[0]
      return path === "/maintenance" || path.startsWith("/api/maintenance")
    } catch {
      return value.includes("/maintenance")
    }
  })
}

export default async function MaintenanceGate({ children }: { children: ReactNode }) {
  const headerStore = await headers()

  if (isMaintenanceRequest(headerStore)) {
    return children
  }

  const { pathname, known } = pathnameFromHeaders(headerStore)

  if (known && (await shouldBypassMaintenanceServer(pathname))) {
    return children
  }

  const maintenance = await fetchMaintenanceStatusServer()
  if (!maintenance?.isEnabled) {
    return children
  }

  if (known && !(await shouldBypassMaintenanceServer(pathname))) {
    redirect("/maintenance")
  }

  return children
}
