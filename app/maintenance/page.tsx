import { fetchMaintenanceStatusServer } from "@/lib/maintenance-server"
import MaintenancePage from "@/components/maintenance-page"
import { redirect } from "next/navigation"
import type { MaintenanceMode } from "@/lib/maintenance-mode"

const FALLBACK_MAINTENANCE: MaintenanceMode = {
  isEnabled: true,
  title: "Site Under Maintenance",
  message:
    "We are currently performing scheduled maintenance. Please check back later.",
  countdownEnabled: false,
  updatedAt: new Date().toISOString(),
}

export default async function Maintenance() {
  const maintenanceData = await fetchMaintenanceStatusServer()

  if (!maintenanceData?.isEnabled) {
    redirect("/")
  }

  return <MaintenancePage maintenanceData={maintenanceData ?? FALLBACK_MAINTENANCE} />
}

export const dynamic = "force-dynamic"
export const revalidate = 0
