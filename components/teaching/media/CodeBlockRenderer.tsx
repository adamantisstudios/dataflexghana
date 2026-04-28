"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface CodeBlockRendererProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlockRenderer({ code, language = "javascript", className = "" }: CodeBlockRendererProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const loadHighlightJs = async () => {
      if (typeof window !== "undefined" && !(window as any).hljs) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"
        document.head.appendChild(link)

        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"
        script.async = true
        document.head.appendChild(script)

        script.onload = () => {
          if ((window as any).hljs && codeRef.current) {
            ;(window as any).hljs.highlightElement(codeRef.current)
          }
        }
      } else if ((window as any).hljs && codeRef.current) {
        ;(window as any).hljs.highlightElement(codeRef.current)
      }
    }

    loadHighlightJs()
  }, [code])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[v0] Copy error:", error)
    }
  }

  return (
    <div className={`code-block bg-gray-900 rounded-lg overflow-hidden my-3 ${className}`}>
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400">{language}</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code ref={codeRef} className={`language-${language} text-sm text-gray-100`}>
          {code}
        </code>
      </pre>
    </div>
  )
}
