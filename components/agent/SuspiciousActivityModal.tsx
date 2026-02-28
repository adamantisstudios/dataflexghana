'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, Lock } from 'lucide-react'

interface SuspiciousActivityModalProps {
  isOpen: boolean
  activityType: string
  onDismiss: () => void
}

export function SuspiciousActivityModal({ isOpen, activityType, onDismiss }: SuspiciousActivityModalProps) {
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onDismiss])

  const getActivityMessage = (type: string) => {
    const messages: Record<string, { title: string; description: string }> = {
      devtools_console: {
        title: 'Developer Tools Detected',
        description: 'Attempting to access developer console is not permitted for security reasons. Please close all developer tools.',
      },
      devtools_debugger: {
        title: 'Debugger Detected',
        description: 'Debug mode has been activated. For your account security, please disable debugging tools.',
      },
      keyboard_shortcut_F12: {
        title: 'Developer Tools Shortcut Detected',
        description: 'F12 developer tools shortcut was detected. Please use the application interface only.',
      },
      keyboard_shortcut_I: {
        title: 'Inspector Shortcut Detected',
        description: 'Inspect element shortcut (Ctrl+Shift+I) was detected. Please avoid using developer tools.',
      },
      keyboard_shortcut_J: {
        title: 'Console Shortcut Detected',
        description: 'Console shortcut (Ctrl+Shift+J) was detected. Please avoid using developer tools.',
      },
      keyboard_shortcut_C: {
        title: 'Inspector Shortcut Detected',
        description: 'Inspector shortcut (Ctrl+Shift+C) was detected. Please avoid using developer tools.',
      },
      keyboard_shortcut_U: {
        title: 'View Source Detected',
        description: 'View source shortcut (Ctrl+U) was detected. Please use the application normally.',
      },
    }

    return messages[type] || {
      title: 'Suspicious Activity Detected',
      description: 'Suspicious behavior has been detected on your account.',
    }
  }

  const message = getActivityMessage(activityType)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-red-50 border-2 border-red-300 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl text-red-900">{message.title}</DialogTitle>
          </div>
          <DialogDescription className="text-red-800 text-base pt-2">{message.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-100/50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Security Notice</h4>
                <p className="text-sm text-red-800">
                  For your account security, accessing developer tools or using keyboard shortcuts is restricted. Close all developer tools and continue using the application normally.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100/50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">What to do</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Close all browser developer tools</li>
                  <li>Avoid using keyboard shortcuts for inspection</li>
                  <li>Use the application interface normally</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-red-200">
          <p className="text-sm text-red-700 font-medium">Modal closes in {timeLeft}s</p>
          <Button
            onClick={onDismiss}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
