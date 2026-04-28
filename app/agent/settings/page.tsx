"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase, hashPassword, verifyPassword, type Agent } from "@/lib/supabase"
import { ArrowLeft, Eye, EyeOff, Trash2, Key, User, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AgentSettingsPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      router.push("/agent/login")
      return
    }
    setAgent(JSON.parse(agentData))
  }, [router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!agent) return

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert("New passwords do not match")
        return
      }

      if (passwordForm.newPassword.length < 6) {
        alert("New password must be at least 6 characters long")
        return
      }

      // Verify current password
      const { data: currentAgent } = await supabase.from("agents").select("password_hash").eq("id", agent.id).single()

      if (
        !currentAgent?.password_hash ||
        !(await verifyPassword(passwordForm.currentPassword, currentAgent.password_hash))
      ) {
        alert("Current password is incorrect")
        return
      }

      // Hash new password and update
      const newPasswordHash = await hashPassword(passwordForm.newPassword)
      const { error } = await supabase.from("agents").update({ password_hash: newPasswordHash }).eq("id", agent.id)

      if (error) throw error

      alert("Password updated successfully!")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("Error updating password:", error)
      alert("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!agent) return

    if (deleteConfirm !== agent.phone_number) {
      alert("Phone number confirmation does not match")
      return
    }

    setLoading(true)
    try {
      // Delete agent account and all related data
      const { error } = await supabase.from("agents").delete().eq("id", agent.id)

      if (error) throw error

      localStorage.removeItem("agent")
      alert("Account deleted successfully")
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Failed to delete account")
    } finally {
      setLoading(false)
    }
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-9 w-9 sm:h-10 sm:w-auto sm:px-3 bg-gray-100 hover:bg-gray-200"
              >
                <Link href="/agent/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
              </Button>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">
                  {agent.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Agent Portal</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Account Info Card */}
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Account Information</CardTitle>
                  <CardDescription className="text-sm">Your personal details and account settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Full Name</Label>
                  <p className="text-sm font-medium text-gray-900">{agent.full_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Phone Number</Label>
                  <p className="text-sm font-medium text-gray-900">{agent.phone_number}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Account Type</Label>
                  <p className="text-sm font-medium text-gray-900">Agent Account</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Account Status</Label>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Key className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Change Password</CardTitle>
                  <CardDescription className="text-sm">
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password (min. 6 characters)"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security & Privacy Card */}
          <Card className="overflow-hidden border border-red-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Security & Privacy</CardTitle>
                  <CardDescription className="text-sm">
                    Manage your account security and privacy settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">Delete Account</h4>
                      <p className="text-sm text-red-700">
                        Permanently delete your agent account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account Permanently
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        This will permanently delete your agent account and remove all your data from our servers.
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                          Type your phone number to confirm:
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg mb-2">
                          <code className="text-sm font-bold text-gray-900">{agent.phone_number}</code>
                        </div>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="Enter phone number exactly as shown"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        className="w-full sm:w-auto order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={loading || deleteConfirm !== agent.phone_number}
                        className="w-full sm:w-auto order-1 sm:order-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          "Permanently Delete Account"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
