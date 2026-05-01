"use client"

import { useState } from 'react'
import { updateMaintenanceMode, type MaintenanceMode } from '@/lib/maintenance-mode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface AdminMaintenanceControlProps {
  initialData: MaintenanceMode
}

export default function AdminMaintenanceControl({ initialData }: AdminMaintenanceControlProps) {
  const [isEnabled, setIsEnabled] = useState(initialData.isEnabled)
  const [title, setTitle] = useState(initialData.title)
  const [message, setMessage] = useState(initialData.message)
  const [estimatedCompletion, setEstimatedCompletion] = useState(initialData.estimatedCompletion || '')
  const [countdownEnabled, setCountdownEnabled] = useState(initialData.countdownEnabled)
  const [countdownEndTime, setCountdownEndTime] = useState(initialData.countdownEndTime || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateMaintenanceMode({
        isEnabled,
        title,
        message,
        estimatedCompletion: estimatedCompletion || null,
        countdownEnabled,
        countdownEndTime: countdownEndTime || null,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || 'Failed to update maintenance mode')
      }
    } catch (err) {
      setError('An error occurred while updating maintenance mode')
      console.error('Error updating maintenance mode:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode Toggle</CardTitle>
          <CardDescription>Enable or disable site-wide maintenance mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-600">
                {isEnabled ? 'Site is currently in maintenance mode' : 'Site is currently operational'}
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Message</CardTitle>
          <CardDescription>Customize the message shown to users during maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., System Maintenance in Progress"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the maintenance message to display to users"
              className="min-h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Completion Time</label>
            <Input
              type="datetime-local"
              value={estimatedCompletion}
              onChange={(e) => setEstimatedCompletion(e.target.value)}
              placeholder="When do you expect maintenance to be complete?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Countdown Timer</CardTitle>
          <CardDescription>Optionally display a countdown timer to users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Countdown</p>
              <p className="text-sm text-gray-600">Display a countdown timer to completion</p>
            </div>
            <Switch checked={countdownEnabled} onCheckedChange={setCountdownEnabled} />
          </div>

          {countdownEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Countdown End Time</label>
              <Input
                type="datetime-local"
                value={countdownEndTime}
                onChange={(e) => setCountdownEndTime(e.target.value)}
                placeholder="When should the countdown end?"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Success</p>
              <p className="text-sm text-green-700">Maintenance settings updated successfully</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
