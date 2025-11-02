/**
 * Google-Style Search Result Card
 * Displays search results in a minimal, clean Google-like format
 */

"use client"

import type { CandidateProfile } from "@/lib/candidate-search-utils"
import { maskPhoneNumber, maskEmail } from "@/lib/whatsapp-integration"
import { shortenJobTitle } from "@/lib/job-title-formatter"
import { Button } from "@/components/ui/button"
import { MessageSquare, MapPin, Briefcase, GraduationCap } from "lucide-react"
import Link from "next/link"

interface GoogleStyleSearchResultProps {
  candidate: CandidateProfile
  onRequestCV: (candidate: CandidateProfile) => void
  index: number
}

export default function GoogleStyleSearchResult({ candidate, onRequestCV, index }: GoogleStyleSearchResultProps) {
  const fullName = candidate.full_name || "Professional"
  const jobTitle = shortenJobTitle(candidate.job_looking_for)

  return (
    <div
      className="border-b border-gray-200 pb-6 last:border-b-0 hover:bg-gray-50 -mx-4 px-4 py-3 rounded transition-colors duration-150 animate-in fade-in slide-in-from-bottom-2"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="mb-3">
        <div className="mb-2">
          <Link
            href={`/candidates-searchengine/${candidate.id}`}
            className="text-lg text-blue-600 hover:underline font-bold break-words"
          >
            {fullName}
          </Link>
        </div>

        <div className="text-sm text-gray-600 flex items-center gap-2 bg-blue-50 p-1.5 rounded w-fit">
          <Briefcase className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-gray-700 font-semibold">{jobTitle}</span>
        </div>
      </div>

      {/* Result Metadata - Location, Education */}
      <div className="text-sm text-gray-600 mb-2 flex flex-wrap gap-3 mt-3">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {candidate.exact_location}, {candidate.country}
        </span>
        {candidate.highest_education && (
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
            {candidate.highest_education}
          </span>
        )}
      </div>

      {/* Result Snippet - Masked Contact Info */}
      <div className="text-sm text-gray-700 mb-3 space-y-1">
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-500">Email:</span>
          <span className="font-mono text-gray-700">{maskEmail(candidate.email)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-500">Phone:</span>
          <span className="font-mono text-gray-700">{maskPhoneNumber(candidate.contact_lines)}</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 mb-3 space-y-1">
        <div className="flex items-center gap-2">
          <Briefcase className="h-3 w-3" />
          <span>Willing to Relocate: {candidate.willingness_to_relocate || "N/A"}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
          <Link href={`/candidates-searchengine/${candidate.id}`}>View Profile</Link>
        </Button>
        <Button
          size="sm"
          onClick={() => onRequestCV(candidate)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Request CV
        </Button>
      </div>
    </div>
  )
}
