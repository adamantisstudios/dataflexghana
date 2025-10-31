"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { CreditCard, Copy, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentReminderModalProps {
  isOpen: boolean
  onClose: () => void
  fee: string
  serviceName: string
}

export function PaymentReminderModal({ isOpen, onClose, fee, serviceName }: PaymentReminderModalProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText("0557943392")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <h2 className="text-green-600 font-semibold">Payment Reminder</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Service</p>
              <p className="text-sm text-gray-600">{serviceName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Fee</p>
              <p className="text-lg font-bold text-green-600">{fee}</p>
            </div>

            <div className="border-t border-green-200 pt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">MOMO Line</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded border border-green-200 text-sm font-mono font-bold text-gray-800">
                    0557943392
                  </code>
                  <Button size="sm" variant="outline" onClick={copyToClipboard} className="px-2 bg-transparent">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Name</p>
                <p className="text-sm text-gray-700 font-medium">Adamantis Solutions (Ani Johnson Francis)</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Please make payment and include your Agent Name as a reference. Your service will be processed after payment
            confirmation.
          </p>

          <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
            I've Made Payment / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
