"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID,
  complianceFormAdminPrice,
  complianceFormAgentCommission,
  isComplianceFormSettingItemId,
} from "@/lib/storefront-catalog"
import { EarningsBadge } from "@/components/agent/referralhub/EarningsBadge"
import { FileText, Loader2 } from "lucide-react"

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
}

type AgentSubmission = {
  id: string
  form_type: string
  status: string
  created_at: string
  amount_paid?: number | null
}

interface Props {
  agentId: string
  settings: StoreSetting[]
  onSettingsChange: () => void
}

export function MarketplaceComplianceSection({ agentId, settings, onSettingsChange }: Props) {
  const [submissions, setSubmissions] = useState<AgentSubmission[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  const enabled = settings.some(
    (s) => s.item_type === "compliance_form" && isComplianceFormSettingItemId(s.item_id) && s.is_visible,
  )

  const loadSubmissions = useCallback(async () => {
    setLoadingSubs(true)
    try {
      const res = await fetch(`/api/agent/storefront/compliance-submissions?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmissions(data.submissions || [])
    } catch {
      setSubmissions([])
    } finally {
      setLoadingSubs(false)
    }
  }, [agentId])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const toggle = async (visible: boolean) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID,
          item_type: "compliance_form",
          is_visible: visible,
          custom_margin: 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      toast.success(visible ? "Form enabled on storefront" : "Form hidden from storefront")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  const agentCommission = complianceFormAgentCommission()

  return (
    <Card id="compliance-forms-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Compliance services
        </CardTitle>
        <CardDescription>
          Enable Sole Proprietorship on your store so customers can pay and complete registration on your
          storefront. Margin is locked at ₵0 — you earn a fixed commission per paid application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/50 p-4 space-y-3">
          <EarningsBadge amount={agentCommission} variant="amber" className="text-sm px-3 py-1" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="sole-prop-toggle" className="text-base font-semibold">
                Sole Proprietorship Registration
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Shows under Business Services on your public store · Customer pays GH₵
                {complianceFormAdminPrice().toFixed(0)} via Paystack
              </p>
            </div>
            <Switch id="sole-prop-toggle" checked={enabled} onCheckedChange={toggle} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Customer applications (status only)</Label>
          {loadingSubs ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submitted applications yet.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()} · {row.form_type.replace(/_/g, " ")}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {row.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
