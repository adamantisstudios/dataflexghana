import { UAParser } from "ua-parser-js"

export type SessionEnrichment = {
  country: string
  city: string
  isp: string
  proxy: boolean
  device: string
  browser: string
  os: string
}

const UNKNOWN = "Unknown"

function isPrivateOrLocalIp(ip: string): boolean {
  const t = ip.trim().toLowerCase()
  if (!t || t === "unknown") return true
  if (t === "::1" || t.startsWith("127.")) return true
  if (t.startsWith("10.")) return true
  if (t.startsWith("192.168.")) return true
  if (t.startsWith("172.")) {
    const second = parseInt(t.split(".")[1] ?? "0", 10)
    if (second >= 16 && second <= 31) return true
  }
  if (t.startsWith("fc") || t.startsWith("fd") || t.startsWith("fe80")) return true
  return false
}

function mapDeviceType(type: string | undefined): string {
  if (type === "mobile") return "Mobile"
  if (type === "tablet") return "Tablet"
  if (type === "smarttv" || type === "wearable" || type === "console") return "Desktop"
  return "Desktop"
}

function formatBrowser(ua: UAParser): string {
  const b = ua.getBrowser()
  const name = b.name?.trim()
  const version = b.version?.trim()
  if (!name) return UNKNOWN
  return version ? `${name} ${version}` : name
}

function formatOs(ua: UAParser): string {
  const o = ua.getOS()
  const name = o.name?.trim()
  const version = o.version?.trim()
  if (!name) return UNKNOWN
  return version ? `${name} ${version}` : name
}

async function fetchIpIntel(ip: string): Promise<Pick<SessionEnrichment, "country" | "city" | "isp" | "proxy">> {
  if (isPrivateOrLocalIp(ip)) {
    return { country: "Local", city: "Local", isp: "Local network", proxy: false }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)

  try {
    const encoded = encodeURIComponent(ip)
    const res = await fetch(`http://ip-api.com/json/${encoded}?fields=country,city,isp,proxy`, {
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { country: UNKNOWN, city: UNKNOWN, isp: UNKNOWN, proxy: false }
    }

    const data = (await res.json()) as {
      country?: string
      city?: string
      isp?: string
      proxy?: boolean
    }

    return {
      country: data.country?.trim() || UNKNOWN,
      city: data.city?.trim() || UNKNOWN,
      isp: data.isp?.trim() || UNKNOWN,
      proxy: Boolean(data.proxy),
    }
  } catch (err) {
    clearTimeout(timeout)
    console.warn("[security-enrichment] ip-api lookup failed:", err instanceof Error ? err.message : err)
    return { country: UNKNOWN, city: UNKNOWN, isp: UNKNOWN, proxy: false }
  }
}

/**
 * Enrich audit events with geo + device intelligence (free tier: ip-api.com + ua-parser-js).
 */
export async function enrichAuditEvent(ip: string, userAgent: string): Promise<SessionEnrichment> {
  const ua = new UAParser(userAgent || "")
  const device = mapDeviceType(ua.getDevice().type)
  const browser = formatBrowser(ua)
  const os = formatOs(ua)

  const ipIntel = await fetchIpIntel(ip || "")

  return {
    ...ipIntel,
    device,
    browser,
    os,
  }
}

/** Mask IPv4 to first three octets; IPv6 shortened for storage only. */
export function maskIpAddress(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null
  const t = ip.trim()
  if (t.includes(".")) {
    const parts = t.split(".")
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  }
  if (t.includes(":")) {
    const parts = t.split(":")
    return parts.slice(0, 4).join(":") + "::"
  }
  return null
}
