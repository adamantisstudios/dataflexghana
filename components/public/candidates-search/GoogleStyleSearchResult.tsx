/**
 * Redesigned Candidate Search Result Card (Final Optimized Version)
 * Elegant, mobile-friendly, and perfectly aligned.
 */
"use client"

import type { CandidateProfile } from "@/lib/candidate-search-utils"
import { maskPhoneNumber, maskEmail } from "@/lib/whatsapp-integration"
import { shortenJobTitle } from "@/lib/job-title-formatter"
import { Button } from "@/components/ui/button"
import { MessageSquare, MapPin, Briefcase, GraduationCap } from "lucide-react"
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
      className="relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 mb-4 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ✅ ATS Score Badge */}
      <div
        className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold ${scoreBackground} ${scoreColor} shadow-sm text-sm`}
        title="ATS Score: Relevance match to your search query"
      >
        <span className="font-bold">{atsScore}</span>
        <span className="text-xs text-gray-600">/10</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
        <Link
          href={`/candidates-searchengine/${candidate.id}`}
          className="text-lg md:text-xl font-semibold text-blue-700 hover:text-blue-800 transition-colors hover:underline"
        >
          {fullName}
        </Link>
      </div>

      {/* Job Title */}
      <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-sm text-blue-800 font-medium w-fit">
        <Briefcase className="h-4 w-4 text-blue-500" />
        {jobTitle}
      </div>

      {/* Location & Education */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{candidate.exact_location}, {candidate.country}</span>
        </div>
        {candidate.highest_education && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            <span>{candidate.highest_education}</span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-600 space-y-1">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-medium">Email:</span>
          <span className="font-mono text-gray-800">{maskEmail(candidate.email)}</span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-medium">Phone:</span>
          <span className="font-mono text-gray-800">{maskPhoneNumber(candidate.contact_lines)}</span>
        </div>
      </div>

      {/* Relocation */}
      {candidate.willingness_to_relocate && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-700">
          <Briefcase className="h-3.5 w-3.5 text-gray-400" />
          <span>
            Willing to Relocate:{" "}
            <span className="font-medium text-gray-800">
              {candidate.willingness_to_relocate}
            </span>
          </span>
        </div>
      )}

      {/* Action Buttons — Perfectly Balanced for Mobile + Desktop */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full">
        <Button
          size="sm"
          asChild
          className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm h-11 sm:h-10 font-medium rounded-xl shadow-sm transition-all"
        >
          <Link href={`/candidates-searchengine/${candidate.id}`}>View Profile</Link>
        </Button>

        <Button
          size="sm"
          onClick={() => onRequestCV(candidate)}
          className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white text-sm h-11 sm:h-10 font-medium rounded-xl shadow-sm transition-all"
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Request CV
        </Button>
      </div>
    </div>
  )
}
