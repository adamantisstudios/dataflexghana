export function detectURLsInText(text: string): Array<{ url: string; start: number; end: number }> {
  // Regex pattern for URLs (matches http://, https://, and www.)
  const urlRegex = /((https?:\/\/)|(www\.))[^\s<>[\]{}|\\^`"]*[^\s<>[\]{}|\\^`".,;:!?()]/g

  const urls: Array<{ url: string; start: number; end: number }> = []
  let match

  while ((match = urlRegex.exec(text)) !== null) {
    let url = match[0]

    // Clean up trailing punctuation
    while (url.match(/[.,;:!?)\]}-]$/)) {
      url = url.slice(0, -1)
    }

    // Add protocol if missing
    if (url.startsWith("www.")) {
      url = "https://" + url
    }

    urls.push({
      url,
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  return urls
}

export function cleanURLForDisplay(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + (urlObj.pathname !== "/" ? urlObj.pathname : "")
  } catch {
    return url
  }
}
