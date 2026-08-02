import { redirect } from "next/navigation"
import { fetchMaintenanceStatusServer } from "@/lib/maintenance-server"
import HomePageClient from "@/components/home-page-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const maintenance = await fetchMaintenanceStatusServer()
  if (maintenance?.isEnabled) {
    redirect("/maintenance")
  }

  return <HomePageClient />
}
