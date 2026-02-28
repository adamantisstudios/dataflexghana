"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Building2, Baby, CreditCard, Handshake, Wallet } from "lucide-react"
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
        return <Building2 className="h-8 w-8 text-blue-600" />
      case "Birth Certificate":
        return <Baby className="h-8 w-8 text-green-600" />
      case "TIN Registration":
        return <CreditCard className="h-8 w-8 text-purple-600" />
      case "Partnership Registration":
        return <Handshake className="h-8 w-8 text-emerald-600" />
      case "Bank Account":
        return <Wallet className="h-8 w-8 text-blue-600" />
      default:
        return <FileText className="h-8 w-8 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select a Form</DialogTitle>
          <DialogDescription>Choose the type of compliance form you want to submit</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {forms.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No forms available</p>
              <p className="text-sm mt-2">Please contact your administrator to set up compliance forms.</p>
            </div>
          ) : (
            forms.map((form) => (
              <Card
                key={form.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelectForm(form)}
              >
                <CardHeader>
                  <div className="flex justify-center mb-2">{getFormIcon(form.form_name)}</div>
                  <CardTitle className="text-center text-lg">{form.form_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm">{form.form_description}</CardDescription>
                  <Button className="w-full mt-4 bg-transparent" variant="outline">
                    Start Form
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
