"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MathRenderer } from "./MathRenderer"
import { BookOpen } from "lucide-react"

export function DetailedMathExampleModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const mathExample = `\\[ \\textbf{Problem:} \\quad \\text{Evaluate the derivative of } f(x) = \\sqrt[3]{(2x^3 - 3x^2 + 5x - 7)} + \\sqrt{(x^2 + 4x + 4)} \\]
\\bigskip
\\textbf{Step 1: Simplify the square root term.} We begin by simplifying the quadratic expression inside the square root:
\\[ x^2 + 4x + 4 = (x + 2)^2 \\]
Thus,
\\[ \\sqrt{(x^2 + 4x + 4)} = \\sqrt{(x + 2)^2} = |x + 2| \\]
Therefore, the function can be rewritten as:
\\[ f(x) = \\sqrt[3]{(2x^3 - 3x^2 + 5x - 7)} + |x + 2| \\]
\\bigskip
\\textbf{Step 2: Differentiate each term separately.} We'll now find \$$ f'(x) \$$ by differentiating both parts of the function.
\\[ f'(x) = \\frac{d}{dx}\\left[\\sqrt[3]{(2x^3 - 3x^2 + 5x - 7)}\\right] + \\frac{d}{dx}|x + 2| \\]
\\medskip
\\textbf{(a) Derivative of the cube root term:} Let \$$ g(x) = 2x^3 - 3x^2 + 5x - 7 \$$. Then:
\\[ \\frac{d}{dx}\\left[\\sqrt[3]{g(x)}\\right] = \\frac{1}{3g(x)^{2/3}} \\cdot g'(x) \\]
Compute \$$ g'(x) \$$:
\\[ g'(x) = 6x^2 - 6x + 5 \\]
So, the derivative of the first term is:
\\[ \\frac{1}{3(2x^3 - 3x^2 + 5x - 7)^{2/3}} \\cdot (6x^2 - 6x + 5) \\]
\\medskip
\\textbf{(b) Derivative of the absolute value term:} The derivative of \$$ |x + 2| \$$ is given by the sign function:
\\[ \\frac{d}{dx}|x + 2| = \\text{sgn}(x + 2) = \\begin{cases} 1, & x > -2, \\\\ -1, & x < -2. \\end{cases} \\]
\\medskip
Therefore,
\\[ f'(x) = \\frac{1}{3(2x^3 - 3x^2 + 5x - 7)^{2/3}}(6x^2 - 6x + 5) + \\text{sgn}(x + 2) \\]
\\bigskip
\\textbf{Step 3: Evaluate the derivative at } \$$ x = 1. \$$ Substitute \$$ x = 1 \$$ into the expression for \$$ f'(x) \$$:
\\[ f'(1) = \\frac{1}{3(2(1)^3 - 3(1)^2 + 5(1) - 7)^{2/3}}(6(1)^2 - 6(1) + 5) + \\text{sgn}(1 + 2) \\]
Simplify the inner terms:
\\[ 2(1)^3 - 3(1)^2 + 5(1) - 7 = 2 - 3 + 5 - 7 = -3 \\]
and
\\[ 6(1)^2 - 6(1) + 5 = 6 - 6 + 5 = 5 \\]
Also, since \$$ 1 + 2 = 3 > 0 \$$, we have \$$ \\text{sgn}(3) = 1 \$$.
Substituting these values:
\\[ f'(1) = \\frac{1}{3(-3)^{2/3}} \\cdot 5 + 1 \\]
\\[ f'(1) = \\frac{5}{3 \\cdot 3^{2/3}} + 1 \\]
\\[ f'(1) = \\frac{5}{3^{1 + 2/3}} + 1 = \\frac{5}{3^{5/3}} + 1 \\]
\\[ f'(1) \\approx \\frac{5}{6.24} + 1 \\approx 0.801 + 1 = 1.801 \\]`

  const formattingGuides = [
    {
      title: "Inline Math",
      example: "$$x^2 + y^2 = z^2$$",
      description: "Use $$ ... $$ for inline mathematical expressions",
    },
    {
      title: "Display Math",
      example: "\\[ \\frac{a}{b} \\]",
      description: "Use \\[ ... \\] for centered, larger mathematical expressions",
    },
    {
      title: "Fractions",
      example: "$$\\frac{numerator}{denominator}$$",
      description: "Use \\frac{} for fractions",
    },
    {
      title: "Superscripts & Subscripts",
      example: "$$x^2, x_i, x^{2n}$$",
      description: "Use ^ for superscripts and _ for subscripts",
    },
    {
      title: "Roots",
      example: "$$\\sqrt{x}, \\sqrt[3]{x}$$",
      description: "Use \\sqrt{} for square roots and \\sqrt[n]{} for nth roots",
    },
    {
      title: "Greek Letters",
      example: "$$\\alpha, \\beta, \\gamma, \\pi, \\sigma$$",
      description: "Use backslash followed by letter name",
    },
    {
      title: "Calculus",
      example: "$$\\frac{d}{dx}, \\int, \\sum, \\lim$$",
      description: "Use \\frac{d}{dx} for derivatives, \\int for integrals, \\sum for summation",
    },
    {
      title: "Matrices",
      example: "$$\\begin{matrix} a & b \\\\ c & d \\end{matrix}$$",
      description: "Use matrix environment for arrays",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-8 min-h-[44px] bg-red-600 px-2 text-xs text-white hover:bg-red-700">
          <BookOpen className="mr-1 h-3 w-3" />
          Detailed Example
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[700px] flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b border-gray-100 px-4 py-3 pr-12 text-left">
          <DialogTitle className="text-base sm:text-lg">Detailed Math Formatting Guide</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Basic Formatting Examples</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {formattingGuides.map((guide, idx) => (
                <div key={idx} className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <p className="text-xs font-medium text-gray-800 sm:text-sm">{guide.title}</p>
                  <div className="overflow-x-auto rounded border border-gray-300 bg-white p-1.5 font-mono text-xs text-gray-700">
                    {guide.example}
                  </div>
                  <p className="text-xs text-gray-600">{guide.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <h3 className="text-sm font-semibold text-gray-800">Complete Example: Calculus Problem</h3>
            <p className="text-xs text-gray-600">
              Below is a complete example showing how to format a complex mathematical problem with multiple steps:
            </p>
            <div className="space-y-2 overflow-x-auto rounded-lg border-2 border-blue-200 bg-blue-50 p-2 sm:p-3">
              <MathRenderer content={mathExample} />
            </div>
          </div>

          <div className="space-y-2 rounded border-l-4 border-amber-500 bg-amber-50 p-2 sm:p-3">
            <p className="text-xs font-semibold text-amber-900 sm:text-sm">Tips for Best Results:</p>
            <ul className="list-inside list-disc space-y-1 pl-3 text-xs text-amber-800">
              <li>Use \\bigskip and \\medskip for spacing between sections</li>
              <li>Use \\textbf{} for bold text and \\text{} for regular text in math mode</li>
              <li>Use cases for piecewise functions</li>
              <li>Always wrap math content in either $$ or \\[ \\]</li>
              <li>Test your formatting before publishing to ensure it renders correctly</li>
            </ul>
          </div>

          <div className="space-y-2 rounded border-l-4 border-green-500 bg-green-50 p-2 sm:p-3">
            <p className="text-xs font-semibold text-green-900 sm:text-sm">Common Mathematical Symbols:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-green-800 sm:grid-cols-3">
              {[
                { symbol: "\\pm", display: "±" },
                { symbol: "\\times", display: "×" },
                { symbol: "\\div", display: "÷" },
                { symbol: "\\leq", display: "≤" },
                { symbol: "\\geq", display: "≥" },
                { symbol: "\\neq", display: "≠" },
                { symbol: "\\approx", display: "≈" },
                { symbol: "\\infty", display: "∞" },
                { symbol: "\\in", display: "∈" },
              ].map((item, idx) => (
                <div key={idx} className="p-1">
                  <p className="font-mono">{item.symbol}</p>
                  <p className="text-green-700">{item.display}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
