"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase, type Agent, type Referral, type ProjectChat } from "@/lib/supabase"
import { ArrowLeft, Send, ImageIcon } from "lucide-react"
import Link from "next/link"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
export default function ProjectChatPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [referral, setReferral] = useState<Referral | null>(null)
  const [messages, setMessages] = useState<ProjectChat[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const referralId = params.referralId as string
  const { markAsRead } = useUnreadMessages(agent?.id || "", "agent")
  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      router.push("/agent/login")
      return
    }
    const parsedAgent = JSON.parse(agentData)
    setAgent(parsedAgent)
    loadData(parsedAgent.id)
  }, [router, referralId])
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  useEffect(() => {
    if (agent?.id && referralId) {
      markAsRead(referralId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id, referralId])
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  const loadData = async (agentId: string) => {
    try {
      // Load referral details
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select(`
          *,
          services (title, commission_amount)
        `)
        .eq("id", referralId)
        .eq("agent_id", agentId)
        .single()
      if (referralError) throw referralError
      // Load chat messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("project_chats")
        .select("*")
        .eq("referral_id", referralId)
        .order("timestamp", { ascending: true })
      if (messagesError) throw messagesError
      setReferral(referralData)
      setMessages(messagesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/agent/dashboard")
    } finally {
      setLoading(false)
    }
  }
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !agent || !referral) return
    setSending(true)
    try {
      const { error } = await supabase.from("project_chats").insert([
        {
          referral_id: referral.id,
          sender_type: "agent",
          sender_id: agent.id,
          message_type: "text",
          message_content: newMessage.trim(),
        },
      ])
      if (error) throw error
      setNewMessage("")
      // Reload messages
      loadData(agent.id)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }
  if (!referral) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Referral not found.</p>
            <Button asChild className="mt-4">
              <Link href="/agent/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agent/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          {/* Project Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{referral.services?.title}</CardTitle>
                  <p className="text-gray-600">
                    Client: {referral.client_name} • {referral.client_phone}
                  </p>
                </div>
                <Badge className={getStatusColor(referral.status)}>{referral.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{referral.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span>
                  Commission:{" "}
                  <span className="font-semibold text-green-600">
                    GH₵ {referral.services?.commission_amount.toLocaleString()}
                  </span>
                </span>
                {referral.status === "completed" && (
                  <Badge variant={referral.commission_paid ? "default" : "secondary"}>
                    {referral.commission_paid ? "Commission Paid" : "Payment Pending"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Project Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_type === "agent" ? "bg-blue-600 text-white" : "bg-white text-gray-900 border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-75">{message.sender_type === "agent" ? "You" : "Admin"}</span>
                        <span className="text-xs opacity-75">{new Date(message.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {message.message_type === "image" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm">Proof of Work</span>
                          </div>
                          <img
                            src={message.message_content || "/placeholder.svg"}
                            alt="Proof of work"
                            className="max-w-full h-auto rounded border"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      ) : (
                        <p className="text-sm">{message.message_content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Message Input */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? "Sending..." : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
