"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Building2, Baby, CreditCard, Handshake, Wallet, X } from "lucide-react"
import type { ComplianceForm } from "@/lib/supabase"

interface FormSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  forms: ComplianceForm[]
  onSelectForm: (form: ComplianceForm) => void
}

export function FormSelectionDialog({ open, onOpenChange, forms, onSelectForm }: FormSelectionDialogProps) {
  const getFormIcon = (formName: string) => {
    switch (formName) {
      case "Sole Proprietorship":
        return <Building2 className="h-5 w-5 text-blue-600" />
      case "Birth Certificate":
        return <Baby className="h-5 w-5 text-green-600" />
      case "TIN Registration":
        return <CreditCard className="h-5 w-5 text-purple-600" />
      case "Partnership Registration":
        return <Handshake className="h-5 w-5 text-emerald-600" />
      case "Bank Account":
        return <Wallet className="h-5 w-5 text-blue-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg p-0 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 relative">
          <DialogTitle className="text-base sm:text-lg pr-6">Select a Form</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm mt-1">
            Choose the type of compliance form to submit
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 py-2">
          <div className="grid grid-cols-1 gap-2">
            {forms.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-xs font-medium">No forms available</p>
                <p className="text-xs mt-1">Contact your administrator.</p>
              </div>
            ) : (
              forms.map((form) => (
                <Card
                  key={form.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:bg-gray-50"
                  onClick={() => onSelectForm(form)}
                >
                  <CardHeader className="p-2.5 sm:p-3 pb-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-shrink-0">
                        {getFormIcon(form.form_name)}
                      </div>
                      <CardTitle className="text-xs sm:text-sm font-semibold line-clamp-1">
                        {form.form_name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-3 pt-1">
                    <CardDescription className="text-xs line-clamp-2 mb-2">
                      {form.form_description}
                    </CardDescription>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 sm:h-8"
                      variant="default"
                    >
                      Start Form
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
