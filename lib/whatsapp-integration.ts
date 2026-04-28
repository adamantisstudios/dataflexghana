/**
 * WhatsApp Integration Utilities
 * Handles WhatsApp message generation and URL creation for CV requests
 */

export interface CVRequestOptions {
  candidateName: string
  candidateEmail?: string
  position: string
  location: string
  country: string
  phoneNumber?: string
}

/**
 * Default WhatsApp business number for CV requests
 */
const DEFAULT_WHATSAPP_NUMBER = "+233546460945"

/**
 * Masks a phone number by showing only first 4 digits
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "***-****"
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 4) return "***-****"
  return digits.slice(0, 4) + "***"
}

/**
 * Masks an email address by showing first letter and domain
 */
export function maskEmail(email: string): string {
  if (!email) return "***@***.com"
  const [name, domain] = email.split("@")
  if (!name || !domain) return "***@***.com"
  const masked = name.charAt(0) + "*".repeat(Math.max(0, name.length - 2)) + "@" + domain
  return masked
}

/**
 * Returns the full name without abbreviation
 */
export function getFullName(fullName: string): string {
  return fullName || "Professional"
}

/**
 * Generates a WhatsApp message for requesting candidate CV
 */
export function generateCVRequestMessage(options: CVRequestOptions): string {
  const fullName = getFullName(options.candidateName)
  return `Hello, I need more information about this candidate:\n\n*Name:* ${fullName}\n*Position:* ${options.position}\n*Location:* ${options.location}\n*Country:* ${options.country}\n${options.email ? `*Email:* ${options.email}\n` : ""}Please provide their CV and full contact details.`
}

/**
 * Creates a WhatsApp URL for opening chat with pre-filled message
 */
export function createWhatsAppURL(message: string, phoneNumber: string = DEFAULT_WHATSAPP_NUMBER): string {
  return `https://wa.me/${233546460945}?text=${encodeURIComponent(message)}`
}

/**
 * Combines message generation and URL creation for CV request
 */
export function initiateWhatsAppCVRequest(options: CVRequestOptions, phoneNumber?: string): string {
  const message = generateCVRequestMessage(options)
  return createWhatsAppURL(message, phoneNumber)
}

/**
 * Opens WhatsApp CV request in new window
 */
export function openWhatsAppCVRequest(options: CVRequestOptions, phoneNumber?: string): void {
  const url = initiateWhatsAppCVRequest(options, phoneNumber)
  window.open(url, "_blank")
}
