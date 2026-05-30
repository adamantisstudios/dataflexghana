"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Shield } from "lucide-react"

type Props = {
  userType: "agent" | "admin"
  pendingToken: string
  onSuccess: (payload: { agent?: unknown; admin?: unknown }) => void
  onError: (message: string) => void
  onBack?: () => void
}

export function TwoFactorLoginStep({
  userType,
  pendingToken,
  onSuccess,
  onError,
  onBack,
}: Props) {
  const [code, setCode] = useState("")
  const [rememberDevice, setRememberDevice] = useState(true)
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (!code.trim()) {
      onError("Enter your 6-digit code or a backup code")
      return
    }
    setLoading(true)
    try {
      const endpoint =
        userType === "agent" ? "/api/agent/verify-2fa" : "/api/admin/verify-2fa"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: code.trim(),
          pendingToken,
          rememberDevice,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        onError(data.error || "Invalid code")
        return
      }
      onSuccess(data)
    } catch {
      onError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex gap-2">
        <Shield className="h-5 w-5 shrink-0 text-emerald-600" />
        <p>Enter the 6-digit code from your authenticator app, or use a one-time backup code.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="2fa-login-code">Authentication code</Label>
        <Input
          id="2fa-login-code"
          inputMode="text"
          autoComplete="one-time-code"
          placeholder="000000 or backup code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-[44px] text-center text-lg font-mono tracking-widest"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember-device"
          checked={rememberDevice}
          onCheckedChange={(c) => setRememberDevice(Boolean(c))}
        />
        <Label htmlFor="remember-device" className="text-sm font-normal cursor-pointer">
          Trust this device for 30 days
        </Label>
      </div>
      <Button
        type="button"
        className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700"
        disabled={loading}
        onClick={() => void verify()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Verify and sign in
      </Button>
      {onBack && (
        <Button type="button" variant="ghost" className="w-full min-h-[44px]" onClick={onBack}>
          Back to password
        </Button>
      )}
    </div>
  )
}
