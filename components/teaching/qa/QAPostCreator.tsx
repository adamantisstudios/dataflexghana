"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface QAPostCreatorProps {
  channelId: string
  teacherId: string
  teacherName: string
  onPostCreated: () => void
}

export function QAPostCreator({ channelId, teacherId, teacherName, onPostCreated }: QAPostCreatorProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    question: "",
    questionFormat: "plain" as "plain" | "latex",
    optionA: "",
    optionAFormat: "plain" as "plain" | "latex",
    optionB: "",
    optionBFormat: "plain" as "plain" | "latex",
    optionC: "",
    optionCFormat: "plain" as "plain" | "latex",
    optionD: "",
    optionDFormat: "plain" as "plain" | "latex",
    optionE: "",
    optionEFormat: "plain" as "plain" | "latex",
    correctAnswer: "A" as "A" | "B" | "C" | "D" | "E",
    explanation: "",
    explanationFormat: "plain" as "plain" | "latex",
  })

  const handleCreateQAPost = async () => {
    // Validation
    if (!form.question.trim()) {
      toast.error("Question is required")
      return
    }

    if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
      toast.error("Options A, B, C, and D are required")
      return
    }

    try {
      setIsSubmitting(true)

      const { data: membership, error: memberError } = await supabase
        .from("channel_members")
        .select("role")
        .eq("channel_id", channelId)
        .eq("agent_id", teacherId)
        .single()

      if (memberError || !membership) {
        toast.error("You don't have permission to create Q&A posts in this channel")
        return
      }

      if (membership.role !== "admin" && membership.role !== "teacher") {
        toast.error("Only admins and teachers can create Q&A posts")
        return
      }

      const { error } = await supabase.from("qa_posts").insert([
        {
          channel_id: channelId,
          author_id: teacherId,
          author_name: teacherName,
          question: form.question,
          question_format: form.questionFormat,
          option_a: form.optionA,
          option_a_format: form.optionAFormat,
          option_b: form.optionB,
          option_b_format: form.optionBFormat,
          option_c: form.optionC,
          option_c_format: form.optionCFormat,
          option_d: form.optionD,
          option_d_format: form.optionDFormat,
          option_e: form.optionE || null,
          option_e_format: form.optionEFormat,
          correct_answer: form.correctAnswer,
          explanation: form.explanation || null,
          explanation_format: form.explanationFormat,
          is_revealed: false,
        },
      ])

      if (error) {
        console.error("[v0] Error creating Q&A post:", error)
        throw error
      }

      toast.success("Q&A post created successfully!")
      setOpen(false)
      setForm({
        question: "",
        questionFormat: "plain",
        optionA: "",
        optionAFormat: "plain",
        optionB: "",
        optionBFormat: "plain",
        optionC: "",
        optionCFormat: "plain",
        optionD: "",
        optionDFormat: "plain",
        optionE: "",
        optionEFormat: "plain",
        correctAnswer: "A",
        explanation: "",
        explanationFormat: "plain",
      })
      onPostCreated()
    } catch (error) {
      console.error("[v0] Error creating Q&A post:", error)
      toast.error("Failed to create Q&A post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Q&A Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Create Question & Answer Post</DialogTitle>
          <DialogDescription className="text-xs">
            Create a multiple-choice question post with LaTeX support
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-3">
          {/* Question Section */}
          <div className="space-y-2 border-b pb-3">
            <h3 className="font-semibold text-gray-800 text-sm">Question</h3>
            <div className="grid gap-1">
              <Label htmlFor="question-format" className="text-xs">
                Question Format
              </Label>
              <Select
                value={form.questionFormat}
                onValueChange={(val) => setForm({ ...form, questionFormat: val as "plain" | "latex" })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="latex">LaTeX (Math/Science)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="question" className="text-xs">
                Question Text
              </Label>
              <Textarea
                id="question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder={
                  form.questionFormat === "latex"
                    ? "Example: Solve for $$ x $$ in the equation $$ 2x + 5 = 15 $$"
                    : "What is the capital of Ghana?"
                }
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-2 border-b pb-3">
            <h3 className="font-semibold text-gray-800 text-sm">Answer Options</h3>

            {["A", "B", "C", "D", "E"].map((option) => {
              const key = `option${option}` as keyof typeof form
              const formatKey = `option${option}Format` as keyof typeof form
              const value = form[key] as string
              const format = form[formatKey] as string

              return (
                <div key={option} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label className="font-semibold text-gray-700 w-6 text-xs">{option}.</Label>
                    <Select value={format} onValueChange={(val) => setForm({ ...form, [formatKey]: val })}>
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plain">Plain</SelectItem>
                        <SelectItem value="latex">LaTeX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={value}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={`Option ${option}`}
                    rows={1}
                    disabled={option === "E"}
                    className={`text-xs ${option === "E" ? "opacity-60" : ""}`}
                  />
                </div>
              )
            })}
          </div>

          {/* Correct Answer & Explanation */}
          <div className="space-y-2 border-b pb-3">
            <h3 className="font-semibold text-gray-800 text-sm">Answer & Explanation</h3>

            <div className="grid gap-1">
              <Label htmlFor="correct-answer" className="text-xs">
                Correct Answer
              </Label>
              <Select
                value={form.correctAnswer}
                onValueChange={(val) => setForm({ ...form, correctAnswer: val as "A" | "B" | "C" | "D" | "E" })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="explanation-format" className="text-xs">
                Explanation Format
              </Label>
              <Select
                value={form.explanationFormat}
                onValueChange={(val) => setForm({ ...form, explanationFormat: val as "plain" | "latex" })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="latex">LaTeX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="explanation" className="text-xs">
                Explanation (Optional)
              </Label>
              <Textarea
                id="explanation"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="Explain why this is the correct answer..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateQAPost}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-xs h-8"
          >
            {isSubmitting ? "Creating..." : "Create Q&A Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
