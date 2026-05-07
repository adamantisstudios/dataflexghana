"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  Calendar,
  Mail,
  Phone,
  Globe,
  FileText,
  CheckCircle,
  Zap,
  TrendingUp,
} from "lucide-react" // ✅ removed DollarSign
import { supabaseJobs } from "@/lib/supabase-client-jobs"
import { Footer } from "@/components/footer"

// ========== TYPE DEFINITIONS ==========
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

// ========== HELPER FUNCTIONS ==========
const safeString = (value: string | null | undefined): string => value || ""

const formatSalary = (
  salaryType: string | null,
  salaryMin: number | null,
  salaryMax: number | null,
  salaryExact: number | null,
  salaryCustom: string | null,
  currency: string,
): string => {
  if (!salaryType) return "Not specified"
  switch (salaryType) {
    case "negotiable":
      return "Negotiable"
    case "fixed_range":
      if (salaryMin !== null && salaryMax !== null)
        return `${currency}${salaryMin.toLocaleString()} - ${currency}${salaryMax.toLocaleString()}`
      return "Not specified"
    case "exact_amount":
      if (salaryExact !== null) return `${currency}${salaryExact.toLocaleString()}`
      return "Not specified"
    default:
      return salaryCustom || "Not specified"
  }
}

const formatDateAgo = (dateString: string): string => {
  if (!dateString) return "Recently"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Recently"
  const now = new Date()
  date.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return `${Math.floor(diffDays / 7)} weeks ago`
}

const formatTextWithMarkdown = (text: string): string => {
  if (!text) return ""
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
}

