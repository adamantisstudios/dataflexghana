export function calculateATSScore(rawScore: number): number {
  // Convert normalized 0-100 score to 1-10 scale
  // 0-10 normalized = 1 ATS score
  // 90-100 normalized = 10 ATS score
  const atsScore = Math.max(1, Math.min(10, Math.round((rawScore / 100) * 10)))
  return atsScore
}

export function getATSScoreColor(score: number): string {
  if (score >= 9) return "text-green-600" // Excellent match
  if (score >= 7) return "text-blue-600" // Very good match
  if (score >= 5) return "text-amber-600" // Good match
  if (score >= 3) return "text-orange-600" // Fair match
  return "text-gray-500" // Low match
}

export function getATSScoreBackground(score: number): string {
  if (score >= 9) return "bg-green-50 border-green-200"
  if (score >= 7) return "bg-blue-50 border-blue-200"
  if (score >= 5) return "bg-amber-50 border-amber-200"
  if (score >= 3) return "bg-orange-50 border-orange-200"
  return "bg-gray-50 border-gray-200"
}
