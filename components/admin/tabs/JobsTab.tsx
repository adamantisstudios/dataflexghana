"use client"
import type React from "react"
import { useState, useEffect, useRef, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase, type Job, JOB_INDUSTRIES } from "@/lib/supabase"
import { Plus, Edit, Trash2, Search, Filter, Ban, Check, Star } from "lucide-react"

// Rich text editor component (reused from ServicesTab)
interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const insertList = (type: "bullet" | "number") => {
    const lines = value.split("\n")
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    let startLine = 0
    let endLine = 0
    let charCount = 0

    for (let i = 0; i < lines.length; i++) {
      if (charCount <= start && start <= charCount + lines[i].length) {
        startLine = i
      }
      if (charCount <= end && end <= charCount + lines[i].length) {
        endLine = i
        break
      }
      charCount += lines[i].length + 1
    }

    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].trim()) {
        if (type === "bullet") {
          lines[i] = lines[i].replace(/^(\s*)/, "$1• ")
        } else {
          lines[i] = lines[i].replace(/^(\s*)/, `$1${i - startLine + 1}. `)
        }
      }
    }

    onChange(lines.join("\n"))
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-t-md border border-b-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => insertFormat("**", "**")}
          className="h-7 text-xs"
        >
          <strong>B</strong>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => insertFormat("*", "*")}
          className="h-7 text-xs italic"
        >
          I
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertList("bullet")} className="h-7 text-xs">
          •
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertList("number")} className="h-7 text-xs">
          1.
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertFormat("\n\n")} className="h-7 text-xs">
          ¶
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-t-none min-h-[120px] font-mono text-sm"
      />
      <div className="text-xs text-gray-500 mt-1">Use **bold**, *italic*, • for bullets, or 1. for numbers</div>
    </div>
  )
}

// Rich text renderer component (reused from ServicesTab)
interface RichTextRendererProps {
  content: string
  className?: string
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className }) => {
  const formatText = (text: string) => {
    if (!text) return ""

    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^• (.+)$/gm, '<li class="list-disc ml-4">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="list-decimal ml-4">$1</li>')

    if (formatted && !formatted.startsWith("<")) {
      formatted = "<p>" + formatted + "</p>"
    }

    formatted = formatted.replace(
      /(<li class="list-disc[^>]*>.*?<\/li>)(?:\s*<br>\s*<li class="list-disc[^>]*>.*?<\/li>)*/gs,
      (match) => {
        return '<ul class="my-2">' + match.replace(/<br>\s*/g, "") + "</ul>"
      },
    )

    formatted = formatted.replace(
      /(<li class="list-decimal[^>]*>.*?<\/li>)(?:\s*<br>\s*<li class="list-decimal[^>]*>.*?<\/li>)*/gs,
      (match) => {
        return '<ol class="my-2">' + match.replace(/<br>\s*/g, "") + "</ol>"
      },
    )

    return formatted
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
      style={{
        lineHeight: "1.6",
      }}
    />
  )
}

interface JobsTabProps {
  getCachedData: () => Job[] | undefined
  setCachedData: (data: Job[]) => void
}

