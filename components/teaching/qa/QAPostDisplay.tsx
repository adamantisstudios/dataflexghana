"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Eye, Trash2, EyeIcon, EyeOff, Heart, MessageCircle, Share2, Bookmark } from "lucide-react"
import { toast } from "sonner"
import { EnhancedMathRenderer } from "../media/EnhancedMathRenderer"

interface QAPostDisplayProps {
  id: string
  question: string
  questionFormat: "plain" | "latex"
  optionA: string
  optionAFormat: "plain" | "latex"
  optionB: string
  optionBFormat: "plain" | "latex"
  optionC: string
  optionCFormat: "plain" | "latex"
  optionD: string
  optionDFormat: "plain" | "latex"
  optionE?: string
  optionEFormat?: "plain" | "latex"
  correctAnswer: string
  explanation?: string
  explanationFormat?: "plain" | "latex"
  isRevealed: boolean
  authorName: string
  createdAt: string
  viewCount: number
  currentUserId: string
  isTeacher: boolean
  onDelete: (id: string) => void
  onReveal: (id: string) => void
}

export function QAPostDisplay({
  id,
  question,
  questionFormat,
  optionA,
  optionAFormat,
  optionB,
  optionBFormat,
  optionC,
  optionCFormat,
  optionD,
  optionDFormat,
  optionE,
  optionEFormat,
  correctAnswer,
  explanation,
  explanationFormat,
  isRevealed,
  authorName,
  createdAt,
  viewCount,
  currentUserId,
  isTeacher,
  onDelete,
  onReveal,
}: QAPostDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [userResponse, setUserResponse] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isCheckingSaved, setIsCheckingSaved] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user's previous response
        const { data: responseData, error: responseError } = await supabase
          .from("qa_responses")
          .select("*")
          .eq("qa_post_id", id)
          .eq("student_id", currentUserId)

        if (responseError) {
          console.error("[v0] Error loading user response:", responseError)
        } else if (responseData && responseData.length > 0) {
          setUserResponse(responseData[0])
          setSelectedAnswer(responseData[0].selected_answer)
        }

        // Check if post is saved
        const { data: savedData, error: savedError } = await supabase
          .from("saved_posts")
          .select("id")
          .eq("qa_post_id", id)
          .eq("user_id", currentUserId)

        if (savedError) {
          console.error("[v0] Error checking saved status:", savedError)
        } else {
          setIsSaved(savedData && savedData.length > 0)
        }
      } catch (err) {
        console.error("[v0] Exception loading user data:", err)
      } finally {
        setIsCheckingSaved(false)
      }
    }

    if (id && currentUserId) {
      loadUserData()
    }
  }, [id, currentUserId])

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      toast.error("Please select an answer")
      return
    }

    try {
      setIsSubmitting(true)

      if (userResponse) {
        const { error } = await supabase
          .from("qa_responses")
          .update({
            selected_answer: selectedAnswer,
            is_correct: selectedAnswer === correctAnswer,
          })
          .eq("id", userResponse.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("qa_responses").insert([
          {
            qa_post_id: id,
            student_id: currentUserId,
            selected_answer: selectedAnswer,
            is_correct: selectedAnswer === correctAnswer,
          },
        ])

        if (error) throw error
      }

      toast.success(selectedAnswer === correctAnswer ? "Correct answer!" : "Answer submitted")
      setUserResponse({ selected_answer: selectedAnswer, is_correct: selectedAnswer === correctAnswer })
    } catch (error) {
      console.error("[v0] Error submitting answer:", error)
      toast.error("Failed to submit answer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        const { error } = await supabase.from("saved_posts").delete().eq("qa_post_id", id).eq("user_id", currentUserId)

        if (error) throw error
        setIsSaved(false)
        toast.success("Post removed from saved")
      } else {
        const { error } = await supabase.from("saved_posts").insert([
          {
            user_id: currentUserId,
            qa_post_id: id,
            post_type: "qa",
          },
        ])

        if (error) throw error
        setIsSaved(true)
        toast.success("Post saved!")
      }
    } catch (error) {
      console.error("[v0] Error toggling save:", error)
      toast.error("Failed to save post")
    }
  }

  const renderContent = (content: string, format: "plain" | "latex") => {
    if (format === "latex") {
      return <EnhancedMathRenderer content={content} />
    }
    return <p className="text-gray-700 whitespace-pre-wrap break-words">{content}</p>
  }

  const options = [
    { label: "A", text: optionA, format: optionAFormat },
    { label: "B", text: optionB, format: optionBFormat },
    { label: "C", text: optionC, format: optionCFormat },
    { label: "D", text: optionD, format: optionDFormat },
    ...(optionE ? [{ label: "E", text: optionE, format: optionEFormat }] : []),
  ]

  return (
    <Card className="border-purple-200 bg-white/90 hover:shadow-lg transition-all w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-1 flex-wrap">
          <div className="flex-1 min-w-0">
            <Badge className="mb-1 bg-purple-100 text-purple-800 text-xs">Q&A Post</Badge>
            <CardTitle className="text-sm text-purple-800">Question</CardTitle>
            <p className="text-xs text-gray-600 mt-0.5">
              by {authorName} • {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
          {isTeacher && (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReveal(id)}
                className="text-purple-600 border-purple-200 h-6 w-6 p-0"
              >
                {isRevealed ? <EyeOff className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(id)} className="h-6 w-6 p-0">
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 w-full">
        {/* Question */}
        <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 w-full overflow-x-auto">
          <p className="text-xs font-semibold text-purple-800 mb-1">Question:</p>
          <div className="w-full text-sm">{renderContent(question, questionFormat)}</div>
        </div>

        {/* Options */}
        <div className="space-y-1 w-full">
          <p className="text-xs font-semibold text-gray-800">Select your answer:</p>
          {options.map((option) => (
            <div
              key={option.label}
              className={`p-2 rounded-lg border-2 cursor-pointer transition-all w-full overflow-x-auto ${
                selectedAnswer === option.label
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-white hover:border-purple-300"
              }`}
              onClick={() => !userResponse && setSelectedAnswer(option.label)}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedAnswer === option.label ? "border-purple-500 bg-purple-500" : "border-gray-300 bg-white"
                  }`}
                >
                  {selectedAnswer === option.label && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs">{option.label}.</p>
                  <div className="w-full overflow-x-auto text-sm">
                    {renderContent(option.text, option.format as "plain" | "latex")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {!userResponse && (
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </Button>
        )}

        {/* User's Response */}
        {userResponse && (
          <div
            className={`p-2 rounded-lg border-2 w-full ${
              userResponse.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }`}
          >
            <p className={`text-xs font-semibold ${userResponse.is_correct ? "text-green-800" : "text-red-800"}`}>
              Your answer: {userResponse.selected_answer}
              {userResponse.is_correct ? " ✓ Correct!" : " ✗ Incorrect"}
            </p>
          </div>
        )}

        {/* Reveal Answer & Explanation */}
        {isRevealed && (
          <div className="space-y-2 border-t-2 border-purple-200 pt-2 w-full">
            <div className="bg-green-50 p-2 rounded-lg border border-green-200 w-full overflow-x-auto">
              <p className="text-xs font-semibold text-green-800 mb-0.5">Correct Answer:</p>
              <p className="text-base font-bold text-green-700">{correctAnswer}</p>
            </div>

            {explanation && (
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 w-full overflow-x-auto">
                <p className="text-xs font-semibold text-blue-800 mb-1">Explanation:</p>
                <div className="w-full text-sm">
                  {renderContent(explanation, explanationFormat as "plain" | "latex")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Actions */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-200 w-full flex-wrap">
          <div className="flex items-center gap-0.5 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-red-500 flex-1 sm:flex-none text-xs h-6 p-1"
            >
              <Heart className="h-3 w-3 mr-0.5" />
              <span className="hidden sm:inline">Like</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-500 flex-1 sm:flex-none text-xs h-6 p-1"
            >
              <MessageCircle className="h-3 w-3 mr-0.5" />
              <span className="hidden sm:inline">Comment</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-green-500 flex-1 sm:flex-none text-xs h-6 p-1"
            >
              <Share2 className="h-3 w-3 mr-0.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSave}
            disabled={isCheckingSaved}
            className={`${isSaved ? "text-amber-500" : "text-gray-600 hover:text-amber-500"} text-xs h-6 p-1`}
          >
            <Bookmark className={`h-3 w-3 ${isSaved ? "fill-current" : ""}`} />
            <span className="hidden sm:inline ml-0.5">Save</span>
          </Button>
        </div>

        {/* View Count */}
        <div className="flex items-center gap-1 text-xs text-gray-600 w-full">
          <Eye className="h-2.5 w-2.5" />
          {viewCount} views
        </div>
      </CardContent>
    </Card>
  )
}
