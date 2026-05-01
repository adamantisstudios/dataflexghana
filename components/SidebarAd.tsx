"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SidebarAdProps {
  onDismiss?: () => void
}

export default function SidebarAd({ onDismiss }: SidebarAdProps) {
  return (
    <Card className="sticky top-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg overflow-hidden hidden lg:block mb-6">
      <div className="relative">
        {/* Close Button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Ad Content */}
        <div className="p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-gray-900">Information</h3>
              <p className="text-sm text-gray-700">
                Complete your business registration accurately. Ensure all documents are properly filled out and signed before submission.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-900">IMPORTANT STEPS:</p>
              <ul className="text-xs text-gray-700 space-y-1 text-left">
                <li>✓ Fill all required fields</li>
                <li>✓ Double-check information</li>
                <li>✓ Attach required documents</li>
                <li>✓ Review before submitting</li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-600">
                Need help? Contact support for guidance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
