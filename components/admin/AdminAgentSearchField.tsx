"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import {
  ADMIN_AGENT_SEARCH_DEBOUNCE_MS,
  ADMIN_AGENT_SEARCH_MIN_CHARS,
  fetchAdminAgentsBySearch,
  type AdminAgentSearchResult,
} from "@/lib/admin-agent-search"

export interface AdminAgentSearchFieldProps {
  label?: string
  hint?: string
  /** Currently selected agent; null = broadcast / none */
  selected: AdminAgentSearchResult | null
  onSelect: (agent: AdminAgentSearchResult | null) => void
  broadcastLabel?: string
  showBroadcastOption?: boolean
  disabled?: boolean
}

export function AdminAgentSearchField({
  label = "Target agent (optional)",
  hint = "Leave empty for broadcast to all agents. Type at least 4 characters to search.",
  selected,
  onSelect,
  broadcastLabel = "All agents (broadcast)",
  showBroadcastOption = true,
  disabled = false,
}: AdminAgentSearchFieldProps) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<AdminAgentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed.length < ADMIN_AGENT_SEARCH_MIN_CHARS) {
      setResults([])
      setShowDropdown(false)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const agents = await fetchAdminAgentsBySearch(trimmed)
        setResults(agents)
        setShowDropdown(true)
      } catch {
        setResults([])
        setShowDropdown(false)
      } finally {
        setLoading(false)
      }
    }, ADMIN_AGENT_SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const pickAgent = (agent: AdminAgentSearchResult) => {
    onSelect(agent)
    setSearch("")
    setResults([])
    setShowDropdown(false)
  }

  const pickBroadcast = () => {
    onSelect(null)
    setSearch("")
    setResults([])
    setShowDropdown(false)
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{selected.full_name}</p>
            {selected.phone_number ? (
              <p className="text-xs text-muted-foreground">{selected.phone_number}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(null)}
            className="shrink-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : showBroadcastOption ? (
        <Badge variant="secondary" className="text-xs">
          {broadcastLabel}
        </Badge>
      ) : null}

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={`Search agents (min ${ADMIN_AGENT_SEARCH_MIN_CHARS} characters)…`}
          value={search}
          disabled={disabled}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => {
            if (search.trim().length >= ADMIN_AGENT_SEARCH_MIN_CHARS && results.length > 0) {
              setShowDropdown(true)
            }
          }}
        />

        {showDropdown && search.trim().length >= ADMIN_AGENT_SEARCH_MIN_CHARS && (
          <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md text-sm">
            {loading ? (
              <li className="px-3 py-2 text-muted-foreground">Searching…</li>
            ) : results.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">No matching agents</li>
            ) : (
              results.map((agent) => (
                <li key={agent.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted"
                    onClick={() => pickAgent(agent)}
                  >
                    <span className="font-medium">{agent.full_name}</span>
                    {agent.phone_number ? (
                      <span className="text-muted-foreground"> · {agent.phone_number}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {showBroadcastOption && !selected && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={pickBroadcast}>
          {broadcastLabel}
        </Button>
      )}
    </div>
  )
}
