"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  MessageSquare,
  MapPin,
  GraduationCap,
  Briefcase,
  X,
  Code,
  Award,
  BookOpen,
  Users,
  Heart,
  FileText,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { type CandidateProfile, fetchCandidateById } from "@/lib/candidate-search-utils"
import { maskEmail, maskPhone, sanitizeDisplay } from "@/lib/privacy-masking"
import { shortenJobTitle } from "@/lib/job-title-formatter"
import { PremiumInfoSection } from "./PremiumInfoSection"

function CandidateDetailPage({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCVModal, setShowCVModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMobile(typeof window !== "undefined" && window.innerWidth < 768)
    const handleResize = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        const data = await fetchCandidateById(candidateId)
        setCandidate(data)
      } catch (error) {
        console.error("Error loading candidate:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCandidate()
  }, [candidateId])

  useEffect(() => {
    // Clear the search tips shown flag so tips appear fresh when user returns
    // But only clear on initial mount for this specific candidate
    localStorage.removeItem("searchTipsShown")
  }, [])

  const handleRequestCV = () => {
    if (!candidate) return
    setShowCVModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-3">Candidate Not Found</h2>
            <p className="text-muted-foreground mb-6 text-sm">This candidate profile is no longer available.</p>
            <Button asChild className="w-full">
              <Link href="/candidates-searchengine">Back to Search</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-base font-semibold text-gray-900">Candidate Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-blue-100 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-blue-900 font-bold mb-3">{candidate?.full_name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs font-medium">
                      {sanitizeDisplay(candidate?.country || "")}
                    </Badge>
                    {candidate?.willingness_to_relocate && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs font-medium"
                      >
                        Open to Relocate: {candidate.willingness_to_relocate}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleRequestCV()}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg whitespace-nowrap shadow-lg hover:shadow-xl transition-all text-sm w-full sm:w-auto flex items-center justify-center gap-2 h-10"
                >
                  <MessageSquare className="h-4 w-4" />
                  Request CV
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              <div className="p-4 rounded-lg border border-blue-100 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Position Seeking
                    </p>
                    <p className="text-base font-semibold text-gray-900 break-words">
                      {shortenJobTitle(candidate?.job_looking_for || "Not specified")}
                    </p>
                  </div>
                </div>
              </div>

              {candidate?.career_aspirations && (
                <div className="p-4 rounded-lg border border-blue-100 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Career Aspirations
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed break-words">
                        {sanitizeDisplay(candidate.career_aspirations)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              <div className="flex gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <GraduationCap className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Education</p>
                  <p className="text-foreground text-sm font-medium text-gray-900 mt-1">
                    {sanitizeDisplay(candidate?.highest_education || "")}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Location</p>
                  <p className="text-foreground text-sm font-medium text-gray-900 mt-1">
                    {sanitizeDisplay(candidate?.exact_location || "")}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wide">Contact Information</p>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900 font-mono text-xs">{maskEmail(candidate?.email || "")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Phone</p>
                    <p className="text-gray-900 font-mono text-xs">{maskPhone(candidate?.contact_lines || "")}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 italic">
                  Full contact details available upon CV request via WhatsApp.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Professional Details</h2>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs font-medium">Request to Unlock</Badge>
            </div>

            {/* Work History */}
            <PremiumInfoSection
              icon={<Briefcase className="h-5 w-5" />}
              title="Work History"
              content={candidate?.work_history}
              placeholder="Complete employment history with companies, roles, responsibilities, and achievements"
              isLocked={!candidate?.work_history}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Skills */}
            <PremiumInfoSection
              icon={<Code className="h-5 w-5" />}
              title="Technical & Professional Skills"
              content={candidate?.skills}
              placeholder="Comprehensive list of technical skills, programming languages, tools, and professional competencies"
              isLocked={!candidate?.skills}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Certifications */}
            <PremiumInfoSection
              icon={<Award className="h-5 w-5" />}
              title="Certifications & Credentials"
              content={candidate?.certifications}
              placeholder="Professional certifications, licenses, and industry credentials"
              isLocked={!candidate?.certifications}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Projects */}
            <PremiumInfoSection
              icon={<BookOpen className="h-5 w-5" />}
              title="Notable Projects"
              content={candidate?.projects}
              placeholder="Portfolio of completed projects, case studies, and key achievements"
              isLocked={!candidate?.projects}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Publications */}
            <PremiumInfoSection
              icon={<FileText className="h-5 w-5" />}
              title="Publications & Articles"
              content={candidate?.publications}
              placeholder="Published works, research papers, blog articles, and thought leadership"
              isLocked={!candidate?.publications}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Awards */}
            <PremiumInfoSection
              icon={<Award className="h-5 w-5" />}
              title="Awards & Recognition"
              content={candidate?.awards}
              placeholder="Industry awards, recognitions, and notable achievements"
              isLocked={!candidate?.awards}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Professional Affiliations */}
            <PremiumInfoSection
              icon={<Users className="h-5 w-5" />}
              title="Professional Affiliations"
              content={candidate?.professional_affiliations}
              placeholder="Memberships in professional organizations and industry associations"
              isLocked={!candidate?.professional_affiliations}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Interests */}
            <PremiumInfoSection
              icon={<Heart className="h-5 w-5" />}
              title="Interests & Passions"
              content={candidate?.interests}
              placeholder="Personal interests, hobbies, and areas of passion"
              isLocked={!candidate?.interests}
              onRequestAccess={() => handleRequestCV()}
            />

            {/* Professional References */}
            <PremiumInfoSection
              icon={<Users className="h-5 w-5" />}
              title="Professional References"
              content={candidate?.professional_references}
              placeholder="References from previous employers and colleagues"
              isLocked={!candidate?.professional_references}
              onRequestAccess={() => handleRequestCV()}
            />
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <CardContent className="pt-6 text-center">
              <h3 className="text-base font-bold text-gray-900 mb-2">Ready to Connect?</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Request the candidate's CV via WhatsApp to unlock all professional details and get full contact
                information.
              </p>
              <Button
                onClick={() => handleRequestCV()}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-12 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm w-full flex items-center justify-center gap-2 h-10"
              >
                <MessageSquare className="h-4 w-4" />
                Request CV via WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {showCVModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="w-full md:max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3 flex items-center justify-between sticky top-0">
              <h2 className="text-base md:text-lg font-bold">Request CV & Professional Information</h2>
              <button
                onClick={() => setShowCVModal(false)}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:gap-0">
              {/* CV Image */}
              <div className="w-full md:w-1/2 md:max-h-96 overflow-hidden flex items-center justify-center bg-gray-100">
                <img
                  src="/images/professional-writing.preview.png"
                  alt="Professional CV Sample"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col justify-between gap-4 md:max-h-96 overflow-y-auto">
                {/* Candidate Info */}
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Requesting CV for:</p>
                  <p className="text-sm md:text-base font-bold text-blue-900 break-words">{candidate?.full_name}</p>
                  <p className="text-xs md:text-xs text-gray-600 mt-2">
                    <span className="font-semibold">Position:</span> {shortenJobTitle(candidate?.job_looking_for || "")}
                  </p>
                  <p className="text-xs md:text-xs text-gray-600 mt-1">
                    <span className="font-semibold">Location:</span> {candidate?.exact_location}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <p className="text-sm md:text-base font-semibold text-gray-900">Get Full Profile Access</p>
                  <p className="text-xs md:text-xs text-gray-600 leading-relaxed">
                    Contact our support team via WhatsApp to receive this candidate's complete CV.
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => {
                    const uniqueId = `${candidate?.id || candidateId}-${Date.now()}`
                    const message = `Hi, I'd like to request the CV for candidate ID: ${uniqueId} (${candidate?.full_name}, ${candidate?.exact_location})`
                    const whatsappUrl = `https://wa.me/233546460945?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, "_blank")
                    setShowCVModal(false)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 md:py-2.5 px-4 md:px-6 rounded-lg shadow-lg hover:shadow-xl transition-all text-xs md:text-sm w-full flex items-center justify-center gap-2 h-10 md:h-11"
                >
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                  Request via WhatsApp
                </Button>

                {/* Cancel Button */}
                <Button
                  onClick={() => setShowCVModal(false)}
                  variant="outline"
                  className="py-2 md:py-2 px-4 md:px-6 rounded-lg text-xs md:text-sm font-semibold w-full border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>

                {/* Footer info */}
                <p className="text-xs text-gray-600 text-center italic">
                  Your unique Candidate ID will be included to help us track your request.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateDetailPage
