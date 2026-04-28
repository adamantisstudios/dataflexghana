import React from "react"

interface RichTextRendererProps {
  content: string
  className?: string
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className }) => {
  const formatText = (text: string) => {
    if (!text) return ""

    // Convert markdown-style formatting to HTML
    let formatted = text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic text
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Line breaks (convert single \n to <br>, double \n\n to paragraph breaks)
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      // Bullet points
      .replace(/^• (.+)$/gm, '<li class="list-disc ml-4">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="list-decimal ml-4">$1</li>')

    // Wrap in paragraph tags if there's content
    if (formatted && !formatted.startsWith("<")) {
      formatted = "<p>" + formatted + "</p>"
    }

    // Wrap consecutive <li> elements in <ul>
    formatted = formatted.replace(
      /(<li class="list-disc[^>]*>.*?<\/li>)(?:\s*<br>\s*<li class="list-disc[^>]*>.*?<\/li>)*/gs,
      (match) => {
        return '<ul class="my-2">' + match.replace(/<br>\s*/g, "") + "</ul>"
      },
    )

    formatted = formatted.replace(
      /(<li class="list-decimal[^>]*>.*?<\/li>)(?:\s*<br>\s*<li class="list-decimal[^>]*>.*?<\/li>)*/gs,
      (match) => {
        return '<ol class="my-2">' + match.replace(/<br>\s*/g, "") + "</ol>"
      },
    )

    return formatted
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
      style={{
        lineHeight: "1.6",
      }}
    />
  )
}
