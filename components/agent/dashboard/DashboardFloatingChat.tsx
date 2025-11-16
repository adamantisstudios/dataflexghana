"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send } from "lucide-react"
import type { Agent } from "@/lib/supabase"

interface DashboardFloatingChatProps {
  agent: Agent
}

export default function DashboardFloatingChat({ agent }: DashboardFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [issueType, setIssueType] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState("Need Help?")

  useEffect(() => {
    const messages = ["Need Help?", "Report an Issue", "Submit Suggestion", "Request Support", "Need Help?"]

    let messageIndex = 0

    const animationCycle = () => {
      setShowMessage(true)
      setMessageText(messages[messageIndex])

      setTimeout(() => {
        setShowMessage(false)
      }, 3000) // Show message for 3 seconds

      messageIndex = (messageIndex + 1) % messages.length
    }

    // Start immediately
    animationCycle()

    // Then repeat every 8 seconds (3s visible + 5s hidden)
    const interval = setInterval(animationCycle, 8000)

    return () => clearInterval(interval)
  }, [])

  const handleSendComplaint = () => {
    if (!message.trim() || !issueType) return

    const whatsappNumber = "+233242799990"
    const complaintMessage = `Hello Admin,

Issue Type: ${issueType}

Agent Details:
- Name: ${agent.full_name}
- Contact: ${agent.phone_number}
- Agent ID: ${agent.id}

Message:
${message.trim()}

Please assist me with this matter. Thank you!`

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(complaintMessage)}`
    window.open(whatsappUrl, "_blank")

    setMessage("")
    setIssueType("")
    setIsOpen(false)
  }

  const issueTypes = [
    "Submit Suggestion for Improvement",
    "Report a Fault or Issue",
    "Follow up on Projects",
    "Request for Property Listing",
    "Request for Bulk Order Data",
    "General Support",
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="fixed bottom-6 left-6 z-50">
            {showMessage && (
              <div className="absolute bottom-16 left-0 mb-2 animate-bounce">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap relative">
                  {messageText}
                  {/* Speech bubble arrow */}
                  <div className="absolute -bottom-1 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-500"></div>
                </div>
              </div>
            )}

            <Button
              className={`rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 ${
                showMessage ? "animate-pulse scale-110" : ""
              }`}
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Admin Support</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">💬 How can we help you today?</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Submit suggestions for platform improvements</li>
                <li>• Report technical faults or issues</li>
                <li>• Follow up on your ongoing projects</li>
                <li>• Request property listings or bulk data orders</li>
                <li>• Get general support and assistance</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">What type of issue?</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type..." />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Describe your issue or request:</label>
              <Textarea
                placeholder="Please provide details about your issue, suggestion, or request. Be as specific as possible to help us assist you better."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSendComplaint}
                disabled={!message.trim() || !issueType}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
