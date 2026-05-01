"use client"

import { useState } from "react"
import { Lock, Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminPortalAccessProps {
  agentId: string
  agentName: string
}

export default function AdminPortalAccess({ agentId, agentName }: AdminPortalAccessProps) {
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleRequestAccess = async () => {
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address")
      return
    }

    setRequestStatus("loading")
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/portal-access-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agentId,
          agentName,
          email,
          requestedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        setRequestStatus("sent")
        setEmail("")
        setTimeout(() => setRequestStatus("idle"), 3000)
      } else {
        throw new Error("Failed to send request")
      }
    } catch (error) {
      setRequestStatus("error")
      setErrorMessage("Failed to send access request. Please try again.")
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Lock className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
          <div>
            <CardTitle>Admin Portal Access</CardTitle>
            <CardDescription>
              Request elevated permissions to access advanced features
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="border-amber-300 bg-white">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 ml-2">
            Admin portal access is restricted. Submit a request to gain elevated permissions for your account.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="admin-email">Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={requestStatus === "loading"}
              className="mt-2"
            />
            <p className="text-xs text-gray-600 mt-2">
              We&apos;ll use this email to send you access details
            </p>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {requestStatus === "sent" && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 ml-2">
                ✓ Request sent successfully! Check your email for further instructions.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={handleRequestAccess}
          disabled={requestStatus === "loading" || !email}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {requestStatus === "loading" ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Sending Request...
            </>
          ) : requestStatus === "sent" ? (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Request Sent
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Request Admin Access
            </>
          )}
        </Button>

        <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
          <p className="font-semibold text-gray-900">Access includes:</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Advanced analytics and reporting</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Custom agent management features</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Bulk operations and automation</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Financial reconciliation tools</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-600 text-center">
          Requests are reviewed by our admin team within 24 hours
        </p>
      </CardContent>
    </Card>
  )
}
