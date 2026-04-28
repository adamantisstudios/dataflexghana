"use client"
import { Lock, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ReactNode } from "react"

interface PremiumInfoSectionProps {
  icon: ReactNode
  title: string
  content?: string | null
  placeholder?: string
  isLocked: boolean
  onRequestAccess: () => void
  children?: ReactNode
}

export function PremiumInfoSection({
  icon,
  title,
  content,
  placeholder,
  isLocked,
  onRequestAccess,
  children,
}: PremiumInfoSectionProps) {
  return (
    <Card
      className={`border-2 transition-all duration-300 ${
        isLocked
          ? "border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-blue-300 hover:shadow-md"
          : "border-blue-200 bg-gradient-to-br from-white to-blue-50"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Updated icon styling to use blue theme instead of amber */}
            <div className={`p-2 rounded-lg ${isLocked ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-600"}`}>
              {icon}
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          {isLocked && <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />}
        </div>
      </CardHeader>

      <CardContent>
        {/* ... existing code ... */}
        {!isLocked && content ? (
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {children || content}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Updated locked content styling to blue theme with dashed border */}
            <div className={`text-sm p-4 rounded-lg border-2 border-dashed ${
              isLocked ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50"
            }`}>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 leading-relaxed">{placeholder || content}</p>
              </div>
            </div>

            {isLocked && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 text-center font-medium">
                  This information is available upon request
                </p>
                {/* Updated button styling to blue theme */}
                <Button
                  onClick={onRequestAccess}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                >
                  <Lock className="h-3.5 w-3.5 mr-2" />
                  Request Access
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
