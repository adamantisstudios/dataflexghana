"use client"
import { useState, useEffect } from "react"
import { ExternalLink } from "lucide-react"
import { detectURLsInText } from "@/lib/url-detector"

interface LinkDetectorProps {
  text: string
}

interface DetectedLink {
  url: string
  title: string
  description: string
  image?: string
  domain: string
  loading?: boolean
  error?: boolean
}

export function LinkDetector({ text }: LinkDetectorProps) {
  const [links, setLinks] = useState<DetectedLink[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const detectAndFetchLinks = async () => {
      const detectedUrls = detectURLsInText(text)

      if (detectedUrls.length === 0) {
        setLinks([])
        return
      }

      setLoading(true)

      const fetchedLinks = await Promise.all(
        detectedUrls.map(async (urlObj) => {
          try {
            const response = await fetch(`/api/link-preview?url=${encodeURIComponent(urlObj.url)}`)

            if (!response.ok) {
              return {
                url: urlObj.url,
                title: new URL(urlObj.url).hostname,
                description: "Click to open link",
                domain: new URL(urlObj.url).hostname,
                error: true,
              }
            }

            const preview = await response.json()

            return {
              url: urlObj.url,
              title: preview.title,
              description: preview.description,
              image: preview.image,
              domain: preview.domain,
            }
          } catch {
            return {
              url: urlObj.url,
              title: new URL(urlObj.url).hostname,
              description: "Click to open link",
              domain: new URL(urlObj.url).hostname,
              error: true,
            }
          }
        }),
      )

      setLinks(fetchedLinks)
      setLoading(false)
    }

    detectAndFetchLinks()
  }, [text])

  if (links.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mt-3">
      {links.map((link, idx) => (
        <a
          key={idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex gap-3">
            {link.image && (
              <img
                src={link.image || "/placeholder.svg"}
                alt={link.title}
                className="w-24 h-24 object-cover rounded flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-blue-600">{link.title}</h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{link.description}</p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {link.domain}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
