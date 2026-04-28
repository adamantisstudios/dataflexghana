// SMS Provider Configuration
export const SMS_CONFIG = {
  USMS_GH: {
    name: "USMS-GH",
    endpoint: process.env.NEXT_PUBLIC_SMS_API_ENDPOINT || "https://webapp.usmsgh.com/api/http/",
    token: process.env.NEXT_PUBLIC_SMS_API_TOKEN || "",
    sender: "YourBusiness", // Default sender name - can be customized
  },
}

export function validateSmsConfig(): boolean {
  return !!SMS_CONFIG.USMS_GH.token && SMS_CONFIG.USMS_GH.token.length > 0
}

export function getSmsConfig() {
  if (!validateSmsConfig()) {
    throw new Error("SMS API token is not configured. Please add NEXT_PUBLIC_SMS_API_TOKEN to your environment variables.")
  }
  return SMS_CONFIG.USMS_GH
}
