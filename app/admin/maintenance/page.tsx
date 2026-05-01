"use client"

import { useState, useEffect } from 'react'
import { checkMaintenanceMode, type MaintenanceMode } from '@/lib/maintenance-mode'
import AdminMaintenanceControl from '@/components/admin-maintenance-control'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

export default function AdminMaintenancePage() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceMode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMaintenanceData = async () => {
      try {
        const data = await checkMaintenanceMode()
        if (data) {
          setMaintenanceData(data)
        } else {
          setError('Failed to load maintenance mode data')
        }
      } catch (err) {
        console.error('Error loading maintenance data:', err)
        setError('An error occurred while loading maintenance data')
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
              {error || 'Failed to load maintenance mode data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Please check your database connection and ensure the maintenance_mode table exists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Maintenance Mode Management
        </h1>
        <p className="text-gray-600">
          Control site-wide maintenance mode and manage user access during system updates.
        </p>
      </div>
      
      <AdminMaintenanceControl initialData={maintenanceData} />
    </div>
  )
}
