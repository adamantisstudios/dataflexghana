import { checkMaintenanceMode } from '@/lib/maintenance-mode'
import MaintenancePage from '@/components/maintenance-page'
import { redirect } from 'next/navigation'

export default async function Maintenance() {
  try {
    const maintenanceData = await checkMaintenanceMode()
    
    // If maintenance is not enabled, redirect to home
    if (!maintenanceData || !maintenanceData.isEnabled) {
      redirect('/')
    }

    return <MaintenancePage maintenanceData={maintenanceData} />
  } catch (error) {
    console.error('Error loading maintenance page:', error)
    // If there's an error, redirect to home to prevent infinite loops
    redirect('/')
  }
}

// Disable caching for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0
