"use client"
import { useEffect, useRef, useState } from "react"

interface MathRendererProps {
  content: string
  className?: string
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const renderTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)

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

        containerRef.current.innerHTML = ""
        const textNode = document.createTextNode(content)
        containerRef.current.appendChild(textNode)

        const loadAndTypeset = async () => {
          if ((window as any).MathJax && containerRef.current && isMountedRef.current) {
            try {
              renderTimeoutRef.current = setTimeout(async () => {
                try {
                  if ((window as any).MathJax?.typesetPromise && isMountedRef.current) {
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

        // Load MathJax if not already loaded
        if (!(window as any).MathJax) {
          const mathJaxScript = document.createElement("script")
          mathJaxScript.id = "MathJax-script"
          mathJaxScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          mathJaxScript.async = true

          mathJaxScript.onload = async () => {
            if (isMountedRef.current) await loadAndTypeset()
          }

          mathJaxScript.onerror = () => {
            console.error("[v0] Failed to load MathJax script")
            if (isMountedRef.current) setIsLoading(false)
          }

          document.head.appendChild(mathJaxScript)
        } else {
          await loadAndTypeset()
        }
      } catch (error) {
        console.error("[v0] Error in MathJax setup:", error)
        if (isMountedRef.current) setIsLoading(false)
      }
    }

    loadMathJax()
  }, [content])

  return (
    <div
      ref={containerRef}
      className={`math-content bg-white border border-gray-200 rounded-lg p-4 my-3 overflow-x-auto max-w-full ${className}`}
    />
  )
}
