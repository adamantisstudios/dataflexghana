"use client"

import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface MessageComposerProps {
  message: string
  onMessageChange: (message: string) => void
  isLoading?: boolean
}

const MAX_CHARACTERS = 160

export function MessageComposer({
  message,
  onMessageChange,
  isLoading = false,
}: MessageComposerProps) {
  const characterCount = message.length
  const remainingCharacters = MAX_CHARACTERS - characterCount
  const isOverLimit = characterCount > MAX_CHARACTERS
  const percentageUsed = (characterCount / MAX_CHARACTERS) * 100

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    if (newMessage.length <= MAX_CHARACTERS) {
      onMessageChange(newMessage)
    }
  }

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-lg">Compose Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="sms-message" className="text-sm font-medium">
            Message (SMS - 160 character limit)
          </Label>
          <Textarea
            id="sms-message"
            placeholder="Type your message here. You have 160 characters."
            value={message}
            onChange={handleChange}
            disabled={isLoading}
            className="min-h-24 border-emerald-200 focus:border-emerald-500 resize-none font-mono text-sm"
          />
        </div>

        {/* Character Counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Characters: {characterCount}/{MAX_CHARACTERS}
            </span>
            <Badge
              variant={isOverLimit ? "destructive" : "default"}
              className={
                remainingCharacters <= 20
                  ? "bg-amber-500"
                  : isOverLimit
                    ? "bg-red-500"
                    : "bg-green-600"
              }
            >
              {Math.max(0, remainingCharacters)} left
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOverLimit
                  ? "bg-red-500"
                  : remainingCharacters <= 20
                    ? "bg-amber-500"
                    : "bg-green-600"
              }`}
              style={{ width: `${Math.min(100, percentageUsed)}%` }}
            />
          </div>
        </div>

        {/* Preview */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs font-medium text-emerald-700 mb-1">Preview:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {message}
            </p>
          </div>
        )}

        {/* Warnings */}
        {characterCount === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-700">
              💡 Compose your message. It will be sent to all selected agents.
            </p>
          </div>
        )}

        {remainingCharacters <= 10 && remainingCharacters > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-sm text-amber-700">
              ⚠️ You&apos;re approaching the character limit. {remainingCharacters} characters remaining.
            </p>
          </div>
        )}

        {isOverLimit && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-700">
              ❌ Message exceeds the 160 character limit by {Math.abs(remainingCharacters)} characters.
              Please reduce the message length.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
