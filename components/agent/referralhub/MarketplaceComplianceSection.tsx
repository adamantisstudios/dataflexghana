"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { COMPLIANCE_FORM_SOLE_PROPRIETORSHIP } from "@/lib/storefront-catalog"
import { FileText } from "lucide-react"

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
}

interface Props {
  agentId: string
  settings: StoreSetting[]
  onSettingsChange: () => void
}

export function MarketplaceComplianceSection({ agentId, settings, onSettingsChange }: Props) {
  const enabled = settings.some(
    (s) => s.item_type === "compliance_form" && s.item_id === COMPLIANCE_FORM_SOLE_PROPRIETORSHIP && s.is_visible,
  )

  const toggle = async (visible: boolean) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
          item_type: "compliance_form",
          is_visible: visible,
          custom_margin: 0,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(visible ? "Form enabled on storefront" : "Form hidden from storefront")
      onSettingsChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  return (
    <Card id="compliance-forms-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Compliance forms
        </CardTitle>
        <CardDescription>
          Sole Proprietorship Registration — customers pay the admin base fee via Paystack, then complete the form on
          your store. Margin is locked at ₵0.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="sole-prop-toggle">Sole Proprietorship Registration</Label>
          <p className="text-xs text-muted-foreground mt-1">Shows under Business Services on your public store</p>
        </div>
        <Switch id="sole-prop-toggle" checked={enabled} onCheckedChange={toggle} />
      </CardContent>
    </Card>
  )
}
