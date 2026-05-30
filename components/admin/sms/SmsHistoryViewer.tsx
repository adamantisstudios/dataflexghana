"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
  import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSmsHistoryWithAgents, getAvailableCampaigns, type SmsLogWithAgent } from "@/lib/sms-history"
import { Search, Download, Filter } from "lucide-react"
import { format } from "date-fns"

interface SmsHistoryViewerProps {
  onLoadingChange?: (loading: boolean) => void
}

export function SmsHistoryViewer({ onLoadingChange }: SmsHistoryViewerProps) {
  const [smsLogs, setSmsLogs] = useState<SmsLogWithAgent[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SmsLogWithAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all")
  const [campaigns, setCampaigns] = useState<string[]>([])

  // Load SMS history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      onLoadingChange?.(true)

      try {
        const logs = await getSmsHistoryWithAgents()
        setSmsLogs(logs)
        setFilteredLogs(logs)

        const availableCampaigns = await getAvailableCampaigns()
        setCampaigns(availableCampaigns)
      } catch (error) {
        console.error("[v0] Error loading SMS history:", error)
      } finally {
        setLoading(false)
        onLoadingChange?.(false)
      }
    }

    loadHistory()
  }, [onLoadingChange])

  // Apply filters
  useEffect(() => {
    let filtered = smsLogs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.phone_number?.includes(searchTerm) ||
          log.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.message_content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Campaign filter
    if (campaignFilter !== "all") {
      filtered = filtered.filter((log) => log.campaign_name === campaignFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((log) => log.status === statusFilter)
    }

    setFilteredLogs(filtered)
  }, [searchTerm, campaignFilter, statusFilter, smsLogs])

  // Export to CSV
  const handleExportCsv = () => {
    const csv = [
      ["Agent Name", "Phone Number", "Message", "Sent Date", "Status", "Campaign"],
      ...filteredLogs.map((log) => [
        log.agent_name || "Unknown",
        log.phone_number,
        log.message_content,
        format(new Date(log.sent_at), "MMM dd, yyyy HH:mm:ss"),
        log.status,
        log.campaign_name || "N/A",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sms-history-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className="border border-emerald-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-emerald-900">SMS History & Tracking</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="border-emerald-300 hover:bg-emerald-50"
            disabled={loading || filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by agent name, phone number, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-500"
            />
          </div>

          {/* Campaign & Status Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Filter by Campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign} value={campaign}>
                      {campaign || "Unnamed Campaign"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">✓ Sent Successfully</SelectItem>
                  <SelectItem value="failed">✗ Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="flex gap-3 text-sm text-gray-600">
            <span>
              Showing <strong>{filteredLogs.length}</strong> of <strong>{smsLogs.length}</strong> SMS logs
            </span>
          </div>
        </div>

        {/* SMS History Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading SMS history...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {smsLogs.length === 0 ? "No SMS sent yet" : "No SMS matching your filters"}
          </div>
        ) : (
          <ScrollArea className="h-96 border border-emerald-100 rounded-lg p-4">
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-white border border-emerald-100 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  {/* Status Indicator */}
                  <div className="pt-1">
                    {log.status === "success" ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        ✓ Sent
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                        ✗ Failed
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {log.agent_name || "Unknown Agent"}
                      </h4>
                      <span className="text-xs text-gray-500">{log.phone_number}</span>
                      {log.campaign_name && (
                        <Badge variant="outline" className="text-xs border-emerald-300">
                          {log.campaign_name}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-2 break-words">
                      {log.message_content}
                    </p>

                    <div className="text-xs text-gray-500">
                      {format(new Date(log.sent_at), "MMM dd, yyyy 'at' HH:mm:ss")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
