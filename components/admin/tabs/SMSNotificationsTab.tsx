"use client"

import { useState, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Send, AlertCircle, CheckCircle2, History } from "lucide-react"
import { AgentSelector } from "@/components/admin/sms/AgentSelector"
import { MessageComposer } from "@/components/admin/sms/MessageComposer"
import { SmsHistoryViewer } from "@/components/admin/sms/SmsHistoryViewer"
import { sendBulkSms, type SendSmsParams } from "@/lib/sms-service"
import { useAdminTabCache } from "@/lib/admin-tabs-cache"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SelectedAgentWithPhone extends Agent {
  selectedPhone?: string
  selectedPhoneType?: "phone" | "momo"
}

const SMSNotificationsTab = memo(function SMSNotificationsTab() {
  const { getCachedData, setCachedData } = useAdminTabCache()
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgentWithPhone[]>([])
  const [message, setMessage] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [sendResults, setSendResults] = useState<Array<{
    agent: Agent
    success: boolean
    messageId?: string
    error?: string
  }>>([])
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("compose")

  const handleSendClick = () => {
    if (selectedAgents.length === 0) {
      toast.error("Please select at least one agent")
      return
    }

    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (message.length > 160) {
      toast.error("Message exceeds 160 character limit")
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmSend = async () => {
    setShowConfirmDialog(false)
    setIsSending(true)

    try {
      const smsParams: SendSmsParams[] = selectedAgents
        .map((agent) => {
          // Use the selectedPhone (formatted with country code) if available
          const phoneNumber = agent.selectedPhone || agent.phone_number || agent.momo_number
          if (!phoneNumber) return null

          return {
            phoneNumber,
            message,
            senderName: "Your Business",
            agentId: agent.id,
            campaignName: campaignName || undefined,
          } as SendSmsParams
        })
        .filter((param): param is SendSmsParams => param !== null)

      if (smsParams.length === 0) {
        toast.error("No valid phone numbers found for selected agents")
        setIsSending(false)
        return
      }

      // Send SMS in batches
      const results = await sendBulkSms(smsParams, 150) // 150ms delay between sends

      // Map results back to agents
      const detailedResults = selectedAgents
        .map((agent, index) => ({
          agent,
          success: results[index]?.success || false,
          messageId: results[index]?.messageId,
          error: results[index]?.error,
        }))
        .filter((_, index) => index < smsParams.length) // Only include agents with valid phone numbers

      setSendResults(detailedResults)
      setShowResultsDialog(true)

      // Summary stats
      const successCount = detailedResults.filter((r) => r.success).length
      const failureCount = detailedResults.filter((r) => !r.success).length

      if (successCount > 0) {
        toast.success(
          `SMS sent to ${successCount} agent${successCount !== 1 ? "s" : ""}`
        )
      }

      if (failureCount > 0) {
        toast.error(
          `Failed to send to ${failureCount} agent${failureCount !== 1 ? "s" : ""}`
        )
      }

      // Reset form
      setMessage("")
      setSelectedAgents([])
      setCampaignName("")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] Error sending SMS:", error)
      toast.error(`Failed to send SMS: ${errorMessage}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseResults = () => {
    setShowResultsDialog(false)
    setSendResults([])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-emerald-800">SMS Notifications</h2>
        <p className="text-gray-600 text-sm">
          Send custom SMS messages to agents via USMS-GH API. Messages are limited to 160 characters. Track all sent messages and manage campaigns.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" />
            Compose & Send
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History & Tracking
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-6">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Agent Selection */}
        <div>
          <AgentSelector
            selectedAgents={selectedAgents}
            onSelectionChange={setSelectedAgents}
            isLoading={isSending}
          />
        </div>

        {/* Right Column - Campaign & Message Composer */}
        <div className="space-y-6">
          {/* Campaign Name Section */}
          <Card className="border border-emerald-100">
            <CardHeader className="bg-emerald-50 border-b border-emerald-100">
              <CardTitle className="text-sm font-semibold text-emerald-900">
                Campaign Name (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Label htmlFor="campaign-name" className="text-sm font-medium mb-2 block">
                Give this campaign a name to track related messages
              </Label>
              <Input
                id="campaign-name"
                placeholder="e.g., March Product Launch, Approval Reminder, etc."
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                disabled={isSending}
                className="border-emerald-200 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Campaign name will be attached to all SMS in this batch for easy tracking.
              </p>
            </CardContent>
          </Card>

          <MessageComposer
            message={message}
            onMessageChange={setMessage}
            isLoading={isSending}
          />

          {/* Send Button Section */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-gray-600 mb-1">Recipients</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {selectedAgents.length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-gray-600 mb-1">Characters</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {message.length}/160
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                {selectedAgents.length > 0 && message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Ready to send:</strong> {message.length} characters
                      to {selectedAgents.length} agent{selectedAgents.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleSendClick}
                  disabled={
                    isSending ||
                    selectedAgents.length === 0 ||
                    !message.trim() ||
                    message.length > 160
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? "Sending SMS..." : "Send SMS"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <SmsHistoryViewer />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm SMS Send</DialogTitle>
            <DialogDescription>
              Please review before sending
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-64 overflow-y-auto">
            {/* Campaign Name Display */}
            {campaignName && (
              <div>
                <p className="font-medium text-sm mb-2">Campaign:</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-medium text-blue-900">{campaignName}</p>
                </div>
              </div>
            )}

            {/* Message Preview */}
            <div>
              <p className="font-medium text-sm mb-2">Message:</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message}
                </p>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <p className="font-medium text-sm mb-2">
                Recipients ({selectedAgents.length}):
              </p>
              <ScrollArea className="h-40 border border-gray-200 rounded p-2">
                <div className="space-y-2">
                  {selectedAgents.map((agent) => (
                    <div key={agent.id} className="text-sm border-b pb-2">
                      <p className="font-medium">{agent.full_name}</p>
                      <p className="text-xs text-gray-600">
                        {agent.phone_number || agent.momo_number}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={isSending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">Total Sent</p>
                <p className="text-2xl font-bold text-gray-800">
                  {sendResults.length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <p className="text-xs text-green-600 mb-1">Success</p>
                <p className="text-2xl font-bold text-green-700">
                  {sendResults.filter((r) => r.success).length}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                <p className="text-xs text-red-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-700">
                  {sendResults.filter((r) => !r.success).length}
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <ScrollArea className="h-64 border border-gray-200 rounded p-4">
              <div className="space-y-3">
                {sendResults.map((result, index) => (
                  <div
                    key={result.agent.id}
                    className={`border rounded-lg p-3 ${
                      result.success
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {result.agent.full_name}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          {result.agent.phone_number || result.agent.momo_number}
                        </p>
                        {result.success ? (
                          <p className="text-xs text-green-700">
                            ✓ Message sent successfully
                            {result.messageId && ` (ID: ${result.messageId})`}
                          </p>
                        ) : (
                          <p className="text-xs text-red-700">
                            ✗ {result.error || "Failed to send message"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseResults}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

export default SMSNotificationsTab
