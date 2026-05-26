/** LiveKit errors that often resolve once tracks finish subscribing. */
export function isTransientLiveKitError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes("insufficient permission") ||
    m.includes("insufficient permissions") ||
    m.includes("tracksubscriptionfailed") ||
    m.includes("subscription failed") ||
    m.includes("not allowed to subscribe")
  )
}
