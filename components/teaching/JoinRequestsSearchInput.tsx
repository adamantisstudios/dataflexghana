"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function JoinRequestsSearchInput({
  value,
  onChange,
  placeholder = "Search by name, phone, or email…",
  className,
}: Props) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
        aria-label="Search join requests"
      />
    </div>
  )
}

export function filterJoinRequests<
  T extends {
    agent_name?: string
    full_name?: string
    agent_contact?: string
    phone_number?: string
    email?: string
    request_message?: string | null
    channel_name?: string
  },
>(requests: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return requests
  return requests.filter((r) => {
    const haystack = [
      r.agent_name,
      r.full_name,
      r.agent_contact,
      r.phone_number,
      r.email,
      r.request_message,
      r.channel_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })
}
