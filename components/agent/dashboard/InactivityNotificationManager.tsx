'use client'

import { useEffect, useState } from 'react'
import { useInactivityLogout } from '@/hooks/use-inactivity-logout'
import { InactivityWarningModal } from '@/components/agent/InactivityWarningModal'

interface InactivityNotificationManagerProps {
  agentId?: string
  timeoutMinutes?: number
  showWarningMinutes?: number
}

export function InactivityNotificationManager({
  agentId,
  timeoutMinutes = 60,
  showWarningMinutes = 15,
}: InactivityNotificationManagerProps) {
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  
  const { handleLogout } = useInactivityLogout({
    timeoutMinutes,
    showWarningMinutes,
    enabled: true,
  })

  // Listen for inactivity warning event
  useEffect(() => {
    const handleWarning = (event: Event) => {
      setShowInactivityWarning(true)
    }

    window.addEventListener('inactivity-warning', handleWarning)
    return () => window.removeEventListener('inactivity-warning', handleWarning)
  }, [])

  const handleStayActive = () => {
    setShowInactivityWarning(false)
    // Dispatch activity event to reset inactivity timer
    window.dispatchEvent(new Event('mousedown'))
  }

  return (
    <InactivityWarningModal
      isOpen={showInactivityWarning}
      minutesRemaining={showWarningMinutes}
      onStayActive={handleStayActive}
      onLogout={handleLogout}
    />
  )
}
