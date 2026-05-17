"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { COMPLIANCE_ADMIN_PAYMENT } from "@/lib/compliance-payment-config"
import { CreditCard, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CompliancePaymentAlertProps {
  open: boolean
  amount: number
  formName: string
  onAcknowledge: () => void
}

export function CompliancePaymentAlert({
  open,
  amount,
  formName,
  onAcknowledge,
}: CompliancePaymentAlertProps) {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent
        className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-2">
            <CreditCard className="h-6 w-6 text-amber-700" />
          </div>
          <AlertDialogTitle className="text-center text-lg">Payment required</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm text-left text-slate-700">
              <p>
                Your <strong>{formName}</strong> submission was received. Complete payment to the admin before
                processing begins.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="font-semibold text-amber-900">Amount due: ₵{amount.toFixed(2)}</p>
                <div>
                  <p className="text-xs text-amber-800 uppercase tracking-wide">Pay to</p>
                  <p className="font-medium">{COMPLIANCE_ADMIN_PAYMENT.accountName}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-amber-800">Mobile Money</p>
                    <p className="font-mono font-bold text-lg">{COMPLIANCE_ADMIN_PAYMENT.momoNumber}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => copy(COMPLIANCE_ADMIN_PAYMENT.momoNumber)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-700">
                  Support: {COMPLIANCE_ADMIN_PAYMENT.altContact}. Include your name and form type in the reference.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="w-full bg-amber-600 hover:bg-amber-700"
            onClick={onAcknowledge}
          >
            I understand — I will make payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
