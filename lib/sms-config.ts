// SMS Provider Configuration (Hubtel)
export const SMS_CONFIG = {
  HUBTEL: {
    name: "Hubtel",
    endpoint: "https://api.hubtel.com/v1/messages/send",
    clientId: process.env.HUBTEL_CLIENT_ID || "",
    clientSecret: process.env.HUBTEL_CLIENT_SECRET || "",
    senderId: "233551999901",
  },
}

export function validateSmsConfig(): boolean {
  const { clientId, clientSecret } = SMS_CONFIG.HUBTEL
  return clientId.length > 0 && clientSecret.length > 0
}

export function getSmsConfig() {
  if (!validateSmsConfig()) {
    throw new Error(
      "Hubtel SMS credentials are not configured. Add HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET to your environment variables.",
    )
  }
  return SMS_CONFIG.HUBTEL
}

export function getHubtelBasicAuthHeader(): string {
  const config = getSmsConfig()
  const credentials = `${config.clientId}:${config.clientSecret}`
  const encoded =
    typeof Buffer !== "undefined"
      ? Buffer.from(credentials).toString("base64")
      : btoa(credentials)
  return `Basic ${encoded}`
}
