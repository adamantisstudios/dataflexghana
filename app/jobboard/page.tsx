"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, MapPin, Briefcase, Search, X, ArrowRight, MessageCircle } from 'lucide-react'
import { supabaseJobs } from "@/lib/supabase-client-jobs"
import { Footer } from "@/components/footer"

const mockAds = [
  {
    id: 1,
    title: "Get Your Tailored Resume",
    description: "Always Apply with a tailored resume for maximum exposure",
    cta: "Upgrade Your CV",
    ctaLink: "https://cvwriterpros.netlify.app/cv_writingrequest",
    image: "/edited.png",
  },
  {
    id: 3,
    title: "Interview Preparation",
    description: "Master interview skills with our comprehensive training program",
    cta: "Get Started",
    whatsappNumber: "+233546460945",
    whatsappMessage: "I need a comprehensive Interview Guide, where should I start?",
    image: "/interview-training.jpg",
  },
]

const heroImages = [
  {
    id: 1,
    url: "/professional-workplace.jpg",
    caption: "Find Your Dream Job",
    description: "Join thousands of professionals finding success",
  },
  {
    id: 2,
    url: "/team-collaboration.png",
    caption: "Build Your Career",
    description: "With verified employers and real opportunities",
  },
  {
    id: 3,
    url: "/success-celebration.png",
    caption: "Your Success is Our Mission",
    description: "Supporting your journey every step of the way",
  },
]

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
  created_at: string
  is_featured: boolean
}

const jobsCache = {
  data: null as Job[] | null,
  timestamp: 0,
  CACHE_DURATION: 0,
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const fetchJobs = async (): Promise<Job[]> => {
  const now = Date.now()

  if (jobsCache.data && now - jobsCache.timestamp < jobsCache.CACHE_DURATION) {
    console.log("[v0] Using cached jobs data")
    return jobsCache.data
  }

  try {
    console.log("[v0] Fetching jobs from Supabase")
    const { data, error } = await supabaseJobs
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching jobs:", error)
      return jobsCache.data || []
    }

    const jobs = data || []
    jobsCache.data = jobs
    jobsCache.timestamp = now
    return jobs
  } catch (error) {
    console.error("[v0] Supabase client error:", error)
    return jobsCache.data || []
  }
}

