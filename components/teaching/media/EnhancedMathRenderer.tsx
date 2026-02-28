"use client"
import { useEffect, useRef, useState, useMemo } from "react"

interface EnhancedMathRendererProps {
  content: string
  className?: string
}

export function EnhancedMathRenderer({ content, className = "" }: EnhancedMathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mathJaxLoadedRef = useRef(false)
  const renderTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)

  const formattedContent = useMemo(() => {
    let formatted = content.trim()

    // Remove any existing wrapper divs to prevent double-wrapping
    formatted = formatted.replace(/<div[^>]*class="math-display"[^>]*>/g, "")
    formatted = formatted.replace(/<\/div>/g, "")

    // Only wrap if not already wrapped
    if (!formatted.includes("$$") && !formatted.includes("\\(") && !formatted.includes("\\[")) {
      formatted = `$$${formatted}$$`
    }

    // Convert special characters to LaTeX
    formatted = formatted.replace(/∛/g, "\\sqrt[3]")
    formatted = formatted.replace(/³/g, "^3")
    formatted = formatted.replace(/²/g, "^2")
    formatted = formatted.replace(/√/g, "\\sqrt")
    formatted = formatted.replace(/\|([^|]+)\|/g, "\\left|$1\\right|")

    return formatted
  }, [content])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const loadMathJax = async () => {
      try {
        if (typeof window === "undefined" || !containerRef.current || !isMountedRef.current) return

        containerRef.current.textContent = ""
        const mathDiv = document.createElement("div")
        mathDiv.className = "math-display"
        mathDiv.textContent = formattedContent
        containerRef.current.appendChild(mathDiv)

        const loadAndTypeset = async () => {
          if ((window as any).MathJax && containerRef.current && isMountedRef.current) {
            try {
              renderTimeoutRef.current = setTimeout(async () => {
                try {
                  if ((window as any).MathJax?.typesetPromise && isMountedRef.current && containerRef.current) {
                    await (window as any).MathJax.typesetPromise([containerRef.current])
                  }
                  if (isMountedRef.current) setIsLoading(false)
                } catch (err) {
                  console.error("[v0] MathJax typeset error:", err)
                  if (isMountedRef.current) setIsLoading(false)
                }
              }, 100)
            } catch (err) {
              console.error("[v0] MathJax render error:", err)
              if (isMountedRef.current) setIsLoading(false)
            }
          }
        }

        if (mathJaxLoadedRef.current) {
          await loadAndTypeset()
          return
        }

        // Load MathJax if not already loaded
        if (!(window as any).MathJax) {
          const mathJaxScript = document.createElement("script")
          mathJaxScript.id = "MathJax-script"
          mathJaxScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          mathJaxScript.async = true

          mathJaxScript.onload = async () => {
            mathJaxLoadedRef.current = true
            if (isMountedRef.current) await loadAndTypeset()
          }

          mathJaxScript.onerror = () => {
            console.error("[v0] Failed to load MathJax script")
            if (isMountedRef.current) setIsLoading(false)
          }

          document.head.appendChild(mathJaxScript)
        } else {
          mathJaxLoadedRef.current = true
          await loadAndTypeset()
        }
      } catch (error) {
        console.error("[v0] Error in MathJax setup:", error)
        if (isMountedRef.current) setIsLoading(false)
      }
    }

    loadMathJax()
  }, [formattedContent])

  return (
    <div
      ref={containerRef}
      className={`math-content bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 my-3 overflow-x-auto max-w-full ${className}`}
    />
  )
}
