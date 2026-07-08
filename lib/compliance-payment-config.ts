/** Admin payment details for compliance form fees (manual MoMo / bank transfer). */
export const COMPLIANCE_ADMIN_PAYMENT = {
  accountName: "Adamantis Solutions (Francis Ani-Johnson .K)",
  alternativePaymentName: "Francis Ani-Johnson",
  momoNumber: "0557943392",
  altContact: "0246827049",
} as const

export function formatCompliancePaymentInstructions(amount: number, formName?: string): string {
  const label = formName ? ` for ${formName}` : ""
  return `Please pay GHS ${amount.toFixed(2)}${label} to ${COMPLIANCE_ADMIN_PAYMENT.accountName} via Mobile Money: ${COMPLIANCE_ADMIN_PAYMENT.momoNumber}. Alternative Payment Name: ${COMPLIANCE_ADMIN_PAYMENT.alternativePaymentName}. Use your submission reference in the payment description. Contact ${COMPLIANCE_ADMIN_PAYMENT.altContact} if you need help.`
}