export default function JobBoard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const subscriptionRef = useRef<any>(null)

  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paginationCount, setPaginationCount] = useState(0)
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)
  const jobsPerPage = 10

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

    const initializeJobs = async () => {
      setIsLoading(true)
      const jobsData = await fetchJobs()
      setJobs(jobsData)
      setError(null)
      setIsLoading(false)

      try {
        subscriptionRef.current = supabaseJobs
          .getClient()
          .channel("public:jobs")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "jobs",
            },
            (payload: any) => {
              console.log("[v0] Real-time update received:", payload.eventType)
              fetchJobs().then((updated) => {
                setJobs(updated)
              })
            },
          )
          .subscribe()
      } catch (err) {
        console.error("[v0] Error setting up subscription:", err)
      }
    }

    initializeJobs()

    return () => {
      if (subscriptionRef.current) {
        supabaseJobs.getClient().removeChannel(subscriptionRef.current)
      }
    }
  }, [isAuthenticating])

  useEffect(() => {
    const filtered = jobs.filter(
      (job) =>
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredJobs(filtered)
    setCurrentPage(0)
  }, [searchTerm, jobs])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleNextPage = () => {
    const newCount = paginationCount + 1
    setPaginationCount(newCount)
    if (newCount === 2) {
      setShowRegisterPrompt(true)
      setTimeout(() => setShowRegisterPrompt(false), 5000)
    }
    setCurrentPage((prev) => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0))
  }

  const paginatedJobs = filteredJobs.slice(currentPage * jobsPerPage, (currentPage + 1) * jobsPerPage)

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

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage)

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Authenticating...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/logo.png"
                alt="Fast-Hired Logo"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">FAST-HIRED</h1>
                <p className="text-xs text-gray-600">Job Board</p>
              </div>
            </Link>
            <Link href="/agent/dashboard">
              <Button variant="outline" className="text-sm md:text-base bg-transparent">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden bg-black">
        <div className="relative w-full h-full">
          {heroImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image.url || "/placeholder.svg"}
                alt={image.caption}
                fill
                className="object-cover w-full h-full"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 text-balance">
                  {image.caption}
                </h2>
                <p className="text-lg md:text-xl text-gray-200">{image.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full z-10 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroImages.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full z-10 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-6" : "bg-white/50 w-2"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex-1">
        <div className="mb-8 md:mb-12">
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-1 shadow-lg border border-blue-200">
              <div className="relative bg-white rounded-xl flex items-center px-5 py-4">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-600" />
                <Input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 py-3 text-base md:text-lg border-0 focus:ring-0 bg-transparent w-full placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-3 space-y-4 md:space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Error loading jobs. Please try again later.</p>
              </div>
            ) : paginatedJobs.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Available Positions
                    <span className="text-sm md:text-base font-normal text-gray-600 ml-2">
                      ({filteredJobs.length} jobs)
                    </span>
                  </h2>
                </div>
                <div className="space-y-3 md:space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  {paginatedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
                        <div className="flex gap-3 md:gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <Image
                              src={job.employer_logo_url || "/placeholder.svg"}
                              alt={job.employer_name}
                              width={64}
                              height={64}
                              className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover bg-gray-100"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            {job.is_featured && (
                              <div className="mb-2">
                                <Badge className="bg-amber-100 text-amber-800 text-xs">⭐ Featured</Badge>
                              </div>
                            )}
                            <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1">
                              {job.job_title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{job.employer_name}</p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-700">
                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="line-clamp-1">{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1 font-semibold text-green-700">
                                <span className="text-xs text-gray-500">Salary:</span>
                                {job.salary_type === "negotiable" ? (
                                  <span>Negotiable</span>
                                ) : job.salary_type === "fixed_range" ? (
                                  <span>
                                    {job.salary_min} - {job.salary_max}
                                  </span>
                                ) : job.salary_type === "exact_amount" ? (
                                  <span>{job.salary_exact}</span>
                                ) : job.salary_custom ? (
                                  <span>{job.salary_custom}</span>
                                ) : (
                                  <span>
                                    {job.salary_min} - {job.salary_max}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{formatDateAgo(job.created_at)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-auto flex-shrink-0">
                          <Link href={`/job-details/${generateSlug(job.job_title)}`} className="block w-full md:w-auto">
                            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                              View Details
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 w-full overflow-x-auto">
                  <Button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    variant="outline"
                    className="bg-transparent w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`h-8 w-8 md:h-10 md:w-10 rounded transition-colors flex-shrink-0 text-xs sm:text-sm ${
                          currentPage === index
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-600">
                  Showing {currentPage * jobsPerPage + 1} -{" "}
                  {Math.min((currentPage + 1) * jobsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
                </p>
              </>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Featured Offers</h3>
            {mockAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative w-full h-auto aspect-[1080/1380] bg-gray-200">
                  <Image
                    src={ad.image || "/placeholder.svg"}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-3 md:p-4">
                  <h4 className="font-bold text-sm md:text-base text-gray-900 mb-1">{ad.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">{ad.description}</p>
                  {ad.ctaLink ? (
                    <Link href={ad.ctaLink} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
                      >
                        {ad.cta}
                      </Button>
                    </Link>
                  ) : ad.whatsappNumber ? (
                    <Link
                      href={`https://wa.me/${ad.whatsappNumber}?text=${encodeURIComponent(ad.whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                      >
                        {ad.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm">
                      {ad.cta}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showRegisterPrompt && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 md:p-6 shadow-lg animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <p className="text-sm md:text-base flex-1">
              Found something interesting? Register now to get contacted privately by companies!
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 text-xs md:text-sm">Register Now</Button>
              </Link>
              <button onClick={() => setShowRegisterPrompt(false)} className="text-white hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <a
        href="https://wa.me/233546460945?text=Hi%20I%20need%20assistance%20with%20job%20opportunities"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed left-6 bottom-8 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Contact us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>

      <Footer />
    </div>
  )
}
