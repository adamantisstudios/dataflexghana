// SMS Provider Configuration (Arkesel) — read env at runtime, not at module load

const ARKESEL_BASE_URL = "https://sms.arkesel.com/sms/api"

/** Resolve API key when a request runs (required for Vercel/serverless). */
export function getArkeselApiKey(): string {
  const raw = process.env.ARKESEL_API_KEY
  if (raw === undefined || raw === null) {
    throw new Error("ARKESEL_API_KEY is not set")
  }
  const apiKey = String(raw).trim()
  if (!apiKey) {
    throw new Error("ARKESEL_API_KEY is not set")
  }
  return apiKey
}

export function validateSmsConfig(): boolean {
  try {
    getArkeselApiKey()
    return true
  } catch {
    return false
  }
}

export function getSmsConfig() {
  const apiKey = getArkeselApiKey()
  return {
    name: "Arkesel",
    baseUrl: ARKESEL_BASE_URL,
    apiKey,
    senderId: (process.env.ARKESEL_SENDER_ID || "MyDataflex").trim(),
  }
}
