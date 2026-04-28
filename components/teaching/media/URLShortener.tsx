"use client"
import { useState } from "react"
import { Copy, ExternalLink, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface URLShortenerProps {
  url: string
  title: string
}

export function URLShortener({ url, title }: URLShortenerProps) {
  const [copied, setCopied] = useState(false)

  const isMeetingLink = () => {
    const meetingDomains = ["zoom.us", "meet.google.com", "teams.microsoft.com", "youtube.com", "facebook.com"]
    return meetingDomains.some((domain) => url.includes(domain))
  }

  const shortenURL = (fullUrl: string) => {
    try {
      const urlObj = new URL(fullUrl)
      const domain = urlObj.hostname.replace("www.", "")
      const path = urlObj.pathname.slice(0, 30)
      return `${domain}${path}${path.length < urlObj.pathname.length ? "..." : ""}`
    } catch {
      return fullUrl.slice(0, 50) + (fullUrl.length > 50 ? "..." : "")
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const isMeeting = isMeetingLink()

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isMeeting ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"
      } my-2 w-full`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm font-medium hover:underline break-all ${isMeeting ? "text-purple-600" : "text-blue-600"}`}
        >
          {shortenURL(url)}
        </a>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-transparent"
          onClick={handleCopy}
          title="Copy link"
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          className={`h-8 px-2 text-xs ${
            isMeeting ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
          onClick={() => window.open(url, "_blank")}
        >
          {isMeeting ? "Join Meeting" : <ExternalLink className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  )
}
