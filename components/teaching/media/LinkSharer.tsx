"use client"
import { useState } from "react"
import { LinkIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SharedLink {
  url: string
  title: string
}

interface LinkSharerProps {
  onLinksSelected: (links: SharedLink[]) => void
  maxLinks?: number
  disabled?: boolean
}

export function LinkSharer({ onLinksSelected, maxLinks = 5, disabled = false }: LinkSharerProps) {
  const [links, setLinks] = useState<SharedLink[]>([])
  const [inputUrl, setInputUrl] = useState("")
  const [inputTitle, setInputTitle] = useState("")

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const addLink = () => {
    if (!inputUrl.trim() || !isValidUrl(inputUrl)) {
      alert("Please enter a valid URL")
      return
    }

    const newLink: SharedLink = {
      url: inputUrl,
      title: inputTitle.trim() || new URL(inputUrl).hostname,
    }

    const updated = [...links, newLink].slice(0, maxLinks)
    setLinks(updated)
    onLinksSelected(updated)
    setInputUrl("")
    setInputTitle("")
  }

  const removeLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index)
    setLinks(updated)
    onLinksSelected(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Link title (optional)"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Input
          placeholder="https://example.com"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={addLink}
          disabled={disabled || links.length >= maxLinks || !inputUrl.trim()}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          <LinkIcon size={18} />
        </Button>
      </div>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-cyan-50 rounded-lg border border-cyan-200"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0 hover:text-cyan-600"
              >
                <LinkIcon size={16} className="flex-shrink-0" />
                <span className="text-sm text-cyan-700 truncate">{link.title}</span>
              </a>
              <button
                onClick={() => removeLink(index)}
                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
