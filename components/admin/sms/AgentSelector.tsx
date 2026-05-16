"use client"

import { useState, useEffect } from "react"
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
import { supabase } from "@/lib/supabase-client";
import type { Agent } from "@/lib/supabase";   // keep original type import if that's where it was
import { ScrollArea } from "@/components/ui/scroll-area"

interface SelectedAgentWithPhone extends Agent {
  selectedPhone?: string
  selectedPhoneType?: "phone" | "momo"
}

interface AgentSelectorProps {
  selectedAgents: SelectedAgentWithPhone[]
  onSelectionChange: (agents: SelectedAgentWithPhone[]) => void
  isLoading?: boolean
}

// Country code mapping (can be expanded)
const COUNTRY_CODES: { [key: string]: string } = {
  ghana: "+233",
  // Add more countries as needed
}

// Format phone number with country code
const formatPhoneWithCountryCode = (phoneNumber: string, region?: string): string => {
  if (!phoneNumber) return ""
  
  const country = region?.toLowerCase() || "ghana"
  const countryCode = COUNTRY_CODES[country] || "+233"
  
  // Remove any leading 0 and spaces
  let cleanNumber = phoneNumber.replace(/^0+|[\s-]/g, "")
  
  // If already has country code, return as is
  if (cleanNumber.startsWith("+")) {
    return cleanNumber
  }
  
  // Add country code
  return `${countryCode}${cleanNumber}`
}

