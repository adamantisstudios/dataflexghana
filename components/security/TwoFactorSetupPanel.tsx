"use client"

import { useCallback, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type AuthHeadersInput = Record<string, string> | Headers

type Props = {
  userType: "agent" | "admin"
  getAuthHeaders: () => AuthHeadersInput
  onStatusChange?: (enabled: boolean) => void
  /** Compact layout for admin header dialog */
  compact?: boolean
}

const apiBase = (userType: "agent" | "admin") =>
  userType === "agent" ? "/api/agent/2fa" : "/api/admin/2fa"

function toHeaderRecord(headers: AuthHeadersInput): Record<string, string> {
  if (headers instanceof Headers) {
    const record: Record<string, string> = {}
    headers.forEach((value, key) => {
      record[key] = value
    })
    return record
  }
  return { ...headers }
}

export function TwoFactorSetupPanel({ userType, getAuthHeaders, onStatusChange, compact = false }: Props) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [pendingSetup, setPendingSetup] = useState(false)
  const [backupRemaining, setBackupRemaining] = useState(0)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [confirmCode, setConfirmCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [acting, setActing] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [copied, setCopied] = useState(false)

  const authHeaders = useCallback((): Record<string, string> => {
    return toHeaderRecord(getAuthHeaders())
  }, [getAuthHeaders])

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${apiBase(userType)}/status`, { headers: authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ||
            "Could not load 2FA status. Run migration scripts/087_two_factor_auth.sql if this is a new install.",
        )
      }
      setEnabled(Boolean(data.enabled))
      setPendingSetup(Boolean(data.pendingSetup))
      setBackupRemaining(Number(data.backupCodesRemaining ?? 0))
      onStatusChange?.(Boolean(data.enabled))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load 2FA status"
      setLoadError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [userType, authHeaders, onStatusChange])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const startSetup = async () => {
    setActing(true)
    try {
      const res = await fetch(`${apiBase(userType)}/setup`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Setup failed")
      setOtpauthUrl(data.otpauthUrl)
      setSecret(data.secret)
      setPendingSetup(true)
      toast.success("Scan the QR code with Google Authenticator or similar")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Setup failed")
    } finally {
      setActing(false)
    }
  }

  const confirmSetup = async () => {
    if (!confirmCode.trim()) {
      toast.error("Enter the 6-digit code from your app")
      return
    }
    setActing(true)
    try {
      const res = await fetch(`${apiBase(userType)}/confirm`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ code: confirmCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Verification failed")
      setBackupCodes(data.backupCodes ?? [])
      setEnabled(true)
      setPendingSetup(false)
      setOtpauthUrl(null)
      setConfirmCode("")
      onStatusChange?.(true)
      toast.success("Two-factor authentication enabled")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed")
    } finally {
      setActing(false)
    }
  }

  const disable2fa = async () => {
    setActing(true)
    try {
      const res = await fetch(`${apiBase(userType)}/disable`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not disable 2FA")
      setEnabled(false)
      setBackupCodes(null)
      setSecret(null)
      setOtpauthUrl(null)
      setDisablePassword("")
      onStatusChange?.(false)
      toast.success("Two-factor authentication disabled")
      void loadStatus()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Disable failed")
    } finally {
      setActing(false)
    }
  }

  const copySecret = () => {
    if (!secret) return
    void navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const accountHint =
    userType === "agent"
      ? "Your phone number appears as the account name in the authenticator app."
      : "Your admin email appears as the account name in the authenticator app."

  return (
    <Card
      id="two-factor-authentication"
      className="overflow-hidden border-2 border-[#0E8F3D]/25 shadow-lg rounded-2xl bg-white"
    >
      <CardHeader
        className={`border-b border-[#0E8F3D]/15 bg-gradient-to-r from-[#0E8F3D]/10 via-emerald-50/80 to-white ${compact ? "py-4" : "py-5"}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E8F3D] to-[#35B24A] text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className={`text-[#0A5C2A] ${compact ? "text-base" : "text-lg sm:text-xl"}`}>
              Two-Factor Authentication (2FA)
            </CardTitle>
            <CardDescription className="text-sm text-[#0A5C2A]/80 mt-1">
              Free TOTP security with Google Authenticator, Microsoft Authenticator, or Authy. {accountHint}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${compact ? "p-4" : "p-4 sm:p-6"}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
            <p className="text-sm text-muted-foreground">Loading security settings…</p>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{loadError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] border-[#0E8F3D]/40 text-[#0E8F3D] hover:bg-emerald-50"
              onClick={() => void loadStatus()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {enabled ? (
                <Badge className="bg-[#0E8F3D] hover:bg-[#0A5C2A] text-white gap-1 px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> 2FA enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-slate-300 text-slate-700 px-3 py-1">
                  <ShieldOff className="h-3.5 w-3.5" /> 2FA off
                </Badge>
              )}
              {enabled && backupRemaining > 0 && (
                <span className="text-xs text-muted-foreground">{backupRemaining} backup codes remaining</span>
              )}
              {pendingSetup && !enabled && (
                <Badge variant="secondary" className="text-amber-800 bg-amber-100">
                  Setup in progress
                </Badge>
              )}
            </div>

            {backupCodes && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
                <p className="font-semibold text-amber-900 text-sm">Save these backup codes now</p>
                <p className="text-xs text-amber-800">Each code works once. Store them offline in a safe place.</p>
                <ul className="font-mono text-sm grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {backupCodes.map((c) => (
                    <li key={c} className="bg-white rounded-lg px-2 py-1.5 border border-amber-200">
                      {c}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => setBackupCodes(null)}
                >
                  I have saved my codes
                </Button>
              </div>
            )}

            {!enabled && !otpauthUrl && (
              <Button
                type="button"
                className="w-full min-h-[48px] bg-gradient-to-r from-[#0E8F3D] to-[#35B24A] hover:from-[#0A5C2A] hover:to-[#0E8F3D] text-white shadow-md"
                onClick={() => void startSetup()}
                disabled={acting}
              >
                {acting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Enable Two-Factor Authentication
              </Button>
            )}

            {otpauthUrl && secret && !enabled && (
              <div className="space-y-4 rounded-xl border border-[#0E8F3D]/20 bg-gradient-to-b from-emerald-50/50 to-white p-4">
                <p className="text-sm font-semibold text-[#0A5C2A]">1. Scan this QR code</p>
                <div className="flex justify-center p-4 bg-white rounded-xl border border-[#0E8F3D]/15 shadow-inner">
                  <QRCodeSVG value={otpauthUrl} size={compact ? 160 : 200} level="M" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#0A5C2A]">2. Or enter this secret manually</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs break-all bg-white border border-[#0E8F3D]/20 rounded-lg p-3 font-mono">
                      {secret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] shrink-0 border-[#0E8F3D]/30"
                      onClick={copySecret}
                      title="Copy secret"
                    >
                      {copied ? <Check className="h-4 w-4 text-[#0E8F3D]" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`2fa-confirm-${userType}`} className="text-[#0A5C2A]">
                    3. Enter the 6-digit code to confirm
                  </Label>
                  <Input
                    id={`2fa-confirm-${userType}`}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="min-h-[48px] text-lg tracking-[0.3em] text-center font-mono border-[#0E8F3D]/30 focus-visible:ring-[#0E8F3D]"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full min-h-[48px] bg-gradient-to-r from-[#0E8F3D] to-[#35B24A] hover:from-[#0A5C2A] hover:to-[#0E8F3D] text-white"
                  disabled={acting || confirmCode.length !== 6}
                  onClick={() => void confirmSetup()}
                >
                  {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm and enable 2FA
                </Button>
              </div>
            )}

            {enabled && (
              <div className="space-y-3 pt-2 border-t border-[#0E8F3D]/15">
                <p className="text-sm text-muted-foreground">
                  To disable 2FA, enter your account password below.
                </p>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="min-h-[48px] border-[#0E8F3D]/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[48px] border-red-200 text-red-700 hover:bg-red-50"
                  disabled={acting || !disablePassword}
                  onClick={() => void disable2fa()}
                >
                  Disable two-factor authentication
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
