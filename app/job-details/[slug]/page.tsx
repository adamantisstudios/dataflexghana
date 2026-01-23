"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, MapPin, Clock, Briefcase, AlertCircle, X } from 'lucide-react'
import { supabaseJobs } from "@/lib/supabase-client-jobs"
import { Footer } from "@/components/footer"

interface Job {
  id: string
  job_title: string
  employer_name: string
  employer_logo_url: string
  location: string
  salary_type: "negotiable" | "fixed_range" | "exact_amount" | null
  salary_min: number | null
  salary_max: number | null
  salary_exact: number | null
  salary_custom: string | null
  salary_currency: string
  description: string
  requirements: string
  application_deadline: string
  contact_email: string
  contact_phone: string
  application_method: string | null
  application_url: string | null
  created_at: string
  is_featured: boolean
  industry: string
}

const formatSalary = (
  salaryType: string | null,
  salaryMin: number | null,
  salaryMax: number | null,
  salaryExact: number | null,
  salaryCustom: string | null,
  currency: string,
): string => {
  if (!salaryType) {
    return "Not specified"
  }

  switch (salaryType) {
    case "negotiable":
      return "Negotiable"
    case "fixed_range":
      if (salaryMin !== null && salaryMax !== null) {
        return `${currency}${salaryMin.toLocaleString()} - ${currency}${salaryMax.toLocaleString()}`
      }
      return "Not specified"
    case "exact_amount":
      if (salaryExact !== null) {
        return `${currency}${salaryExact.toLocaleString()}`
      }
      return "Not specified"
    default:
      if (salaryCustom) {
        return salaryCustom
      }
      return "Not specified"
  }
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCVNotification, setShowCVNotification] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const agentData = localStorage.getItem("agent")
        if (!agentData) {
          router.push("/agent/login")
          return
        }
        setIsAuthenticating(false)
      } catch (error) {
        console.error("[v0] Auth error:", error)
        router.push("/agent/login")
      }
    }

    checkAuthentication()
  }, [router])

  useEffect(() => {
    if (isAuthenticating) return

    const fetchJob = async () => {
      try {
        console.log("[v0] Fetching job with slug:", slug)
        const { data, error: fetchError } = await supabaseJobs.from("jobs").select("*")

        if (fetchError) {
          console.log("[v0] Fetch error:", fetchError)
          setError("Job not found")
        } else if (data && data.length > 0) {
          const foundJob = data.find((j: Job) => {
            const jobSlug = generateSlug(j.job_title)
            const jobIdStr = j.id.toString()

            return (
              jobSlug === slug || jobIdStr === slug || jobSlug.includes(slug) || slug.includes(jobSlug.split("-")[0])
            )
          })

          if (foundJob) {
            console.log("[v0] Job found:", foundJob.job_title)
            setJob(foundJob)
            setError(null)
          } else {
            console.log("[v0] No job matched slug:", slug)
            setError("Job not found")
          }
        } else {
          console.log("[v0] No jobs in database")
          setError("Job not found")
        }
      } catch (err) {
        console.error("[v0] Error fetching job:", err)
        setError("Failed to load job details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()

    const subscription = supabaseJobs
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        (payload) => {
          console.log("[v0] Job updated in real-time:", payload)
          fetchJob()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [slug, isAuthenticating])

  useEffect(() => {
    if (!isLoading && job) {
      const timer = setTimeout(() => {
        setShowCVNotification(true)
      }, 20000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, job])

  const formatDateAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()

    date.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)

    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return `${Math.floor(diffDays / 7)} weeks ago`
  }

  const formatTextWithMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
  }

  const whatsappNumber = "+233242799990"
  const whatsappMessage = `I want my cv tailored to fit ${job?.job_title || "this job"}, I want you to assist me`
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Authenticating...</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <Link href="/agent/dashboard">
              <Button variant="outline" className="bg-transparent text-sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 md:px-6 py-12 text-center flex-1">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">The job you're looking for is no longer available.</p>
          <Link href="/jobboard">
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm">Return to Job Board</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <Link href="/agent/dashboard">
            <Button variant="outline" className="bg-transparent text-sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Job Details */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                {/* Header with Logo */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4 pb-4 border-b">
                  <div className="flex-shrink-0">
                    <Image
                      src={job.employer_logo_url || "/placeholder.svg"}
                      alt={job.employer_name}
                      width={80}
                      height={80}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover bg-gray-100"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{job.job_title}</h1>
                      <p className="text-base text-gray-600 mb-2">{job.employer_name}</p>
                      {job.is_featured && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs md:text-sm mb-2 w-fit">⭐ Featured</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Location</p>
                      <p className="text-sm md:text-base font-medium text-gray-800">{job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Salary</p>
                      <p className="text-sm md:text-base font-medium text-gray-800">
                        {formatSalary(
                          job.salary_type,
                          job.salary_min,
                          job.salary_max,
                          job.salary_exact,
                          job.salary_custom,
                          job.salary_currency,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Industry</p>
                      <p className="text-sm md:text-base font-medium text-gray-800">
                        {job.industry || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Posted</p>
                      <p className="text-sm md:text-base font-medium text-gray-800">{formatDateAgo(job.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">Job Description</h2>
                  <div
                    className="text-sm md:text-base text-gray-700 leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatTextWithMarkdown(job.description) }}
                  />
                </div>

                {job.requirements && (
                  <div className="mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">Requirements</h2>
                    <div
                      className="text-sm md:text-base text-gray-700 leading-relaxed prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatTextWithMarkdown(job.requirements) }}
                    />
                  </div>
                )}

                {(job.application_method || job.application_url || job.contact_email || job.contact_phone) && (
                  <div className="space-y-4">
                    {(job.application_method || job.application_url) && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 md:p-6">
                        <h3 className="text-sm md:text-base font-bold text-blue-900 mb-4 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          How to Apply
                        </h3>
                        <div className="space-y-3">
                          {job.application_method === "hyperlink" && job.application_url ? (
                            <div>
                              <a
                                href={job.application_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all hover:shadow-lg hover:scale-105 break-words"
                              >
                                🔗 Apply on Their Website
                                <span className="text-lg">→</span>
                              </a>
                              <p className="text-xs md:text-sm text-blue-700 mt-2 font-mono break-all opacity-75">
                                {job.application_url}
                              </p>
                            </div>
                          ) : job.application_method === "email" && job.contact_email ? (
                            <div>
                              <a
                                href={`mailto:${job.contact_email}?subject=Application for ${job.job_title}`}
                                className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all hover:shadow-lg hover:scale-105"
                              >
                                ✉️ Send Application via Email
                                <span className="text-lg">→</span>
                              </a>
                              <p className="text-xs md:text-sm text-blue-700 mt-2 font-mono font-bold">
                                {job.contact_email}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm md:text-base font-semibold text-blue-900 bg-white rounded p-3">
                              {job.application_method || "Contact employer for application details"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {(job.contact_email || job.contact_phone) && (
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-4 md:p-6">
                        <h3 className="text-sm md:text-base font-bold text-emerald-900 mb-4 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full"></span>
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          {job.contact_email && (
                            <div className="bg-white rounded-lg p-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Email</p>
                                <a
                                  href={`mailto:${job.contact_email}`}
                                  className="text-sm md:text-base font-bold text-emerald-700 hover:text-emerald-900 transition-colors break-all"
                                >
                                  {job.contact_email}
                                </a>
                              </div>
                              <span className="text-lg">📧</span>
                            </div>
                          )}
                          {job.contact_phone && (
                            <div className="bg-white rounded-lg p-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Phone</p>
                                <a
                                  href={`tel:${job.contact_phone}`}
                                  className="text-sm md:text-base font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                                >
                                  {job.contact_phone}
                                </a>
                              </div>
                              <span className="text-lg">📱</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {job.application_deadline && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 mb-6">
                    <p className="text-xs md:text-sm text-amber-900">
                      <span className="font-medium">Application Deadline:</span>{" "}
                      {new Date(job.application_deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - WhatsApp Channel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="sticky top-20 overflow-hidden">
              <CardContent className="p-4 md:p-6 space-y-5">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Join Our WhatsApp Channel</h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-3">
                    Stay updated with the latest job opportunities and career tips by joining our WhatsApp channel.
                  </p>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <Link
                    href="https://whatsapp.com/channel/0029VaBsn6KDZ4LgVUn0yg2T"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 md:py-3 text-sm md:text-base">
                      Join WhatsApp Channel
                    </Button>
                  </Link>
                  <Link href="/jobboard" className="block">
                    <Button variant="outline" className="w-full bg-transparent py-2 md:py-3 text-sm md:text-base">
                      Back to Search
                    </Button>
                  </Link>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs md:text-sm text-gray-700 mb-2">
                    Register to get contacted privately by companies interested in your profile
                  </p>
                  <Link href="/">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm py-2"
                      size="sm"
                    >
                      Register Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showCVNotification && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCVNotification(false)} aria-hidden="true" />

          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 p-4 md:p-6 max-w-2xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Increase Your Interview Chances</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Always apply with a tailored CV to stand out to employers. Let our experts tailor your CV to match
                  this position.
                </p>
              </div>
              <button
                onClick={() => setShowCVNotification(false)}
                className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
                aria-label="Close notification"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 md:py-3">
                  Need help tailoring your CV?
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowCVNotification(false)}
                className="flex-1 bg-transparent py-2 md:py-3"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
