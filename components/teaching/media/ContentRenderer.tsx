"use client"
import type { ReactNode } from "react"
import { EnhancedMathRenderer } from "./EnhancedMathRenderer"
import { CodeBlockRenderer } from "./CodeBlockRenderer"
import { TableRenderer } from "./TableRenderer"
import { LinkPreviewRenderer } from "./LinkPreviewRenderer"
import { LinkDetector } from "./LinkDetector"
import { MobileResponsiveMathWrapper } from "./MobileResponsiveMathWrapper"

interface ContentRendererProps {
  content: string
}

export function ContentRenderer({ content }: ContentRendererProps) {
  // Check for different content types
  const hasMath =
    content.includes("\\(") ||
    content.includes("\\[") ||
    content.includes("$$") ||
    content.includes("∛") ||
    content.includes("√")
  const hasCodeBlock = content.includes("```")
  const hasTable = content.includes("|") && content.split("\n").length > 2
  const hasMarkdownLinks = /\[([^\]]+)\]$$([^)]+)$$/g.test(content)

  const renderWithMarkdownLinks = (text: string): ReactNode[] => {
    const linkRegex = /\[([^\]]+)\]$$([^)]+)$$/g
    const parts: ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      parts.push(<LinkPreviewRenderer key={`link-${match.index}`} url={match[2]} title={match[1]} />)

      lastIndex = linkRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  if (hasMath) {
    return (
      <MobileResponsiveMathWrapper>
        <EnhancedMathRenderer content={content} />
      </MobileResponsiveMathWrapper>
    )
  }

  if (hasCodeBlock) {
    return <CodeBlockRenderer code={content} language="javascript" />
  }

  if (hasTable) {
    return (
      <MobileResponsiveMathWrapper>
        <TableRenderer content={content} />
      </MobileResponsiveMathWrapper>
    )
  }

  if (hasMarkdownLinks) {
    return <div className="space-y-3">{renderWithMarkdownLinks(content)}</div>
  }

  return (
    <div className="space-y-3">
      <p className="text-gray-700 text-sm break-words whitespace-pre-wrap leading-relaxed">{content}</p>
      <LinkDetector text={content} />
    </div>
  )
}
