"use client"

import { useEffect, useState } from "react"
import { checkMaintenanceMode, type MaintenanceMode } from "@/lib/maintenance-mode"
import AdminMaintenanceControl from "@/components/admin-maintenance-control"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MaintenancePanelTab() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceMode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await checkMaintenanceMode()
      if (data) setMaintenanceData(data)
      else setError("Could not load maintenance settings")
    } catch {
      setError("Failed to load maintenance mode")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading maintenance settings…</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !maintenanceData) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-red-600 text-sm">{error || "Maintenance data unavailable"}</p>
          <Button variant="outline" onClick={load}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AdminMaintenanceControl initialData={maintenanceData} />
    </div>
  )
}
