/** Map HTTP / storage errors to user-friendly upload messages. */
export function formatUploadErrorMessage(err: unknown, context = "Upload"): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes("413") || msg.toLowerCase().includes("too large") || msg.toLowerCase().includes("payload")) {
      return "File is too large for direct upload. Try a smaller file or lower recording quality."
    }
    if (msg.includes("403") || msg.includes("Forbidden")) {
      return "Storage permission denied. Contact support to verify R2 bucket access."
    }
    if (msg.includes("network") || msg.includes("timeout") || msg.includes("ECONN") || msg.includes("fetch")) {
      return "Network error during upload. Check your connection and try again."
    }
    if (msg.includes("Missing environment variable")) {
      return "Server storage is not configured. Contact the platform admin."
    }
    return msg
  }
  return `${context} failed. Please try again.`
}

export function formatHttpUploadError(status: number, serverMessage?: string): string {
  if (status === 413) {
    return "File is too large. Use a smaller video (under 100MB) or lower quality."
  }
  if (status === 403) {
    return serverMessage || "You do not have permission to upload this file."
  }
  if (status === 401) {
    return "Session expired. Please log in again."
  }
  if (status >= 500) {
    return serverMessage || "Server error during upload. Please try again in a moment."
  }
  return serverMessage || `Upload failed (HTTP ${status}).`
}
