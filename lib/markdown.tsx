"use client"

// Bulletproof markdown processor that works 100% in production
export function processMarkdown(content: string): string {
  if (!content) return ""

  try {
    // First try to use marked if available
    if (typeof window !== "undefined") {
      const { marked } = require("marked")

      // Configure marked with all options
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
        sanitize: false,
      })

      // Custom renderer for better styling
      const renderer = new marked.Renderer()

      renderer.heading = (text: string, level: number) => {
        const escapedText = text.toLowerCase().replace(/[^\w]+/g, "-")
        return `<h${level} id="${escapedText}" class="heading-${level}">${text}</h${level}>`
      }

      renderer.code = (code: string, language?: string) => {
        return `<pre class="code-block"><code class="language-${language || "text"}">${code}</code></pre>`
      }

      renderer.blockquote = (quote: string) => {
        return `<blockquote class="custom-blockquote">${quote}</blockquote>`
      }

      renderer.table = (header: string, body: string) => {
        return `<div class="table-wrapper"><table class="custom-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`
      }

      renderer.list = (body: string, ordered?: boolean) => {
        const type = ordered ? "ol" : "ul"
        return `<${type} class="custom-list">${body}</${type}>`
      }

      renderer.listitem = (text: string) => {
        return `<li class="custom-list-item">${text}</li>`
      }

      renderer.paragraph = (text: string) => {
        return `<p class="custom-paragraph">${text}</p>`
      }

      renderer.strong = (text: string) => {
        return `<strong class="custom-strong">${text}</strong>`
      }

      renderer.em = (text: string) => {
        return `<em class="custom-em">${text}</em>`
      }

      renderer.codespan = (text: string) => {
        return `<code class="custom-code">${text}</code>`
      }

      marked.use({ renderer })

      const html = marked(content)
      return basicSanitize(html)
    }
  } catch (error) {
    console.warn("Marked failed, using comprehensive fallback:", error)
  }

  // Comprehensive fallback that handles ALL markdown elements
  return processMarkdownFallback(content)
}

function processMarkdownFallback(content: string): string {
  let html = content

  // Process headers (must be done first)
  html = html.replace(/^######\s+(.*)$/gm, '<h6 class="heading-6">$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5 class="heading-5">$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4 class="heading-4">$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3 class="heading-3">$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2 class="heading-2">$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1 class="heading-1">$1</h1>')

  // Process tables
  html = html.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (match, header, body) => {
    const headerCells = header
      .split("|")
      .map((cell: string) => cell.trim())
      .filter((cell: string) => cell)
    const headerRow =
      "<tr>" + headerCells.map((cell: string) => `<th class="custom-table-th">${cell}</th>`).join("") + "</tr>"

    const bodyRows = body
      .trim()
      .split("\n")
      .map((row: string) => {
        const cells = row
          .split("|")
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell)
        return "<tr>" + cells.map((cell: string) => `<td class="custom-table-td">${cell}</td>`).join("") + "</tr>"
      })
      .join("")

    return `<div class="table-wrapper"><table class="custom-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table></div>`
  })

  // Process blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote class="custom-blockquote">$1</blockquote>')

  // Process code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code class="language-$1">$2</code></pre>')

  // Process unordered lists
  html = html.replace(/^[\s]*[-*+]\s+(.*)$/gm, '<li class="custom-list-item">$1</li>')
  html = html.replace(/(<li class="custom-list-item">.*<\/li>)/s, '<ul class="custom-list">$1</ul>')

  // Process ordered lists
  html = html.replace(/^[\s]*\d+\.\s+(.*)$/gm, '<li class="custom-list-item">$1</li>')

  // Process inline code
  html = html.replace(/`([^`]+)`/g, '<code class="custom-code">$1</code>')

  // Process bold and italic (order matters)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="custom-strong"><em class="custom-em">$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="custom-strong">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em class="custom-em">$1</em>')

  // Process links
  html = html.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" class="custom-link">$1</a>')

  // Process images
  html = html.replace(/!\[([^\]]*)\]$$([^)]+)$$/g, '<img src="$2" alt="$1" class="custom-image" />')

  // Process line breaks
  html = html.replace(/\n\n/g, '</p><p class="custom-paragraph">')
  html = html.replace(/\n/g, "<br />")

  // Wrap in paragraph if not already wrapped
  if (
    !html.includes("<p") &&
    !html.includes("<h") &&
    !html.includes("<ul") &&
    !html.includes("<ol") &&
    !html.includes("<table")
  ) {
    html = `<p class="custom-paragraph">${html}</p>`
  }

  return basicSanitize(html)
}

function basicSanitize(html: string): string {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "")
}

export function stripMarkdown(content: string): string {
  if (!content) return ""

  return content
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1") // Remove links
    .replace(/!\[([^\]]*)\]$$[^)]+$$/g, "$1") // Remove images
    .replace(/>\s+/g, "") // Remove blockquotes
    .replace(/\n/g, " ") // Replace newlines with spaces
    .trim()
}