// ========== MAIN COMPONENT ==========
export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = (params as any)?.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCVNotification, setShowCVNotification] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [jobUrl, setJobUrl] = useState("")

  // Authentication
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const agentData = localStorage.getItem("agent")
        if (!agentData) {
          router.push("/agent/login")
          return
        }
        setIsAuthenticating(false)
      } catch (err) {
        console.error("[Auth error]", err)
        router.push("/agent/login")
      }
    }
    checkAuthentication()
  }, [router])

  // Fetch job by ID
  useEffect(() => {
    if (isAuthenticating || !jobId) return

    const fetchJob = async () => {
      setIsLoading(true)
      try {
        const { data, error: fetchError } = await supabaseJobs
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single()

        if (fetchError || !data) {
          setError("Job not found")
        } else {
          setJob(data)
          setError(null)
        }
      } catch (err) {
        console.error("[Fetch error]", err)
        setError("Failed to load job details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()

    const channel = supabaseJobs
      .getClient()
      .channel("public:jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        () => fetchJob()
      )
      .subscribe()

    return () => {
      supabaseJobs.getClient().removeChannel(channel)
    }
  }, [jobId, isAuthenticating])

  // Build job URL when job loads
  useEffect(() => {
    if (!job) return
    if (typeof window !== "undefined") {
      const origin = window.location.origin
      setJobUrl(`${origin}/job-details/${job.id}`)
    }
  }, [job])

  // CV notification timer
  useEffect(() => {
    if (!isLoading && job) {
      const timer = setTimeout(() => setShowCVNotification(true), 20000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, job])

  // Deadline urgency
  const getDeadlineUrgency = (deadline: string) => {
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    if (daysLeft < 0) return { color: "red", text: "Expired", bg: "bg-red-50 border-red-200" }
    if (daysLeft <= 3)
      return { color: "orange", text: `Urgent: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`, bg: "bg-orange-50 border-orange-200" }
    return { color: "green", text: `${daysLeft} days remaining`, bg: "bg-green-50 border-green-200" }
  }

  // ========== WHATSAPP MESSAGE ==========
  const whatsappNumber = "+233551999901"
  
  const urgency = job?.application_deadline 
    ? getDeadlineUrgency(job.application_deadline) 
    : { text: "No deadline specified" }
  
  const jobTitle = job?.job_title || "this job"
  const companyName = job?.employer_name ? ` at ${job.employer_name}` : ""
  const finalJobUrl = jobUrl || ""

  const whatsappMessage = 
`*📄 CV TAILORING REQUEST*: ${jobTitle}${companyName}

⏰ *Deadline urgency*: ${urgency.text}

I need my CV professionally tailored to match this specific role. Please help me with:

1️⃣ *Keyword optimisation* – Extract all key skills/terms from the job description and ensure they appear naturally in my CV (ATS-friendly).

2️⃣ *Rewrite my experience bullets* – Transform my generic achievements into role-specific impact statements that mirror the job's responsibilities.

3️⃣ *Re-order sections* – Move the most relevant skills and experiences to the top (e.g., if they prioritise Python, put that before other tools).

4️⃣ *Delete irrelevant content* – Remove anything that doesn't serve this application (old hobbies, unrelated jobs).

5️⃣ *Add a targeted summary* – Write a 2‑line professional summary that directly addresses what ${job?.employer_name || "the employer"} is looking for.

📎 Job link: ${finalJobUrl}

I will send my current CV separately (PDF or Word). Please return a tailored version with changes highlighted.

🙏 Thank you – I need this urgently to meet the deadline.`

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  // Loading & auth states
  if (isAuthenticating || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{isAuthenticating ? "Authenticating..." : "Loading job details..."}</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <Link href="/jobboard">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Job Board
              </Button>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 text-center flex-1">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">The job you are looking for is no longer available.</p>
          <Link href="/jobboard">
            <Button className="bg-blue-600 hover:bg-blue-700">Return to Job Board</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // ========== RENDER JOB DETAILS ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <Link href="/jobboard">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-blue-600">
              <ChevronLeft className="h-4 w-4" />
              Back to Job Board
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT COLUMN – Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/40">
              <CardContent className="p-0">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-20" />
                        <Image
                          src={safeString(job.employer_logo_url) || "/placeholder.svg"}
                          alt={safeString(job.employer_name)}
                          width={96}
                          height={96}
                          className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-white shadow-md border border-gray-100"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{safeString(job.job_title)}</h1>
                        {job.is_featured && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 text-xs">⭐ Featured</Badge>
                        )}
                      </div>
                      <p className="text-lg text-gray-700 mb-3">{safeString(job.employer_name)}</p>

                      {/* Info chips – salary icon removed */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-full px-3 py-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          <span>{safeString(job.location)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-full px-3 py-1.5">
                          {/* ✅ No icon, only formatted salary from database */}
                          <span className="font-medium">
                            {formatSalary(
                              job.salary_type,
                              job.salary_min,
                              job.salary_max,
                              job.salary_exact,
                              job.salary_custom,
                              job.salary_currency
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-full px-3 py-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <span>Posted {formatDateAgo(job.created_at)}</span>
                        </div>
                        {job.industry && (
                          <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-full px-3 py-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                            <span>{safeString(job.industry)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="border border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
                </div>
                <div
                  className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:marker:text-blue-400 leading-relaxed text-gray-700"
                  dangerouslySetInnerHTML={{ __html: formatTextWithMarkdown(safeString(job.description)) }}
                />
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card className="border border-gray-100 shadow-sm overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-900">Requirements & Qualifications</h2>
                  </div>
                  <div
                    className="prose prose-slate max-w-none prose-headings:font-semibold prose-li:marker:text-emerald-500 leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: formatTextWithMarkdown(safeString(job.requirements)) }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Deadline Alert */}
            {job.application_deadline && (
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${getDeadlineUrgency(job.application_deadline).bg}`}>
                <AlertCircle
                  className={`h-5 w-5 flex-shrink-0 ${
                    getDeadlineUrgency(job.application_deadline).color === "red"
                      ? "text-red-500"
                      : getDeadlineUrgency(job.application_deadline).color === "orange"
                      ? "text-orange-500"
                      : "text-green-500"
                  }`}
                />
                <div>
                  <p className="font-semibold text-gray-800">Application Deadline</p>
                  <p className="text-sm">
                    {new Date(job.application_deadline).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <span className="ml-2 font-medium">({getDeadlineUrgency(job.application_deadline).text})</span>
                  </p>
                </div>
              </div>
            )}

            {/* How to Apply */}
            {(job.application_method || job.application_url || job.contact_email || job.contact_phone) && (
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5" />
                    <h3 className="text-lg font-bold">How to Apply</h3>
                  </div>
                  <div className="space-y-4">
                    {job.application_method === "hyperlink" && job.application_url ? (
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:shadow-xl transition-all hover:scale-105"
                      >
                        <Globe className="h-5 w-5" />
                        Apply on Company Website
                        <span className="text-lg">→</span>
                      </a>
                    ) : job.application_method === "email" && job.contact_email ? (
                      <a
                        href={`mailto:${job.contact_email}?subject=Application for ${job.job_title}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:shadow-xl transition-all"
                      >
                        <Mail className="h-5 w-5" />
                        Send Email Application
                      </a>
                    ) : (
                      <p className="text-white/90 text-sm md:text-base">
                        {job.application_method || "Contact employer directly using the information below"}
                      </p>
                    )}

                    {(job.contact_email || job.contact_phone) && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                        {job.contact_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-white/70" />
                            <a href={`mailto:${job.contact_email}`} className="hover:underline font-mono break-all">
                              {job.contact_email}
                            </a>
                          </div>
                        )}
                        {job.contact_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-white/70" />
                            <a href={`tel:${job.contact_phone}`} className="hover:underline">
                              {job.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT SIDEBAR – CTA cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* WhatsApp Channel */}
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.15-.173.2-.298.3-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.61-.916-2.206-.242-.58-.487-.5-.67-.51-.173-.01-.371-.01-.57-.01-.2 0-.523.074-.797.371-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.075 4.487.708.306 1.261.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.569-.347z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Join Our WhatsApp Channel</h3>
                  <p className="text-green-50 text-sm">Get instant job alerts and career tips daily</p>
                  <Link href="https://whatsapp.com/channel/0029VaBsn6KDZ4LgVUn0yg2T" target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-white text-green-700 hover:bg-gray-100 font-bold py-2">Join Now →</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Register Prompt */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <CardContent className="p-5 text-center space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong className="text-blue-800">Get discovered by employers</strong> – register your profile so companies can contact you directly.
                  </p>
                  <Link href="/">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Register for Free</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Back to Search */}
              <Link href="/jobboard" className="block">
                <Button variant="outline" className="w-full border-gray-200 text-gray-600 hover:bg-gray-50">
                  ← Back to All Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CV Notification Modal */}
      {showCVNotification && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCVNotification(false)} aria-hidden="true" />
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 p-4 md:p-6 max-w-2xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Increase Your Interview Chances</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Always apply with a tailored CV to stand out to employers. Let our experts tailor your CV to match this position.
                </p>
              </div>
              <button onClick={() => setShowCVNotification(false)} className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 md:py-3">Need help tailoring your CV?</Button>
              </Link>
              <Button variant="outline" onClick={() => setShowCVNotification(false)} className="flex-1 bg-transparent py-2 md:py-3">
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}