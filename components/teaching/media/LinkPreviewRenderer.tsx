"use client"
import { useState, useEffect } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

interface LinkPreviewRendererProps {
  url: string
  title?: string
}

interface LinkPreview {
  title: string
  description: string
  image?: string
  domain: string
}

export function LinkPreviewRenderer({ url, title }: LinkPreviewRendererProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true)
        setError(false)
        setImageError(false)
        const cleanUrl = url.replace(/[{}[\]]/g, "").trim()

        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(cleanUrl)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(() => null)

        if (response?.ok) {
          const data = await response.json()
          // Validate image URL if present
          if (data.image) {
            try {
              new URL(data.image)
              setPreview(data)
            } catch {
              // Invalid image URL, set preview without image
              setPreview({ ...data, image: undefined })
            }
          } else {
            setPreview(data)
          }
        } else {
          // Fallback: extract domain and use title if provided
          const urlObj = new URL(cleanUrl)
          setPreview({
            title: title || urlObj.hostname,
            description: "Click to open link",
            domain: urlObj.hostname,
          })
        }
      } catch (err) {
        console.error("[v0] Error fetching link preview:", err)
        setError(true)
        // Fallback preview
        try {
          const cleanUrl = url.replace(/[{}[\]]/g, "").trim()
          const urlObj = new URL(cleanUrl)
          setPreview({
            title: title || urlObj.hostname,
            description: "Click to open link",
            domain: urlObj.hostname,
          })
        } catch {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [url, title])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-600">Loading preview...</span>
      </div>
    )
  }

  if (error || !preview) {
    const cleanUrl = url.replace(/[{}[\]]/g, "").trim()
    return (
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 transition-colors cursor-pointer"
      >
        <ExternalLink className="h-4 w-4" />
        <span className="text-sm font-medium">{title || "Open Link"}</span>
      </a>
    )
  }

  const cleanUrl = url.replace(/[{}[\]]/g, "").trim()
  return (
    <a
      href={cleanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex gap-3">
        {preview.image && !imageError && (
          <img
            src={preview.image || "/placeholder.svg"}
            alt={preview.title}
            className="w-24 h-24 object-cover rounded flex-shrink-0"
            onError={(e) => {
              setImageError(true)
              e.currentTarget.style.display = "none"
            }}
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-blue-600">{preview.title}</h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{preview.description}</p>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {preview.domain}
          </p>
        </div>
      </div>
    </a>
  )
}
