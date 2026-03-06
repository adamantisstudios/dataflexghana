"use client"

import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const DashboardFloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [issueType, setIssueType] = useState("")
  const [message, setMessage] = useState("")
  const issueTypes = [
    "Technical Fault",
    "Platform Improvement",
    "Project Follow-up",
    "Property Listings",
    "General Support",
  ]

  const handleSendComplaint = () => {
    // Handle complaint sending logic here
    console.log("Sending complaint:", message, issueType)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-4 left-4 z-50">
          {showMessage && (
            <div className="absolute bottom-12 left-0 mb-2 animate-bounce">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap relative">
                {messageText}
                {/* Speech bubble arrow */}
                <div className="absolute -bottom-1 left-4 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-blue-500"></div>
              </div>
            </div>
          )}

          <Button
            className={`rounded-full w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 ${
              showMessage ? "animate-pulse scale-110" : ""
            }`}
            size="icon"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Contact Admin Support</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-xs text-blue-800 font-medium mb-1">💬 How can we help you today?</p>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>• Submit suggestions for platform improvements</li>
              <li>• Report technical faults or issues</li>
              <li>• Follow up on your ongoing projects</li>
              <li>• Request property listings or bulk data orders</li>
              <li>• Get general support and assistance</li>
            </ul>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">What type of issue?</label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select issue type..." />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Describe your issue or request:</label>
            <Textarea
              placeholder="Please provide details about your issue, suggestion, or request. Be as specific as possible to help us assist you better."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 h-7 text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSendComplaint}
              disabled={!message.trim() || !issueType}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 h-7 text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              Send Complaint
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DashboardFloatingChat
