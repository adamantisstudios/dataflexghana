"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Loader2, Phone } from "lucide-react"

type CallRow = {
  id: string
  call_date: string
  call_status: string
  follow_up_required: boolean
  follow_up_date: string | null
  discussion_notes: string | null
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  no_answer: "No Answer",
  voicemail: "Voicemail",
  scheduled: "Scheduled",
}

export function AgentCallHistorySection({ agentId }: { agentId: string }) {
  const [logs, setLogs] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/agent-calls?agent_id=${encodeURIComponent(agentId)}&limit=5`,
        { headers: getAdminAuthHeaders() },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLogs(data.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="pt-4 border-t space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <Phone className="h-4 w-4" /> Call History
        </h4>
        <Link
          href={`/admin/agent-calls?agent_id=${encodeURIComponent(agentId)}`}
          className="text-xs text-blue-600 hover:underline"
        >
          View all
        </Link>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No calls logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="text-xs rounded-lg bg-slate-50 border px-2 py-1.5">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{STATUS_LABELS[log.call_status] || log.call_status}</span>
                <span className="text-muted-foreground">
                  {new Date(log.call_date).toLocaleDateString()}
                </span>
              </div>
              {log.discussion_notes && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{log.discussion_notes}</p>
              )}
              {log.follow_up_required && log.follow_up_date && (
                <p className="text-amber-700 mt-0.5">Follow-up: {log.follow_up_date}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