export function AgentSelector({
  selectedAgents,
  onSelectionChange,
  isLoading = false,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "unapproved">("all")
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  const [editingPhone, setEditingPhone] = useState<{
    agentId: string
    value: string
    type: "phone" | "momo"
  } | null>(null)

  // Load agents with pagination (to avoid 1000 record limit)
  useEffect(() => {
    const loadAgents = async () => {
      setLoadingAgents(true)
      try {
        let allAgents: any[] = []
        let page = 0
        const pageSize = 500
        let hasMore = true

        while (hasMore) {
          const from = page * pageSize
          const to = from + pageSize - 1

          const { data, error, count } = await supabase
            .from("agents")
            .select("*", { count: "exact" })
            .order("full_name", { ascending: true })
            .range(from, to)

          if (error) throw error

          if (!data || data.length === 0) {
            hasMore = false
          } else {
            allAgents = [...allAgents, ...data]
            // Check if we've fetched all records
            if (count !== null && allAgents.length >= count) {
              hasMore = false
            } else if (data.length < pageSize) {
              hasMore = false
            }
            page++
          }
        }

        console.log(`[v0] Loaded ${allAgents.length} agents for SMS selection`)
        setAgents(allAgents)
      } catch (error) {
        console.error("[v0] Error loading agents:", error)
      } finally {
        setLoadingAgents(false)
      }
    }

    loadAgents()
  }, [])

  // Filter agents based on search and status
  useEffect(() => {
    let result = agents

    // Filter by status
    if (filterStatus === "approved") {
      result = result.filter((a) => a.isapproved === true)
    } else if (filterStatus === "unapproved") {
      result = result.filter((a) => a.isapproved === false)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(term) ||
          a.phone_number?.toLowerCase().includes(term) ||
          a.momo_number?.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term)
      )
    }

    setFilteredAgents(result)

    // Update select all state
    const allSelected =
      result.length > 0 &&
      result.every((agent) =>
        selectedAgents.some((selected) => selected.id === agent.id)
      )
    setSelectAll(allSelected)
  }, [agents, searchTerm, filterStatus, selectedAgents])

  const handleSelectAgent = (agent: Agent, checked: boolean) => {
    if (checked) {
      // Auto-select the phone number (prefer phone_number over momo_number)
      const selectedPhone = agent.phone_number || agent.momo_number || ""
      const selectedPhoneType = agent.phone_number ? "phone" : "momo"
      const formattedPhone = formatPhoneWithCountryCode(selectedPhone, agent.region)
      
      const newAgent: SelectedAgentWithPhone = {
        ...agent,
        selectedPhone: formattedPhone,
        selectedPhoneType: selectedPhoneType as "phone" | "momo",
      }
      onSelectionChange([...selectedAgents, newAgent])
    } else {
      onSelectionChange(
        selectedAgents.filter((a) => a.id !== agent.id)
      )
    }
  }

  const handlePhoneTypeChange = (
    agentId: string,
    phoneType: "phone" | "momo",
    agent: Agent
  ) => {
    const phoneNumber = phoneType === "phone" ? agent.phone_number : agent.momo_number
    const formattedPhone = formatPhoneWithCountryCode(phoneNumber || "", agent.region)
    
    const updatedAgents = selectedAgents.map((a) =>
      a.id === agentId
        ? { ...a, selectedPhone: formattedPhone, selectedPhoneType: phoneType }
        : a
    )
    onSelectionChange(updatedAgents)
  }

  const handlePhoneEdit = (
    agentId: string,
    value: string,
    type: "phone" | "momo"
  ) => {
    const updatedAgents = selectedAgents.map((a) =>
      a.id === agentId
        ? { ...a, selectedPhone: value }
        : a
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
      // Add all filtered agents that aren't already selected
      const newAgents = filteredAgents.filter(
        (agent) => !selectedAgents.some((selected) => selected.id === agent.id)
      )
      onSelectionChange([...selectedAgents, ...newAgents])
    } else {
      // Remove all filtered agents from selection
      const filteredIds = new Set(filteredAgents.map((a) => a.id))
      onSelectionChange(
        selectedAgents.filter((a) => !filteredIds.has(a.id))
      )
    }
  }

  const isAgentSelected = (agentId: string) =>
    selectedAgents.some((a) => a.id === agentId)

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Agents</CardTitle>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline">
              Total: {agents.length}
            </Badge>
            <Badge variant="secondary">
              Showing: {filteredAgents.length}
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800">
              Selected: {selectedAgents.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, momo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500"
                disabled={isLoading || loadingAgents}
              />
            </div>
            <div className="w-40">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
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

          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {filteredAgents.length} agents
              {filterStatus !== "all" && ` (${filterStatus})`}
            </span>
            <Badge variant="secondary">
              {selectedAgents.length} selected
            </Badge>
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2 py-2 border-b border-emerald-100">
          <Checkbox
            id="select-all"
            checked={selectAll}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            disabled={isLoading || loadingAgents || filteredAgents.length === 0}
            className="border-emerald-300"
          />
          <Label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer flex-1"
          >
            Select all {filteredAgents.length > 0 ? `(${filteredAgents.length})` : ""}
          </Label>
        </div>

        {/* Agent List */}
        <ScrollArea className="h-96 border border-emerald-100 rounded-lg p-4">
          {loadingAgents ? (
            <div className="text-center text-gray-500 py-8">
              Loading agents...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No agents found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent) => {
                const isSelected = isAgentSelected(agent.id)
                const selectedAgent = selectedAgents.find((a) => a.id === agent.id)
                const isExpanded = expandedAgents.has(agent.id)

                return (
                  <div
                    key={agent.id}
                    className="border border-emerald-100 rounded-lg p-3 hover:bg-emerald-50 transition-colors"
                  >
                    {/* Agent Selection Row */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAgent(agent, checked as boolean)
                        }
                        disabled={isLoading}
                        className="border-emerald-300 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{agent.full_name}</div>
                        <div className="text-xs text-gray-500">
                          {agent.region && `${agent.region} • `}
                          {agent.phone_number && `Phone: ${agent.phone_number}`}
                          {agent.phone_number && agent.momo_number && " • "}
                          {agent.momo_number && `Momo: ${agent.momo_number}`}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {agent.isapproved && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Approved
                            </Badge>
                          )}
                          {!agent.isapproved && (
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expand Button for Selected Agents */}
                      {isSelected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandAgent(agent.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Phone Number Selection - Show when expanded */}
                    {isSelected && isExpanded && (
                      <div className="mt-3 pl-7 border-l-2 border-emerald-200 space-y-2">
                        {/* Phone Number Options */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-700">
                            Select Number to Send To:
                          </Label>

                          {/* Phone Number Option */}
                          {agent.phone_number && (
                            <div className="flex items-center gap-2 p-2 bg-white border border-emerald-100 rounded">
                              <input
                                type="radio"
                                name={`phone-type-${agent.id}`}
                                id={`phone-${agent.id}`}
                                checked={selectedAgent?.selectedPhoneType === "phone"}
                                onChange={() =>
                                  handlePhoneTypeChange(agent.id, "phone", agent)
                                }
                                className="w-4 h-4 accent-emerald-500"
                              />
                              <Label
                                htmlFor={`phone-${agent.id}`}
                                className="flex-1 cursor-pointer text-xs"
                              >
                                <span className="font-medium">Phone:</span>{" "}
                                {agent.phone_number}
                              </Label>
                            </div>
                          )}

                          {/* Momo Number Option */}
                          {agent.momo_number && (
                            <div className="flex items-center gap-2 p-2 bg-white border border-emerald-100 rounded">
                              <input
                                type="radio"
                                name={`phone-type-${agent.id}`}
                                id={`momo-${agent.id}`}
                                checked={selectedAgent?.selectedPhoneType === "momo"}
                                onChange={() =>
                                  handlePhoneTypeChange(agent.id, "momo", agent)
                                }
                                className="w-4 h-4 accent-emerald-500"
                              />
                              <Label
                                htmlFor={`momo-${agent.id}`}
                                className="flex-1 cursor-pointer text-xs"
                              >
                                <span className="font-medium">Momo:</span>{" "}
                                {agent.momo_number}
                              </Label>
                            </div>
                          )}
                        </div>

                        {/* Formatted Phone Number Display & Edit */}
                        {selectedAgent?.selectedPhone && (
                          <div className="space-y-2 pt-2 border-t border-emerald-100">
                            <Label className="text-xs font-semibold text-gray-700">
                              Formatted Number:
                            </Label>
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
                                    setEditingPhone({
                                      ...editingPhone,
                                      value: e.target.value,
                                    })
                                  }
                                }}
                                onBlur={() => {
                                  if (editingPhone?.agentId === agent.id) {
                                    handlePhoneEdit(
                                      agent.id,
                                      editingPhone.value,
                                      editingPhone.type
                                    )
                                    setEditingPhone(null)
                                  }
                                }}
                                onFocus={() => {
                                  setEditingPhone({
                                    agentId: agent.id,
                                    value: selectedAgent.selectedPhone || "",
                                    type:
                                      selectedAgent.selectedPhoneType || "phone",
                                  })
                                }}
                                className="text-sm border-emerald-200 focus:border-emerald-500"
                                placeholder="+233XXXXXXXXX"
                              />
                              <Edit2 className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500">
                              Format: +233XXXXXXXXX (Ghana example)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
