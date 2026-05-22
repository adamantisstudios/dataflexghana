"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, ChevronDown, ChevronUp, Edit2 } from "lucide-react"
import type { Agent } from "@/lib/supabase"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ADMIN_AGENT_SEARCH_DEBOUNCE_MS,
  ADMIN_AGENT_SEARCH_MIN_CHARS,
  fetchAdminAgentsBySearch,
} from "@/lib/admin-agent-search"

interface SelectedAgentWithPhone extends Agent {
  selectedPhone?: string
  selectedPhoneType?: "phone" | "momo"
}

interface AgentSelectorProps {
  selectedAgents: SelectedAgentWithPhone[]
  onSelectionChange: (agents: SelectedAgentWithPhone[]) => void
  isLoading?: boolean
}

const COUNTRY_CODES: { [key: string]: string } = {
  ghana: "+233",
}

const formatPhoneWithCountryCode = (phoneNumber: string, region?: string): string => {
  if (!phoneNumber) return ""

  const country = region?.toLowerCase() || "ghana"
  const countryCode = COUNTRY_CODES[country] || "+233"
  let cleanNumber = phoneNumber.replace(/^0+|[\s-]/g, "")

  if (cleanNumber.startsWith("+")) {
    return cleanNumber
  }

  return `${countryCode}${cleanNumber}`
}

