'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle } from 'lucide-react'

interface InactivityWarningModalProps {
  isOpen: boolean
  minutesRemaining: number
  onStayActive: () => void
  onLogout: () => void
}

export function InactivityWarningModal({
  isOpen,
  minutesRemaining,
  onStayActive,
  onLogout,
}: InactivityWarningModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(minutesRemaining * 60)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onLogout])

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(minutesRemaining * 60)
    }
  }, [isOpen, minutesRemaining])

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onStayActive()
    }}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full animate-pulse">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl text-orange-900">Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription className="text-orange-800 text-base pt-2">
            Your session will expire due to inactivity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-orange-100/50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium mb-2">Time Remaining:</p>
                <p className="text-3xl font-bold text-orange-900 font-mono">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Click <strong>Stay Active</strong> to continue your session and reset the inactivity timer.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Logout
          </Button>
          <Button
            onClick={onStayActive}
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
          >
            Stay Active
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
