/**
 * Google-Style Search Result Card
 * Displays search results in a minimal, clean Google-like format
 */
"use client"

import type { CandidateProfile } from "@/lib/candidate-search-utils"
import { maskPhoneNumber, maskEmail } from "@/lib/whatsapp-integration"
import { shortenJobTitle } from "@/lib/job-title-formatter"
import { Button } from "@/components/ui/button"
import { MessageSquare, MapPin, Briefcase, GraduationCap, Info } from "lucide-react"
import Link from "next/link"
import { calculateATSScore, getATSScoreColor, getATSScoreBackground } from "@/lib/ats-scoring"

interface GoogleStyleSearchResultProps {
  candidate: CandidateProfile
  onRequestCV: (candidate: CandidateProfile) => void
  index: number
  rawScore?: number
}

export default function GoogleStyleSearchResult({
  candidate,
  onRequestCV,
  index,
  rawScore = 50,
}: GoogleStyleSearchResultProps) {
  const formatCandidateName = (name: string): string => {
    if (!name) return "Professional"
    return name.trim()
  }

  const fullName = formatCandidateName(candidate.full_name || "")
  const jobTitle = shortenJobTitle(candidate.job_looking_for)
  const atsScore = calculateATSScore(rawScore)
  const scoreColor = getATSScoreColor(atsScore)
  const scoreBackground = getATSScoreBackground(atsScore)

  return (
    <div
      className="border-b border-gray-100 pb-5 last:border-b-0 hover:bg-blue-50/40 -mx-6 px-6 py-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ✅ ATS Score for Mobile (Top-Right Corner) */}
      <div
        className={`md:hidden absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold ${scoreBackground} group relative cursor-help shadow-sm text-nowrap`}
        title="ATS Score: Relevance match to your search query"
      >
        <span className={`text-sm font-bold ${scoreColor}`}>{atsScore}</span>
        <span className="text-xs text-gray-600">/10</span>
      </div>

      <div className="mb-3 flex flex-col md:flex-row md:items-start md:justify-between md:gap-4 pt-12 md:pt-0">
        <div className="flex-1 pr-2">
          <Link
            href={`/candidates-searchengine/${candidate.id}`}
            className="text-base text-blue-600 hover:text-blue-700 font-semibold break-words hover:underline transition-colors"
          >
            {fullName}
          </Link>
        </div>

        {/* ✅ ATS Score for Desktop (Original Position) */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold ${scoreBackground} group relative cursor-help`}
          title="ATS Score: Relevance match to your search query"
        >
          <span className={`text-sm font-bold ${scoreColor}`}>{atsScore}</span>
          <span className="text-xs text-gray-600">/10</span>
          <Info className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Job Title Badge */}
      <div className="text-sm text-gray-700 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-transparent p-2 rounded-md w-fit border border-blue-100">
        <Briefcase className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span className="font-medium text-gray-800">{jobTitle}</span>
      </div>

      {/* Location & Education */}
      <div className="text-sm text-gray-600 mb-3 flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5 text-gray-700">
          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">
            {candidate.exact_location}, {candidate.country}
          </span>
        </span>

        {candidate.highest_education && (
          <span className="flex items-center gap-1.5 text-gray-700">
            <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{candidate.highest_education}</span>
          </span>
        )}
      </div>

      {/* Masked Contact Info */}
      <div className="text-xs text-gray-500 mb-4 space-y-1 bg-gray-50 p-3 rounded-md border border-gray-100">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Email:</span>
          <span className="font-mono text-gray-700 text-xs">{maskEmail(candidate.email)}</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Phone:</span>
          <span className="font-mono text-gray-700 text-xs">{maskPhoneNumber(candidate.contact_lines)}</span>
        </div>
      </div>

      {/* Relocation Info */}
      {candidate.willingness_to_relocate && (
        <div className="text-xs text-gray-600 mb-4 flex items-center gap-2">
          <Briefcase className="h-3.5 w-3.5 text-gray-400" />
          <span>
            Willing to Relocate: <span className="font-medium text-gray-700">{candidate.willingness_to_relocate}</span>
          </span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col md:flex-row gap-2 pt-2">
        <Button
          size="sm"
          asChild
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-medium transition-colors"
        >
          <Link href={`/candidates-searchengine/${candidate.id}`}>View Profile</Link>
        </Button>
        <Button
          size="sm"
          onClick={() => onRequestCV(candidate)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 font-medium transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          Request CV
        </Button>
      </div>
    </div>
  )
}
