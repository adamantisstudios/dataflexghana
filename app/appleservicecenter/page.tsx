import type { Metadata } from "next"
import ClientAppleServiceCenterPage from "./client-page"
import { appleServiceCenterMetadata } from "./metadata"

export const metadata: Metadata = appleServiceCenterMetadata

export default function AppleServiceCenterPage() {
  return <ClientAppleServiceCenterPage />
}
