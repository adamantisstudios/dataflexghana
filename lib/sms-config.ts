// SMS Provider Configuration (Arkesel)
export const SMS_CONFIG = {
  ARKESEL: {
    name: "Arkesel",
    baseUrl: "https://sms.arkesel.com/sms/api",
    apiKey: process.env.ARKESEL_API_KEY || "",
    senderId: process.env.ARKESEL_SENDER_ID || "MyDataflex",
  },
}

export function validateSmsConfig(): boolean {
  return SMS_CONFIG.ARKESEL.apiKey.length > 0
}

export function getSmsConfig() {
  if (!validateSmsConfig()) {
    throw new Error(
      "Arkesel SMS is not configured. Add ARKESEL_API_KEY to your environment variables.",
    )
  }
  return SMS_CONFIG.ARKESEL
}
