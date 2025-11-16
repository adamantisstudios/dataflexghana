"use client"
import { useState } from "react"
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
        <Button className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-2">
          <BookOpen className="h-3 w-3 mr-1" />
          Detailed Example
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95%] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Detailed Math Formatting Guide</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Formatting Guide Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Basic Formatting Examples</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formattingGuides.map((guide, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
                  <p className="font-medium text-xs sm:text-sm text-gray-800">{guide.title}</p>
                  <div className="bg-white border border-gray-300 rounded p-1.5 text-xs font-mono text-gray-700 overflow-x-auto">
                    {guide.example}
                  </div>
                  <p className="text-xs text-gray-600">{guide.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Example Section */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-800">Complete Example: Calculus Problem</h3>
            <p className="text-xs text-gray-600">
              Below is a complete example showing how to format a complex mathematical problem with multiple steps:
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-2 sm:p-3 space-y-2 overflow-x-auto">
              <MathRenderer content={mathExample} />
            </div>
          </div>

          {/* Tips Section */}
          <div className="space-y-2 bg-amber-50 border-l-4 border-amber-500 p-2 sm:p-3 rounded">
            <p className="font-semibold text-xs sm:text-sm text-amber-900">💡 Tips for Best Results:</p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside pl-3">
              <li>Use \\bigskip and \\medskip for spacing between sections</li>
              <li>Use \\textbf{} for bold text and \\text{} for regular text in math mode</li>
              <li>Use cases for piecewise functions</li>
              <li>Always wrap math content in either \$$ \$$ or \\[ \\]</li>
              <li>Test your formatting before publishing to ensure it renders correctly</li>
            </ul>
          </div>

          {/* Common Symbols Section */}
          <div className="space-y-2 bg-green-50 border-l-4 border-green-500 p-2 sm:p-3 rounded">
            <p className="font-semibold text-xs sm:text-sm text-green-900">📐 Common Mathematical Symbols:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-green-800">
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
