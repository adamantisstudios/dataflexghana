export function generateWhatsAppLink(message: string): string {
  const phoneNumber = "233242799990"
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
}
