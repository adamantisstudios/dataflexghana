"use client"

import { useState, useEffect } from "react"
import AdminMaintenanceControl from "@/components/admin-maintenance-control"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import type { MaintenanceMode } from "@/lib/maintenance-mode"

async function fetchMaintenanceForAdmin(): Promise<MaintenanceMode | null> {
  const response = await fetch("/api/maintenance", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  })

  if (!response.ok) return null

  const result = await response.json()
  if (!result.success || !result.data) return null
  return result.data as MaintenanceMode
}

export default function AdminMaintenanceSystemPage() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceMode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMaintenanceData = async () => {
      try {
        const data = await fetchMaintenanceForAdmin()
        if (data) {
          setMaintenanceData(data)
        } else {
          setError("Failed to load maintenance mode data")
        }
      } catch (err) {
        console.error("Error loading maintenance data:", err)
        setError("An error occurred while loading maintenance data")
      } finally {
        setLoading(false)
      }
    }

    loadMaintenanceData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading maintenance settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !maintenanceData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              {error || "Failed to load maintenance mode data"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminMaintenanceControl initialData={maintenanceData} />
    </div>
  )
}
