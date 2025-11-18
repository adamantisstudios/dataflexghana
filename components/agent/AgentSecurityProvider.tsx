'use client'

import { useState, useCallback, useEffect } from 'react'
import { useInactivityLogout } from '@/hooks/use-inactivity-logout'
import { useSuspiciousActivityDetector } from '@/hooks/use-suspicious-activity-detector'
import { InactivityWarningModal } from './InactivityWarningModal'
import { SuspiciousActivityModal } from './SuspiciousActivityModal'

interface AgentSecurityProviderProps {
  children: React.ReactNode
  enabled?: boolean
  inactivityTimeoutMinutes?: number
  showWarningMinutes?: number
}

export function AgentSecurityProvider({
  children,
  enabled = true,
  inactivityTimeoutMinutes = 60,
  showWarningMinutes = 15,
}: AgentSecurityProviderProps) {
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [showSuspiciousActivity, setShowSuspiciousActivity] = useState(false)
  const [suspiciousActivityType, setSuspiciousActivityType] = useState('')

  const { handleLogout } = useInactivityLogout({
    timeoutMinutes: inactivityTimeoutMinutes,
    showWarningMinutes,
    enabled,
  })

  // Listen for inactivity warning event
  useEffect(() => {
    const handleWarning = (event: Event) => {
      const customEvent = event as CustomEvent
      setShowInactivityWarning(true)
    }

    window.addEventListener('inactivity-warning', handleWarning)
    return () => window.removeEventListener('inactivity-warning', handleWarning)
  }, [])

  const handleSuspiciousActivity = useCallback((activityType: string) => {
    setSuspiciousActivityType(activityType)
    setShowSuspiciousActivity(true)
  }, [])

  useSuspiciousActivityDetector({
    enabled,
    onSuspiciousActivity: handleSuspiciousActivity,
  })

  const handleStayActive = useCallback(() => {
    setShowInactivityWarning(false)
    // Dispatch activity event to reset inactivity timer
    window.dispatchEvent(new Event('mousedown'))
  }, [])

  return (
    <>
      {children}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        minutesRemaining={showWarningMinutes}
        onStayActive={handleStayActive}
        onLogout={handleLogout}
      />
      <SuspiciousActivityModal
        isOpen={showSuspiciousActivity}
        activityType={suspiciousActivityType}
        onDismiss={() => setShowSuspiciousActivity(false)}
      />
    </>
  )
}
