/**
 * Search Limit Exceeded Card
 * Displayed when user reaches their daily search limit
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Phone } from "lucide-react"

export default function SearchLimitExceededCard() {
  const message = "You have used your 5 free searches for today. To continue searching for candidates, please contact our support team for priority access."
  const phoneNumber = "+233 546 460 945"
  
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <AlertCircle className="h-8 w-8 text-orange-600 flex-shrink-0 mx-auto sm:mx-0 sm:mt-0.5" />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg text-orange-900 mb-2">
              Daily Search Limit Reached
            </h3>
            <p className="text-orange-800 mb-4">
              {message}
            </p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
              <a href={`tel:${phoneNumber.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Admin: {phoneNumber}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}