// Memoize job card component
const JobCard = memo(({ job, onEdit, onToggleStatus, onToggleFeatured, onDelete }: any) => (
  <Card
    key={job.id}
    className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
  >
    <CardContent className="pt-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-emerald-800 text-lg">{job.title}</h3>
                {job.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p className="text-emerald-600">
                  <span className="font-medium">Company:</span> {job.company}
                </p>
                <p className="text-emerald-600">
                  <span className="font-medium">Location:</span> {job.location}
                </p>
                <p className="text-emerald-600">
                  <span className="font-medium">Type:</span> {job.job_type}
                </p>
                <p className="text-emerald-600">
                  <span className="font-medium">Industry:</span> {job.industry}
                </p>
                {job.salary_range && (
                  <p className="text-emerald-600">
                    <span className="font-medium">Salary:</span> {job.salary_range}
                  </p>
                )}
                <p className="text-emerald-500 text-xs">
                  <span className="font-medium">Posted:</span> {formatTimestamp(job.created_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                className={
                  job.is_active
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {job.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          {job.description && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <RichTextRenderer content={job.description} className="text-sm" />
            </div>
          )}
          {job.application_deadline && (
            <p className="text-sm text-amber-600">
              <span className="font-medium">Application Deadline:</span>{" "}
              {new Date(job.application_deadline).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(job)}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleStatus(job.id, !job.is_active)}
            className={
              job.is_active
                ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                : "border-green-300 text-green-600 hover:bg-green-50"
            }
          >
            {job.is_active ? (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleFeatured(job.id, !job.is_featured)}
            className={
              job.is_featured
                ? "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                : "border-purple-300 text-purple-600 hover:bg-purple-50"
            }
          >
            <Star className="h-4 w-4 mr-2" />
            {job.is_featured ? "Unfeature" : "Feature"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(job.id)} className="w-full sm:w-auto">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
))

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default memo(function JobsTab({ getCachedData, setCachedData }: JobsTabProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [jobSearchTerm, setJobSearchTerm] = useState("")
  const [jobsFilterAdmin, setJobsFilterAdmin] = useState("All Jobs")
  const [currentJobsPage, setCurrentJobsPage] = useState(1)
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "",
    industry: "",
    description: "",
    requirements: "",
    salary_range: "",
    application_deadline: "",
    contact_email: "",
    contact_phone: "",
    application_url: "",
    is_featured: false,
  })
  const itemsPerPage = 12

  useEffect(() => {
    const loadJobs = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setJobs(cachedData)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

        if (error) throw error
        const jobsData = data || []
        setJobs(jobsData)
        setCachedData(jobsData)
      } catch (error) {
        console.error("Error loading jobs:", error)
        alert("Failed to load jobs data.")
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [getCachedData, setCachedData])

  const memoizedFilteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.industry?.toLowerCase().includes(jobSearchTerm.toLowerCase()),
    )
  }, [jobs, jobSearchTerm])

  const memoizedStatusFiltered = useMemo(() => {
    if (jobsFilterAdmin === "All Jobs") return memoizedFilteredJobs

    return memoizedFilteredJobs.filter((job) => {
      switch (jobsFilterAdmin) {
        case "Active":
          return job.is_active === true
        case "Inactive":
          return job.is_active === false
        case "Featured":
          return job.is_featured === true
        case "Full-time":
          return job.job_type === "full-time"
        case "Part-time":
          return job.job_type === "part-time"
        case "Contract":
          return job.job_type === "contract"
        case "Internship":
          return job.job_type === "internship"
        default:
          return true
      }
    })
  }, [memoizedFilteredJobs, jobsFilterAdmin])

  useEffect(() => {
    setFilteredJobs(memoizedStatusFiltered)
    setCurrentJobsPage(1)
  }, [memoizedStatusFiltered])

  const createOrUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const jobData = {
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location,
        job_type: jobForm.job_type,
        industry: jobForm.industry,
        description: jobForm.description,
        requirements: jobForm.requirements,
        salary_range: jobForm.salary_range,
        application_deadline: jobForm.application_deadline || null,
        contact_email: jobForm.contact_email || null,
        contact_phone: jobForm.contact_phone || null,
        application_url: jobForm.application_url || null,
        is_featured: jobForm.is_featured,
        is_active: true,
      }

      let updatedJobs
      if (editingJob) {
        const { error } = await supabase.from("jobs").update(jobData).eq("id", editingJob.id)
        if (error) throw error
        updatedJobs = jobs.map((job) => (job.id === editingJob.id ? { ...job, ...jobData } : job))
      } else {
        const { data, error } = await supabase.from("jobs").insert([jobData]).select()
        if (error) throw error
        updatedJobs = [data[0], ...jobs]
      }

      setJobs(updatedJobs)
      setCachedData(updatedJobs)
      setShowJobDialog(false)
      setEditingJob(null)
      setJobForm({
        title: "",
        company: "",
        location: "",
        job_type: "",
        industry: "",
        description: "",
        requirements: "",
        salary_range: "",
        application_deadline: "",
        contact_email: "",
        contact_phone: "",
        application_url: "",
        is_featured: false,
      })
    } catch (error) {
      console.error("Error saving job:", error)
      alert("Failed to save job")
    }
  }

  const editJob = (job: Job) => {
    setEditingJob(job)
    setJobForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      job_type: job.job_type || "",
      industry: job.industry || "",
      description: job.description || "",
      requirements: job.requirements || "",
      salary_range: job.salary_range || "",
      application_deadline: job.application_deadline
        ? new Date(job.application_deadline).toISOString().split("T")[0]
        : "",
      contact_email: job.contact_email || "",
      contact_phone: job.contact_phone || "",
      application_url: job.application_url || "",
      is_featured: job.is_featured || false,
    })
    setShowJobDialog(true)
  }

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("jobs").update({ is_active: isActive }).eq("id", jobId)
      if (error) throw error

      const updatedJobs = jobs.map((job) => (job.id === jobId ? { ...job, is_active: isActive } : job))
      setJobs(updatedJobs)
      setCachedData(updatedJobs)
    } catch (error) {
      console.error("Error updating job status:", error)
      alert("Failed to update job status")
    }
  }

  const toggleJobFeatured = async (jobId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase.from("jobs").update({ is_featured: isFeatured }).eq("id", jobId)
      if (error) throw error

      const updatedJobs = jobs.map((job) => (job.id === jobId ? { ...job, is_featured: isFeatured } : job))
      setJobs(updatedJobs)
      setCachedData(updatedJobs)
    } catch (error) {
      console.error("Error updating job featured status:", error)
      alert("Failed to update job featured status")
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId)
      if (error) throw error

      const updatedJobs = jobs.filter((job) => job.id !== jobId)
      setJobs(updatedJobs)
      setCachedData(updatedJobs)
      alert("Job deleted successfully!")
    } catch (error) {
      console.error("Error deleting job:", error)
      alert("Failed to delete job.")
    }
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={`${currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={`${currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Job Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              value={jobSearchTerm}
              onChange={(e) => setJobSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Select value={jobsFilterAdmin} onValueChange={setJobsFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Jobs">All Jobs</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Featured">Featured</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowJobDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {getPaginatedData(filteredJobs, currentJobsPage).map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onEdit={editJob}
            onToggleStatus={toggleJobStatus}
            onToggleFeatured={toggleJobFeatured}
            onDelete={deleteJob}
          />
        ))}
      </div>

      <PaginationControls
        currentPage={currentJobsPage}
        totalPages={getTotalPages(filteredJobs.length)}
        onPageChange={setCurrentJobsPage}
      />

      {/* Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Create Job"}</DialogTitle>
            <DialogDescription>
              {editingJob ? "Update the job details below." : "Fill in the details to create a new job posting."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createOrUpdateJob} className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    type="text"
                    id="title"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    type="text"
                    id="company"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    className="w-full mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    type="text"
                    id="location"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select
                    value={jobForm.job_type}
                    onValueChange={(value) => setJobForm({ ...jobForm, job_type: value })}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={jobForm.industry}
                    onValueChange={(value) => setJobForm({ ...jobForm, industry: value })}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    type="text"
                    id="salary_range"
                    value={jobForm.salary_range}
                    onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    className="w-full mt-1"
                    placeholder="e.g., ₵2,000 - ₵5,000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description</Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={jobForm.description}
                    onChange={(value) => setJobForm({ ...jobForm, description: value })}
                    placeholder="Enter detailed job description..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={jobForm.requirements}
                    onChange={(value) => setJobForm({ ...jobForm, requirements: value })}
                    placeholder="Enter job requirements and qualifications..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    type="email"
                    id="contact_email"
                    value={jobForm.contact_email}
                    onChange={(e) => setJobForm({ ...jobForm, contact_email: e.target.value })}
                    className="w-full mt-1"
                    placeholder="hr@company.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">For "Apply via Email" button</p>
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    type="tel"
                    id="contact_phone"
                    value={jobForm.contact_phone}
                    onChange={(e) => setJobForm({ ...jobForm, contact_phone: e.target.value })}
                    className="w-full mt-1"
                    placeholder="+233 XX XXX XXXX"
                  />
                  <p className="text-xs text-gray-500 mt-1">Clickable phone number</p>
                </div>
              </div>

              <div>
                <Label htmlFor="application_url">Application URL</Label>
                <Input
                  type="url"
                  id="application_url"
                  value={jobForm.application_url}
                  onChange={(e) => setJobForm({ ...jobForm, application_url: e.target.value })}
                  className="w-full mt-1"
                  placeholder="https://company.com/careers/apply"
                />
                <p className="text-xs text-gray-500 mt-1">For "Apply Online" button</p>
              </div>

              <div>
                <Label htmlFor="application_deadline">Application Deadline</Label>
                <Input
                  type="date"
                  id="application_deadline"
                  value={jobForm.application_deadline}
                  onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })}
                  className="w-full mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={jobForm.is_featured}
                  onChange={(e) => setJobForm({ ...jobForm, is_featured: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-emerald-600"
                />
                <Label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                  Feature this job (appears at the top of listings)
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full sm:w-auto">
                {editingJob ? "Update Job" : "Create Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
})
