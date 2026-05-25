"use client"

import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getAgentInitials } from "@/lib/agent-profile-completion"
import type { Agent } from "@/lib/supabase"
import { Mail, Briefcase, MapPin, Phone, Calendar } from "lucide-react"
import { AgentCallHistorySection } from "@/components/admin/AgentCallHistorySection"

type AgentDetail = Agent & {
  wallet_balance?: number
  commission_balance?: number
  momo_number?: string
}

type Props = {
  agent: AgentDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(d: string | undefined) {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

export function AgentProfileDetailDialog({ agent, open, onOpenChange }: Props) {
  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
            {agent.profile_image_url ? (
              <Image
                src={agent.profile_image_url}
                alt={agent.full_name}
                width={120}
                height={120}
                className="h-28 w-28 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
              />
            ) : (
              <div className="h-28 w-28 rounded-2xl bg-[#0E8F3D] text-white text-2xl font-bold flex items-center justify-center">
                {getAgentInitials(agent.full_name)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agent.full_name}</h3>
              <Badge
                className={
                  agent.isapproved
                    ? "mt-2 bg-emerald-100 text-emerald-800"
                    : "mt-2 bg-amber-100 text-amber-800"
                }
              >
                {agent.isapproved ? "Approved" : "Pending"}
              </Badge>
            </div>
          </div>

          <dl className="grid gap-3 text-sm">
            <div className="flex gap-2">
              <Phone className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium">{agent.phone_number || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Mail className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium break-all">{agent.email?.trim() || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Briefcase className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">Profession</dt>
                <dd className="font-medium">{agent.profession?.trim() || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">Exact location</dt>
                <dd className="font-medium">{agent.exact_location?.trim() || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">Region</dt>
                <dd className="font-medium">{agent.region || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Phone className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">MoMo</dt>
                <dd className="font-medium">{agent.momo_number || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <dt className="text-gray-500">Joined</dt>
                <dd className="font-medium">{formatDate(agent.created_at)}</dd>
              </div>
            </div>
          </dl>

          {(agent.wallet_balance != null || agent.commission_balance != null) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-xs text-blue-600">Wallet</p>
                <p className="font-bold text-blue-900">₵{Number(agent.wallet_balance ?? 0).toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs text-green-600">Commission</p>
                <p className="font-bold text-green-900">₵{Number(agent.commission_balance ?? 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          <AgentCallHistorySection agentId={agent.id} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