export function AgentSelector({
  selectedAgents,
  onSelectionChange,
  isLoading = false,
}: AgentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Agent[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "unapproved">("all")
  const [selectAll, setSelectAll] = useState(false)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  const [editingPhone, setEditingPhone] = useState<{
    agentId: string
    value: string
    type: "phone" | "momo"
  } | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = searchTerm.trim()
    if (trimmed.length < ADMIN_AGENT_SEARCH_MIN_CHARS) {
      setSearchResults([])
      setShowDropdown(false)
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const agents = await fetchAdminAgentsBySearch(trimmed, 40)
        setSearchResults(agents as Agent[])
        setShowDropdown(true)
      } catch {
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        setSearchLoading(false)
      }
    }, ADMIN_AGENT_SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredAgents = searchResults.filter((a) => {
    if (filterStatus === "approved") return a.isapproved === true
    if (filterStatus === "unapproved") return a.isapproved === false
    return true
  })

  useEffect(() => {
    const allSelected =
      filteredAgents.length > 0 &&
      filteredAgents.every((agent) => selectedAgents.some((selected) => selected.id === agent.id))
    setSelectAll(allSelected)
  }, [filteredAgents, selectedAgents])

  const handleSelectAgent = (agent: Agent, checked: boolean) => {
    if (checked) {
      const selectedPhone = agent.phone_number || agent.momo_number || ""
      const selectedPhoneType = agent.phone_number ? "phone" : "momo"
      const formattedPhone = formatPhoneWithCountryCode(selectedPhone, agent.region)

      const newAgent: SelectedAgentWithPhone = {
        ...agent,
        selectedPhone: formattedPhone,
        selectedPhoneType: selectedPhoneType as "phone" | "momo",
      }
      onSelectionChange([...selectedAgents, newAgent])
      setSearchTerm("")
      setSearchResults([])
      setShowDropdown(false)
    } else {
      onSelectionChange(selectedAgents.filter((a) => a.id !== agent.id))
    }
  }

  const handlePhoneTypeChange = (agentId: string, phoneType: "phone" | "momo", agent: Agent) => {
    const phoneNumber = phoneType === "phone" ? agent.phone_number : agent.momo_number
    const formattedPhone = formatPhoneWithCountryCode(phoneNumber || "", agent.region)

    const updatedAgents = selectedAgents.map((a) =>
      a.id === agentId ? { ...a, selectedPhone: formattedPhone, selectedPhoneType: phoneType } : a,
    )
    onSelectionChange(updatedAgents)
  }

  const handlePhoneEdit = (agentId: string, value: string) => {
    const updatedAgents = selectedAgents.map((a) =>
      a.id === agentId ? { ...a, selectedPhone: value } : a,
    )
    onSelectionChange(updatedAgents)
  }

  const toggleExpandAgent = (agentId: string) => {
    const newExpanded = new Set(expandedAgents)
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId)
    } else {
      newExpanded.add(agentId)
    }
    setExpandedAgents(newExpanded)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newAgents = filteredAgents
        .filter((agent) => !selectedAgents.some((selected) => selected.id === agent.id))
        .map((agent) => {
          const selectedPhone = agent.phone_number || agent.momo_number || ""
          const selectedPhoneType = agent.phone_number ? "phone" : "momo"
          return {
            ...agent,
            selectedPhone: formatPhoneWithCountryCode(selectedPhone, agent.region),
            selectedPhoneType: selectedPhoneType as "phone" | "momo",
          }
        })
      onSelectionChange([...selectedAgents, ...newAgents])
      setSearchTerm("")
      setSearchResults([])
      setShowDropdown(false)
    } else {
      const filteredIds = new Set(filteredAgents.map((a) => a.id))
      onSelectionChange(selectedAgents.filter((a) => !filteredIds.has(a.id)))
    }
  }

  const isAgentSelected = (agentId: string) => selectedAgents.some((a) => a.id === agentId)

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Agents</CardTitle>
          <Badge className="bg-emerald-100 text-emerald-800">Selected: {selectedAgents.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedAgents.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Selected recipients</Label>
            <ScrollArea className="max-h-40 border border-emerald-100 rounded-lg p-3">
              <div className="space-y-2">
                {selectedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between gap-2 text-sm border-b border-emerald-50 pb-2 last:border-0"
                  >
                    <span className="font-medium truncate">{agent.full_name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      disabled={isLoading}
                      onClick={() => handleSelectAgent(agent, false)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="space-y-3" ref={searchContainerRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder={`Search by name, phone, email (min ${ADMIN_AGENT_SEARCH_MIN_CHARS} characters)…`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim().length >= ADMIN_AGENT_SEARCH_MIN_CHARS && searchResults.length > 0) {
                    setShowDropdown(true)
                  }
                }}
                className="pl-10 border-emerald-200 focus:border-emerald-500"
                disabled={isLoading}
              />
              {showDropdown && searchTerm.trim().length >= ADMIN_AGENT_SEARCH_MIN_CHARS && (
                <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border bg-white shadow-lg text-sm">
                  {searchLoading ? (
                    <li className="px-3 py-2 text-gray-500">Searching…</li>
                  ) : filteredAgents.length === 0 ? (
                    <li className="px-3 py-2 text-gray-500">No matching agents</li>
                  ) : (
                    filteredAgents.map((agent) => {
                      const already = isAgentSelected(agent.id)
                      return (
                        <li key={agent.id}>
                          <button
                            type="button"
                            disabled={already || isLoading}
                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 disabled:opacity-50"
                            onClick={() => handleSelectAgent(agent, true)}
                          >
                            <span className="font-medium">{agent.full_name}</span>
                            {agent.phone_number ? (
                              <span className="text-gray-500"> · {agent.phone_number}</span>
                            ) : null}
                            {already ? (
                              <span className="ml-2 text-xs text-emerald-600">(added)</span>
                            ) : null}
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              )}
            </div>
            <div className="w-40">
              <Select value={filterStatus} onValueChange={(value: "all" | "approved" | "unapproved") => setFilterStatus(value)}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="unapproved">Unapproved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {searchTerm.trim().length > 0 && searchTerm.trim().length < ADMIN_AGENT_SEARCH_MIN_CHARS && (
            <p className="text-xs text-gray-500">
              Type at least {ADMIN_AGENT_SEARCH_MIN_CHARS} characters to search agents.
            </p>
          )}

          {filteredAgents.length > 0 && searchTerm.trim().length >= ADMIN_AGENT_SEARCH_MIN_CHARS && (
            <div className="flex items-center gap-2 py-2 border-b border-emerald-100">
              <Checkbox
                id="select-all-search"
                checked={selectAll}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                disabled={isLoading || searchLoading}
                className="border-emerald-300"
              />
              <Label htmlFor="select-all-search" className="text-sm font-medium cursor-pointer flex-1">
                Add all search results ({filteredAgents.length})
              </Label>
            </div>
          )}
        </div>

        {selectedAgents.length > 0 && (
          <ScrollArea className="h-72 border border-emerald-100 rounded-lg p-4">
            <div className="space-y-3">
              {selectedAgents.map((agent) => {
                const selectedAgent = agent
                const isExpanded = expandedAgents.has(agent.id)

                return (
                  <div
                    key={agent.id}
                    className="border border-emerald-100 rounded-lg p-3 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{agent.full_name}</div>
                        <div className="text-xs text-gray-500">
                          {agent.region && `${agent.region} • `}
                          {agent.phone_number && `Phone: ${agent.phone_number}`}
                          {agent.phone_number && agent.momo_number && " • "}
                          {agent.momo_number && `Momo: ${agent.momo_number}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpandAgent(agent.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pl-2 border-l-2 border-emerald-200 space-y-2">
                        <Label className="text-xs font-semibold text-gray-700">Select number to send to:</Label>
                        {agent.phone_number && (
                          <div className="flex items-center gap-2 p-2 bg-white border border-emerald-100 rounded">
                            <input
                              type="radio"
                              name={`phone-type-${agent.id}`}
                              id={`phone-${agent.id}`}
                              checked={selectedAgent?.selectedPhoneType === "phone"}
                              onChange={() => handlePhoneTypeChange(agent.id, "phone", agent)}
                              className="w-4 h-4 accent-emerald-500"
                            />
                            <Label htmlFor={`phone-${agent.id}`} className="flex-1 cursor-pointer text-xs">
                              <span className="font-medium">Phone:</span> {agent.phone_number}
                            </Label>
                          </div>
                        )}
                        {agent.momo_number && (
                          <div className="flex items-center gap-2 p-2 bg-white border border-emerald-100 rounded">
                            <input
                              type="radio"
                              name={`phone-type-${agent.id}`}
                              id={`momo-${agent.id}`}
                              checked={selectedAgent?.selectedPhoneType === "momo"}
                              onChange={() => handlePhoneTypeChange(agent.id, "momo", agent)}
                              className="w-4 h-4 accent-emerald-500"
                            />
                            <Label htmlFor={`momo-${agent.id}`} className="flex-1 cursor-pointer text-xs">
                              <span className="font-medium">Momo:</span> {agent.momo_number}
                            </Label>
                          </div>
                        )}
                        {selectedAgent?.selectedPhone && (
                          <div className="space-y-2 pt-2 border-t border-emerald-100">
                            <Label className="text-xs font-semibold text-gray-700">Formatted number:</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="text"
                                value={
                                  editingPhone?.agentId === agent.id
                                    ? editingPhone.value
                                    : selectedAgent.selectedPhone
                                }
                                onChange={(e) => {
                                  if (editingPhone?.agentId === agent.id) {
                                    setEditingPhone({ ...editingPhone, value: e.target.value })
                                  }
                                }}
                                onBlur={() => {
                                  if (editingPhone?.agentId === agent.id) {
                                    handlePhoneEdit(agent.id, editingPhone.value)
                                    setEditingPhone(null)
                                  }
                                }}
                                onFocus={() => {
                                  setEditingPhone({
                                    agentId: agent.id,
                                    value: selectedAgent.selectedPhone || "",
                                    type: selectedAgent.selectedPhoneType || "phone",
                                  })
                                }}
                                className="text-sm border-emerald-200 focus:border-emerald-500"
                                placeholder="+233XXXXXXXXX"
                              />
                              <Edit2 className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {selectedAgents.length === 0 && searchTerm.trim().length < ADMIN_AGENT_SEARCH_MIN_CHARS && (
          <p className="text-sm text-center text-gray-500 py-6">
            Search for agents to add SMS recipients. No agents are loaded until you search.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
