/**
 * Placeholder email sender — configure SMTP for production delivery.
 */
export async function sendEmail(_params: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<{ success: boolean }> {
  return { success: true }
}

export async function sendGroceryRequestNotificationEmail(request: {
  id: string
  full_name: string
  phone: string
  whatsapp?: string | null
  shopping_list: string
  address?: string | null
  landmark?: string | null
  delivery_time?: string | null
  notes?: string | null
  attachments?: string[]
  paystack_reference?: string | null
}): Promise<void> {
  const lines = [
    `New grocery request #${request.id}`,
    "",
    `Customer: ${request.full_name}`,
    `Phone: ${request.phone}`,
    request.whatsapp ? `WhatsApp: ${request.whatsapp}` : null,
    request.address ? `Address: ${request.address}` : null,
    request.landmark ? `Landmark: ${request.landmark}` : null,
    request.delivery_time ? `Preferred delivery: ${request.delivery_time}` : null,
    "",
    "Shopping list:",
    request.shopping_list,
    request.notes ? `\nNotes: ${request.notes}` : null,
    request.attachments?.length
      ? `\nAttachments (${request.attachments.length}):\n${request.attachments.join("\n")}`
      : null,
    request.paystack_reference ? `\nCommitment payment ref: ${request.paystack_reference}` : null,
    "",
    `Review in admin: /admin/grocery`,
  ].filter(Boolean)

  await sendEmail({
    to: "sales@dataflexghana.com",
    subject: `[DataFlex] New grocery request — ${request.full_name}`,
    text: lines.join("\n"),
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
  })
}
