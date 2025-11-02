"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, MessageSquare, MapPin, GraduationCap, Briefcase, X } from "lucide-react"
import Link from "next/link"
import { type CandidateProfile, fetchCandidateById } from "@/lib/candidate-search-utils"
import { maskEmail, maskPhone, sanitizeDisplay } from "@/lib/privacy-masking"
import { shortenJobTitle } from "@/lib/job-title-formatter"

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

  const handleRequestCV = () => {
    if (!candidate) return

    if (!isMobile) {
      setShowCVModal(true)
      return
    }

    setShowCVModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Candidate Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Card className="mb-4 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-md">
          <CardHeader className="pb-4 border-b border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl text-blue-700 font-bold mb-3">{candidate?.full_name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    {sanitizeDisplay(candidate?.country || "")}
                  </Badge>
                  {candidate?.willingness_to_relocate && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Open to Relocate: {candidate.willingness_to_relocate}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleRequestCV()}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg whitespace-nowrap shadow-lg hover:shadow-xl transition-all text-lg w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-6 w-6" />
                Request CV
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            <div className="flex gap-3 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <Briefcase className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Position Seeking</p>
                <p className="text-foreground font-bold text-xl text-blue-700">
                  {shortenJobTitle(candidate?.job_looking_for || "")}
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Education</p>
                <p className="text-foreground text-lg font-medium">
                  {sanitizeDisplay(candidate?.highest_education || "")}
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Location</p>
                <p className="text-foreground text-lg font-medium">
                  {sanitizeDisplay(candidate?.exact_location || "")}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Contact Information</p>
              <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-mono text-sm">{maskEmail(candidate?.email || "")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Phone</p>
                  <p className="text-foreground font-mono text-sm">{maskPhone(candidate?.contact_lines || "")}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Full contact details available upon CV request via WhatsApp.
              </p>
            </div>

            {candidate?.career_aspirations && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Career Aspirations</p>
                <p className="text-foreground text-sm bg-amber-50 p-4 rounded border-l-4 border-amber-400">
                  {sanitizeDisplay(candidate.career_aspirations)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-bold text-foreground mb-2">Ready to Connect?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Request the candidate's CV via WhatsApp for full contact details.
            </p>
            <Button
              onClick={() => handleRequestCV()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-12 py-5 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg w-full flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-6 w-6" />
              Request CV via WhatsApp
            </Button>
          </CardContent>
        </Card>
      </main>

      {showCVModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="w-full md:max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 md:px-6 py-3 flex items-center justify-between sticky top-0">
              <h2 className="text-lg md:text-xl font-bold">Request CV</h2>
              <button
                onClick={() => setShowCVModal(false)}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:gap-0">
              {/* CV Image - Full left side on desktop, full width on mobile */}
              <div className="w-full md:w-1/2 md:max-h-96 overflow-hidden flex items-center justify-center bg-gray-100">
                <img
                  src="/images/professional-writing.preview.png"
                  alt="Professional CV Sample"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content - Right on desktop, below image on mobile */}
              <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col justify-between gap-4 md:max-h-96 overflow-y-auto">
                {/* Candidate Info */}
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Requesting CV for:</p>
                  <p className="text-base md:text-lg font-bold text-blue-700 break-words">{candidate?.full_name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    <span className="font-semibold">Position:</span> {shortenJobTitle(candidate?.job_looking_for || "")}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    <span className="font-semibold">Location:</span> {candidate?.exact_location}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <p className="text-base md:text-lg font-semibold text-foreground">Get Full Contact Details</p>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Contact our support team via WhatsApp to receive this candidate's complete CV and contact
                    information.
                  </p>
                </div>

                {/* CTA Button - Full width, prominent */}
                <Button
                  onClick={() => {
                    const uniqueId = `${candidate?.id || candidateId}-${Date.now()}`
                    const message = `Hi, I'd like to request the CV for candidate ID: ${uniqueId} (${candidate?.full_name}, ${candidate?.exact_location})`
                    const whatsappUrl = `https://wa.me/233546460945?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, "_blank")
                    setShowCVModal(false)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg shadow-lg hover:shadow-xl transition-all text-base md:text-lg w-full flex items-center justify-center gap-2 h-12 md:h-14"
                >
                  <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
                  Request via WhatsApp
                </Button>

                {/* Cancel Button */}
                <Button
                  onClick={() => setShowCVModal(false)}
                  variant="outline"
                  className="py-2 md:py-3 px-4 md:px-6 rounded-lg text-sm md:text-base font-semibold w-full"
                >
                  Cancel
                </Button>

                {/* Footer info */}
                <p className="text-xs text-muted-foreground text-center italic">
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
