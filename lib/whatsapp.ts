/**
 * WhatsApp message formatting utility
 * Provides helper functions for formatting and sending WhatsApp messages
 */

export function formatWhatsAppMessage(
  data: Record<string, any>,
  documentType?: string
): string {
  let message = "";

  if (documentType) {
    message += `📋 *${documentType} Registration*\n\n`;
  }

  // Format the data as key-value pairs
  for (const [key, value] of Object.entries(data)) {
    if (value && value !== "") {
      // Convert camelCase to readable text
      const readableKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      message += `• ${readableKey}: ${value}\n`;
    }
  }

  message += "\n📞 Please confirm receipt of this information.";

  return message;
}

export function generateWhatsAppLink(message: string, phoneNumber: string = ""): string {
  const encodedMessage = encodeURIComponent(message);
  const baseUrl = "https://wa.me/";

  if (phoneNumber) {
    // Remove any non-numeric characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    return `${baseUrl}${cleanPhone}?text=${encodedMessage}`;
  }

  return `${baseUrl}?text=${encodedMessage}`;
}
