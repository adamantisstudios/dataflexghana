import type { ReactNode } from "react"

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}'"]*)/g

/** Split plain text into segments with URLs as clickable anchor elements. */
export function linkifyMessage(message: string): ReactNode[] {
  if (!message) return []

  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(URL_PATTERN.source, URL_PATTERN.flags)

  while ((match = re.exec(message)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(message.slice(lastIndex, match.index))
    }
    const url = match[0]
    nodes.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-700 underline underline-offset-2 hover:text-blue-900 break-all"
      >
        {url}
      </a>,
    )
    lastIndex = re.lastIndex
  }

  if (lastIndex < message.length) {
    nodes.push(message.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [message]
}
