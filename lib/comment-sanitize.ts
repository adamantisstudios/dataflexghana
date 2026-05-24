export function sanitizeCommentContent(content: string): string {
  let sanitized = content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[removed]")
  sanitized = sanitized.replace(/\d{7,}/g, "[removed]")
  return sanitized.trim()
}
