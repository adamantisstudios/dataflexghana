"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Power,
  PowerOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  History,
  Calendar,
  Timer,
  Save,
  RefreshCw,
  Shield,
  Phone,
  Users,
  Eye,
  EyeOff,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  updateMaintenanceMode,
  getMaintenanceLogs,
  formatTimeRemaining,
  SPECIAL_TEST_PHONE,
  type MaintenanceMode,
  type MaintenanceLog
} from '@/lib/maintenance-mode'

interface AdminMaintenanceControlProps {
  initialData: MaintenanceMode
}

export default function AdminMaintenanceControl({ initialData }: AdminMaintenanceControlProps) {
  const { toast } = useToast()
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceMode>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [showTestInfo, setShowTestInfo] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    isEnabled: initialData.isEnabled,
    title: initialData.title,
    message: initialData.message,
    countdownEnabled: initialData.countdownEnabled,
    countdownEndTime: initialData.countdownEndTime ?
      new Date(initialData.countdownEndTime).toISOString().slice(0, 16) : '',
    estimatedCompletion: initialData.estimatedCompletion ?
      new Date(initialData.estimatedCompletion).toISOString().slice(0, 16) : ''
  })

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)

  // Update countdown display
  useEffect(() => {
    if (!formData.countdownEnabled || !formData.countdownEndTime) {
      setTimeRemaining(null)
      return
    }

    const updateCountdown = () => {
      const remaining = formatTimeRemaining(formData.countdownEndTime)
      setTimeRemaining(remaining)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [formData.countdownEnabled, formData.countdownEndTime])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleQuickToggle = async () => {
    setIsLoading(true)
    try {
      const result = await updateMaintenanceMode({
        isEnabled: !maintenanceData.isEnabled,
        title: maintenanceData.title,
        message: maintenanceData.message,
        countdownEnabled: maintenanceData.countdownEnabled,
        countdownEndTime: maintenanceData.countdownEndTime
      })

      if (result.success && result.data) {
        setMaintenanceData(result.data)
        setFormData(prev => ({ ...prev, isEnabled: result.data!.isEnabled }))
        toast({
          title: "Success",
          description: `Maintenance mode ${result.data.isEnabled ? 'enabled' : 'disabled'} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update maintenance mode",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const result = await updateMaintenanceMode({
        isEnabled: formData.isEnabled,
        title: formData.title || 'Site Under Maintenance',
        message: formData.message || 'We are currently performing scheduled maintenance to improve your experience. All pending orders and transactions will be processed once maintenance is complete. Thank you for your patience.',
        countdownEnabled: formData.countdownEnabled,
        countdownEndTime: formData.countdownEndTime || null,
        estimatedCompletion: formData.estimatedCompletion || null
      })

      if (result.success && result.data) {
        setMaintenanceData(result.data)
        toast({
          title: "Success",
          description: "Maintenance mode settings updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update maintenance mode",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const result = await getMaintenanceLogs(1, 10)
      if (result.success && result.data) {
        setLogs(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load maintenance logs",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load maintenance logs",
        variant: "destructive"
      })
    } finally {
      setLogsLoading(false)
    }
  }

  const setQuickCountdown = (hours: number) => {
    const endTime = new Date()
    endTime.setHours(endTime.getHours() + hours)
    handleInputChange('countdownEndTime', endTime.toISOString().slice(0, 16))
    handleInputChange('countdownEnabled', true)
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-none">
      {/* Status Overview */}
      <Card className="w-full">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Maintenance Mode Control</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Control site-wide maintenance mode for all users except admins and special test accounts
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Badge
                variant={maintenanceData.isEnabled ? "destructive" : "default"}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 w-full sm:w-fit justify-center"
              >
                {maintenanceData.isEnabled ? (
                  <>
                    <PowerOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    MAINTENANCE ON
                  </>
                ) : (
                  <>
                    <Power className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    SITE ACTIVE
                  </>
                )}
              </Badge>
              <Button
                onClick={handleQuickToggle}
                disabled={isLoading}
                variant={maintenanceData.isEnabled ? "default" : "destructive"}
                size="sm"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] text-sm"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                ) : maintenanceData.isEnabled ? (
                  <Power className="w-4 h-4 mr-2 flex-shrink-0" />
                ) : (
                  <PowerOff className="w-4 h-4 mr-2 flex-shrink-0" />
                )}
                <span className="truncate">{maintenanceData.isEnabled ? 'Disable' : 'Enable'} Maintenance</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Status */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Last Updated: {new Date(maintenanceData.updatedAt).toLocaleString()}</span>
              </div>

              {maintenanceData.isEnabled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 w-full">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2 text-sm sm:text-base">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words">Site is currently in maintenance mode</span>
                  </div>
                  <p className="text-xs sm:text-sm text-red-700 mb-3 break-words">
                    All users (except admins and special test accounts) will see the maintenance page
                  </p>
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>Affected: All regular users and agents</span>
                  </div>
                </div>
              )}

              {!maintenanceData.isEnabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 w-full">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words">Site is active and accessible</span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-700 break-words">
                    All users can access the platform normally
                  </p>
                </div>
              )}
            </div>

            {/* Countdown Display */}
            {maintenanceData.countdownEnabled && maintenanceData.countdownEndTime && timeRemaining && timeRemaining.total > 0 && (
              <div className="space-y-4 min-w-0">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <Timer className="w-4 h-4 flex-shrink-0" />
                  Active Countdown
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Days', value: timeRemaining.days },
                    { label: 'Hours', value: timeRemaining.hours },
                    { label: 'Minutes', value: timeRemaining.minutes },
                    { label: 'Seconds', value: timeRemaining.seconds }
                  ].map((item, index) => (
                    <div key={index} className="bg-blue-100 rounded-lg p-2 text-center min-w-0">
                      <div className="text-base sm:text-lg font-bold text-blue-800 truncate">
                        {item.value.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-blue-600 truncate">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Special Test Account Information */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Bypass Accounts Information
              </CardTitle>
              <CardDescription className="text-sm">
                Accounts that can access the site during maintenance mode
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestInfo(!showTestInfo)}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            >
              {showTestInfo ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showTestInfo ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>
        {showTestInfo && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-800 text-sm sm:text-base">Admin Accounts</p>
                    <p className="text-xs sm:text-sm text-blue-600">All admin users bypass maintenance mode automatically</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-green-800 text-sm sm:text-base">Special Test Account</p>
                    <p className="text-xs sm:text-sm text-green-600 font-mono break-all">{SPECIAL_TEST_PHONE}</p>
                    <p className="text-xs text-green-500 mt-1">This agent can login and test during maintenance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">Testing Instructions:</p>
                  <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                    <li>• The special test account ({SPECIAL_TEST_PHONE}) can login as an agent during maintenance</li>
                    <li>• This account will bypass maintenance mode and access all agent features</li>
                    <li>• Use this account to test functionality while maintenance mode is active</li>
                    <li>• All other users and agents will see the maintenance page</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Maintenance Settings</CardTitle>
          <CardDescription className="text-sm">
            Configure maintenance mode message, countdown, and other settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-enabled" className="text-sm sm:text-base">Enable Maintenance Mode</Label>
                <Switch
                  id="maintenance-enabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => handleInputChange('isEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-title" className="text-sm sm:text-base">Page Title</Label>
                <Input
                  id="maintenance-title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Site Under Maintenance"
                  className="min-h-[44px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-completion" className="text-sm sm:text-base">Estimated Completion</Label>
                <Input
                  id="estimated-completion"
                  type="datetime-local"
                  value={formData.estimatedCompletion}
                  onChange={(e) => handleInputChange('estimatedCompletion', e.target.value)}
                  className="min-h-[44px] sm:min-h-[36px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="countdown-enabled" className="text-sm sm:text-base">Enable Countdown Timer</Label>
                <Switch
                  id="countdown-enabled"
                  checked={formData.countdownEnabled}
                  onCheckedChange={(checked) => handleInputChange('countdownEnabled', checked)}
                />
              </div>

              {formData.countdownEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="countdown-end" className="text-sm sm:text-base">Countdown End Time</Label>
                    <Input
                      id="countdown-end"
                      type="datetime-local"
                      value={formData.countdownEndTime}
                      onChange={(e) => handleInputChange('countdownEndTime', e.target.value)}
                      className="min-h-[44px] sm:min-h-[36px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Quick Set Countdown</Label>
                    <div className="grid grid-cols-2 sm:flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickCountdown(1)}
                        className="min-h-[44px] sm:min-h-[36px]"
                      >
                        1 Hour
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickCountdown(2)}
                        className="min-h-[44px] sm:min-h-[36px]"
                      >
                        2 Hours
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickCountdown(6)}
                        className="min-h-[44px] sm:min-h-[36px]"
                      >
                        6 Hours
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickCountdown(24)}
                        className="min-h-[44px] sm:min-h-[36px]"
                      >
                        24 Hours
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Message Settings */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-message" className="text-sm sm:text-base">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="We are currently performing scheduled maintenance to improve your experience. All pending orders and transactions will be processed once maintenance is complete. Thank you for your patience."
              rows={4}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs sm:text-sm text-gray-500">
              This message will be displayed to users during maintenance mode
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveSettings} 
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Logs */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                Maintenance History
              </CardTitle>
              <CardDescription className="text-sm">
                Recent maintenance mode changes and activities
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLogs(!showLogs)
                if (!showLogs && logs.length === 0) {
                  loadLogs()
                }
              }}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
          </div>
        </CardHeader>
        {showLogs && (
          <CardContent className="pt-0">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                    <Badge
                      variant={log.action === 'enabled' ? 'destructive' : 'default'}
                      className="text-xs sm:text-sm"
                    >
                      {log.action}
                    </Badge>
                    <div className="min-w-0 break-words w-full">
                      <p className="text-xs sm:text-sm font-medium">
                        Maintenance mode {log.action} by {log.admin_email}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8 text-sm">No maintenance logs found</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
