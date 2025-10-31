"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  MapPin,
  GraduationCap,
  Phone,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface DomesticWorker {
  id: string
  full_name: string
  age: number | null
  date_of_birth: string | null
  tribe: string | null
  religion: string | null
  years_of_experience: number | null
  marital_status: string | null
  number_of_children: number | null
  physical_disabilities: string | null
  health_conditions: string | null
  allergies: string | null
  current_location: string | null
  primary_language: string | null
  other_languages: string | null
  highest_education_level: string | null
  field_of_study: string | null
  key_skills: string | null
  hobbies: string | null
  availability_status: "available" | "unavailable" | "busy"
  is_published: boolean
  image_url_1?: string | null
  image_url_2?: string | null
  image_url_3?: string | null
  willing_to_relocate?: boolean | null
  job_type?: "Live-In" | "Live-Out" | "Live-In or Live-Out" | null
  reference_1_name?: string | null
  reference_1_contact?: string | null
  reference_2_name?: string | null
  reference_2_contact?: string | null
  whatsapp_number?: string | null
  mobile_line?: string | null
  created_at: string
  updated_at: string
}

interface DomesticWorkerRequest {
  id: string
  client_full_name: string
  client_phone: string
  client_email: string
  exact_location: string
  number_of_people_needing_support: number
  person_needing_support: string
  religious_faith: string
  salary_estimation: string
  working_hours_days: string
  worker_type: "live-in" | "live-out"
  faith_preference: "same-faith" | "any-faith" | "different-faith"
  start_date_preference: string
  additional_info: string
  status: "pending" | "processing" | "completed" | "cancelled"
  assigned_candidate_id?: string
  created_at: string
  updated_at: string
  candidate_name?: string
}

// Helper function to get an abridged name
const getAbridgedName = (fullName: string) => {
  const names = fullName.split(" ")
  if (names.length === 1) return names[0]
  return `${names[0]} ${names[names.length - 1].charAt(0)}.`
}

// Memoize worker card component
const WorkerCard = memo(({ worker, onView, onEdit, onTogglePublish, onCopy, onDelete }: any) => (
  <Card key={worker.id} className="border-green-200 hover:shadow-lg transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg text-green-800">{getAbridgedName(worker.full_name)}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
            <span>Age: {worker.age}</span>
            <span>•</span>
            <span>{worker.years_of_experience} years exp.</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {worker.availability_status === "available" ? (
            <Badge className="bg-green-500 text-white text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-500 text-white text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Unavailable
            </Badge>
          )}
          {worker.is_published ? (
            <Badge variant="outline" className="text-xs">
              Published
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Unpublished
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>

    <CardContent className="space-y-3">
      <div className="aspect-square w-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden">
        <ImageWithFallback
          src={worker.image_url_1 || "/placeholder.svg?height=200&width=200&query=professional domestic worker"}
          alt={getAbridgedName(worker.full_name)}
          className="w-full h-full object-cover"
          fallbackSrc="/placeholder.svg?key=rcwal"
        />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-green-600">
          <MapPin className="h-4 w-4" />
          <span>{worker.current_location}</span>
        </div>

        <div className="flex items-center gap-2 text-green-600">
          <GraduationCap className="h-4 w-4" />
          <span>{worker.highest_education_level}</span>
        </div>

        <div className="text-green-600">
          <strong>Skills:</strong> {worker.key_skills?.substring(0, 50)}...
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(worker)} className="text-xs">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(worker)} className="text-xs">
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={() => onTogglePublish(worker)} className="text-xs">
          {worker.is_published ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          {worker.is_published ? "Unpublish" : "Publish"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onCopy(worker)} className="text-xs">
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" className="w-full text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {getAbridgedName(worker.full_name)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(worker.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  </Card>
))

export default memo(function DomesticWorkersTab() {
  const [activeSubTab, setActiveSubTab] = useState("candidates")
  const [workers, setWorkers] = useState<DomesticWorker[]>([])
  const [requests, setRequests] = useState<DomesticWorkerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorker, setSelectedWorker] = useState<DomesticWorker | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DomesticWorkerRequest | null>(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // New worker form state
  const [newWorker, setNewWorker] = useState<Partial<DomesticWorker>>({
    full_name: "",
    age: 25,
    date_of_birth: "",
    tribe: "",
    religion: "",
    years_of_experience: 0,
    marital_status: "",
    number_of_children: 0,
    physical_disabilities: "",
    health_conditions: "",
    allergies: "",
    current_location: "",
    primary_language: "",
    other_languages: "",
    highest_education_level: "",
    field_of_study: "",
    key_skills: "",
    hobbies: "",
    availability_status: "available",
    is_published: true,
    image_url_1: "",
    image_url_2: "",
    image_url_3: "",
    willing_to_relocate: false,
    job_type: "Live-In or Live-Out",
    reference_1_name: "",
    reference_1_contact: "",
    reference_2_name: "",
    reference_2_contact: "",
    whatsapp_number: "",
    mobile_line: "",
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [workersResponse, requestsResponse] = await Promise.all([
        supabase.from("domestic_workers_candidates").select("*").order("created_at", { ascending: false }),
        supabase.from("domestic_workers_requests").select("*").order("created_at", { ascending: false }),
      ])

      if (workersResponse.error) throw workersResponse.error
      if (requestsResponse.error) throw requestsResponse.error

      setWorkers(workersResponse.data || [])
      setRequests(requestsResponse.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = async () => {
    setSubmitting(true)
    try {
      const workerData = Object.fromEntries(
        Object.entries(newWorker).map(([key, value]) => [key, value === "" ? null : value]),
      )

      const { error } = await supabase.from("domestic_workers_candidates").insert([workerData])

      if (error) throw error

      toast.success("Worker added successfully")
      setShowAddWorkerModal(false)
      setNewWorker({
        full_name: "",
        age: 25,
        date_of_birth: "",
        tribe: "",
        religion: "",
        years_of_experience: 0,
        marital_status: "",
        number_of_children: 0,
        physical_disabilities: "",
        health_conditions: "",
        allergies: "",
        current_location: "",
        primary_language: "",
        other_languages: "",
        highest_education_level: "",
        field_of_study: "",
        key_skills: "",
        hobbies: "",
        availability_status: "available",
        is_published: true,
        image_url_1: "",
        image_url_2: "",
        image_url_3: "",
        willing_to_relocate: false,
        job_type: "Live-In or Live-Out",
        reference_1_name: "",
        reference_1_contact: "",
        reference_2_name: "",
        reference_2_contact: "",
        whatsapp_number: "",
        mobile_line: "",
      })
      loadData()
    } catch (error) {
      console.error("Error adding worker:", error)
      toast.error("Failed to add worker")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateWorker = async () => {
    if (!selectedWorker) return

    setSubmitting(true)
    try {
      const workerData = Object.fromEntries(
        Object.entries(selectedWorker).map(([key, value]) => [key, value === "" ? null : value]),
      )

      const { error } = await supabase
        .from("domestic_workers_candidates")
        .update(workerData)
        .eq("id", selectedWorker.id)

      if (error) throw error

      toast.success("Worker updated successfully")
      setIsEditing(false)
      loadData()
    } catch (error) {
      console.error("Error updating worker:", error)
      toast.error("Failed to update worker")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    try {
      const { error } = await supabase.from("domestic_workers_candidates").delete().eq("id", workerId)

      if (error) throw error

      toast.success("Worker deleted successfully")
      loadData()
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast.error("Failed to delete worker")
    }
  }

  const handleTogglePublish = async (worker: DomesticWorker) => {
    try {
      const { error } = await supabase
        .from("domestic_workers_candidates")
        .update({ is_published: !worker.is_published })
        .eq("id", worker.id)

      if (error) throw error

      toast.success(`Worker ${worker.is_published ? "unpublished" : "published"} successfully`)
      loadData()
    } catch (error) {
      console.error("Error toggling publish status:", error)
      toast.error("Failed to update publish status")
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase.from("domestic_workers_requests").update({ status }).eq("id", requestId)

      if (error) throw error

      toast.success("Request status updated successfully")
      loadData()
    } catch (error) {
      console.error("Error updating request status:", error)
      toast.error("Failed to update request status")
    }
  }

  const copyWorkerDetails = (worker: DomesticWorker) => {
    const details = `--- Domestic Worker Profile ---

📝 Candidate Information
Full Name: ${worker.full_name || "—"}
Age: ${worker.age || "—"}
Date of Birth: ${worker.date_of_birth || "—"}
Tribe: ${worker.tribe || "—"}
Religion: ${worker.religion || "—"}
Years of Experience: ${worker.years_of_experience || "—"}
Marital Status: ${worker.marital_status || "—"}
Number of Children: ${worker.number_of_children || "—"}

⚕️ Health Information
Physical Disabilities: ${worker.physical_disabilities || "—"}
Health Conditions: ${worker.health_conditions || "—"}
Allergies: ${worker.allergies || "—"}

📍 Location & Language
Current Location: ${worker.current_location || "—"}
Primary Language: ${worker.primary_language || "—"}
Other Languages: ${worker.other_languages || "—"}

🎓 Education
Highest Education Level: ${worker.highest_education_level || "—"}
Field of Study: ${worker.field_of_study || "—"}

📱 Contact Information
WhatsApp Number: ${worker.whatsapp_number || "—"}
Mobile Line: ${worker.mobile_line || "—"}

💡 Additional Information
Key Skills: ${worker.key_skills || "—"}
Hobbies: ${worker.hobbies || "—"}

👨‍👩‍👧 References
Reference 1: ${worker.reference_1_name || "—"} ${worker.reference_1_contact ? `(${worker.reference_1_contact})` : ""}
Reference 2: ${worker.reference_2_name || "—"} ${worker.reference_2_contact ? `(${worker.reference_2_contact})` : ""}

🏠 Work Preferences
Willing To Relocate: ${worker.willing_to_relocate ? "Yes" : "No"}
Job Type: ${worker.job_type || "—"}

✅ Status: ${worker.availability_status === "available" ? "Available" : "Unavailable"}

Contact admin for more details: +233242799990`.trim()

    navigator.clipboard.writeText(details)
    toast.success("Worker details copied to clipboard!")
  }

  // Removed the duplicate getAbridgedName function here as it's now defined above WorkerCard
  // const getAbridgedName = (fullName: string) => {
  //   const names = fullName.split(" ")
  //   if (names.length === 1) return names[0]
  //   return `${names[0]} ${names[names.length - 1].charAt(0)}.`
  // }

  const formatSalaryEstimation = (salary: string | null) => {
    if (!salary) return "Not specified"
    // Replace any dollar signs with Ghana cedi symbol
    return salary.replace(/\$/g, "GH¢")
  }

  const memoizedFilteredWorkers = useMemo(() => {
    return workers.filter(
      (worker) =>
        (worker.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (worker.current_location?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (worker.key_skills?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )
  }, [workers, searchTerm])

  const memoizedFilteredRequests = useMemo(() => {
    return requests.filter(
      (request) =>
        (request.client_full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (request.exact_location?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )
  }, [requests, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-green-700">Loading domestic workers data...</p>
        </div>
      </div>
    )
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/worker-requests?id=${requestId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to delete request")
      }

      // Remove from local state
      setRequests((prev) => prev.filter((req) => req.id !== requestId))
      setShowRequestModal(false)
      setSelectedRequest(null)

      alert("Request deleted successfully")
    } catch (error) {
      console.error("Error deleting request:", error)
      alert("Error deleting request. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Domestic Workers Management</h2>
          <p className="text-green-600">Manage domestic worker candidates and client requests</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Users className="h-4 w-4 mr-1" />
            {workers.length} Workers
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <FileText className="h-4 w-4 mr-1" />
            {requests.length} Requests
          </Badge>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Candidates ({workers.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests ({requests.filter((r) => r.status === "pending").length} pending)
          </TabsTrigger>
        </TabsList>

        {/* Candidates Tab */}
        <TabsContent value="candidates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 h-4 w-4" />
              <Input
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500"
              />
            </div>
            <Button onClick={() => setShowAddWorkerModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memoizedFilteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onView={() => {
                  setSelectedWorker(worker)
                  setShowWorkerModal(true)
                  setIsEditing(false)
                }}
                onEdit={() => {
                  setSelectedWorker(worker)
                  setShowWorkerModal(true)
                  setIsEditing(true)
                }}
                onTogglePublish={handleTogglePublish}
                onCopy={copyWorkerDetails}
                onDelete={handleDeleteWorker}
              />
            ))}
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoizedFilteredRequests.map((request) => (
              <Card key={request.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-blue-800">{request.client_full_name}</CardTitle>
                      <p className="text-sm text-blue-600">{request.exact_location}</p>
                    </div>
                    <Badge
                      className={
                        request.status === "pending"
                          ? "bg-yellow-500"
                          : request.status === "processing"
                            ? "bg-blue-500"
                            : request.status === "completed"
                              ? "bg-green-500"
                              : "bg-red-500"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Users className="h-4 w-4" />
                      <span>Candidate: {request.candidate_name || "Not specified"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="text-lg">GH¢</span>
                      <span>{formatSalaryEstimation(request.salary_estimation)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-600">
                      <Calendar className="h-4 w-4" />
                      <span>{request.start_date_preference}</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-600">
                      <MapPin className="h-4 w-4" />
                      <span>{request.exact_location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowRequestModal(true)
                      }}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>

                    {request.client_phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${request.client_phone}`, "_self")}
                        className="text-xs"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={request.status === "pending" ? "default" : "outline"}
                      onClick={() => handleUpdateRequestStatus(request.id, "pending")}
                      className="flex-1 text-xs"
                    >
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={request.status === "processing" ? "default" : "outline"}
                      onClick={() => handleUpdateRequestStatus(request.id, "processing")}
                      className="flex-1 text-xs"
                    >
                      Processing
                    </Button>
                    <Button
                      size="sm"
                      variant={request.status === "completed" ? "default" : "outline"}
                      onClick={() => handleUpdateRequestStatus(request.id, "completed")}
                      className="flex-1 text-xs"
                    >
                      Completed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Worker Modal */}
      <Dialog open={showAddWorkerModal} onOpenChange={setShowAddWorkerModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-800">Add New Domestic Worker</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-800">Images</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="image_url_1">Image URL 1</Label>
                  <Input
                    id="image_url_1"
                    value={newWorker.image_url_1 || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, image_url_1: e.target.value }))}
                    placeholder="https://example.com/image1.jpg"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="image_url_2">Image URL 2</Label>
                  <Input
                    id="image_url_2"
                    value={newWorker.image_url_2 || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, image_url_2: e.target.value }))}
                    placeholder="https://example.com/image2.jpg"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="image_url_3">Image URL 3</Label>
                  <Input
                    id="image_url_3"
                    value={newWorker.image_url_3 || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, image_url_3: e.target.value }))}
                    placeholder="https://example.com/image3.jpg"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-800">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={newWorker.full_name || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newWorker.age || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, age: Number.parseInt(e.target.value) || 0 }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={newWorker.date_of_birth || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="tribe">Tribe</Label>
                  <Input
                    id="tribe"
                    value={newWorker.tribe || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, tribe: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    value={newWorker.religion || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, religion: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    value={newWorker.years_of_experience || ""}
                    onChange={(e) =>
                      setNewWorker((prev) => ({ ...prev, years_of_experience: Number.parseInt(e.target.value) || 0 }))
                    }
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select
                    value={newWorker.marital_status || ""}
                    onValueChange={(value) => setNewWorker((prev) => ({ ...prev, marital_status: value }))}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="number_of_children">Number of Children</Label>
                  <Input
                    id="number_of_children"
                    type="number"
                    value={newWorker.number_of_children || ""}
                    onChange={(e) =>
                      setNewWorker((prev) => ({ ...prev, number_of_children: Number.parseInt(e.target.value) || 0 }))
                    }
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="physical_disabilities">Physical Disabilities</Label>
                  <Input
                    id="physical_disabilities"
                    value={newWorker.physical_disabilities || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, physical_disabilities: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Any physical disabilities or limitations"
                  />
                </div>

                <div>
                  <Label htmlFor="health_conditions">Health Conditions</Label>
                  <Input
                    id="health_conditions"
                    value={newWorker.health_conditions || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, health_conditions: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Any health conditions to note"
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={newWorker.allergies || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, allergies: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Any known allergies"
                  />
                </div>

                <div>
                  <Label htmlFor="current_location">Current Location</Label>
                  <Input
                    id="current_location"
                    value={newWorker.current_location || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, current_location: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="primary_language">Primary Language</Label>
                  <Input
                    id="primary_language"
                    value={newWorker.primary_language || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, primary_language: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="other_languages">Other Languages</Label>
                  <Input
                    id="other_languages"
                    value={newWorker.other_languages || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, other_languages: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="highest_education_level">Highest Education Level</Label>
                  <Input
                    id="highest_education_level"
                    value={newWorker.highest_education_level || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, highest_education_level: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="field_of_study">Field of Study</Label>
                  <Input
                    id="field_of_study"
                    value={newWorker.field_of_study || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, field_of_study: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="key_skills">Key Skills</Label>
                  <Textarea
                    id="key_skills"
                    value={newWorker.key_skills || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, key_skills: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="hobbies">Hobbies</Label>
                  <Input
                    id="hobbies"
                    value={newWorker.hobbies || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, hobbies: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="willing_to_relocate">Willing To Relocate</Label>
                  <Select
                    value={newWorker.willing_to_relocate ? "Yes" : "No"}
                    onValueChange={(value) =>
                      setNewWorker((prev) => ({ ...prev, willing_to_relocate: value === "Yes" }))
                    }
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select
                    value={newWorker.job_type || ""}
                    onValueChange={(value: "Live-In" | "Live-Out" | "Live-In or Live-Out") =>
                      setNewWorker((prev) => ({ ...prev, job_type: value }))
                    }
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Live-In">Live-In</SelectItem>
                      <SelectItem value="Live-Out">Live-Out</SelectItem>
                      <SelectItem value="Live-In or Live-Out">Live-In or Live-Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reference_1_name">Reference 1 Name</Label>
                  <Input
                    id="reference_1_name"
                    value={newWorker.reference_1_name || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, reference_1_name: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Full name of first reference"
                  />
                </div>

                <div>
                  <Label htmlFor="reference_1_contact">Reference 1 Contact</Label>
                  <Input
                    id="reference_1_contact"
                    value={newWorker.reference_1_contact || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, reference_1_contact: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Phone number or email"
                  />
                </div>

                <div>
                  <Label htmlFor="reference_2_name">Reference 2 Name</Label>
                  <Input
                    id="reference_2_name"
                    value={newWorker.reference_2_name || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, reference_2_name: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Full name of second reference"
                  />
                </div>

                <div>
                  <Label htmlFor="reference_2_contact">Reference 2 Contact</Label>
                  <Input
                    id="reference_2_contact"
                    value={newWorker.reference_2_contact || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, reference_2_contact: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="Phone number or email"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={newWorker.whatsapp_number || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, whatsapp_number: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="+233XXXXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="mobile_line">Mobile Line</Label>
                  <Input
                    id="mobile_line"
                    value={newWorker.mobile_line || ""}
                    onChange={(e) => setNewWorker((prev) => ({ ...prev, mobile_line: e.target.value }))}
                    className="border-green-200 focus:border-green-500"
                    placeholder="+233XXXXXXXXX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availability_status">Availability Status</Label>
                    <Select
                      value={newWorker.availability_status || "available"}
                      onValueChange={(value: "available" | "unavailable" | "busy") =>
                        setNewWorker((prev) => ({ ...prev, availability_status: value }))
                      }
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={newWorker.is_published || false}
                      onChange={(e) => setNewWorker((prev) => ({ ...prev, is_published: e.target.checked }))}
                      className="rounded border-green-300"
                    />
                    <Label htmlFor="is_published">Published</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-green-200">
                <Button variant="outline" onClick={() => setShowAddWorkerModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWorker}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Worker"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Worker Details/Edit Modal */}
      {selectedWorker && (
        <Dialog open={showWorkerModal} onOpenChange={setShowWorkerModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-800">
                {isEditing ? "Edit Worker" : "Worker Details"} - {getAbridgedName(selectedWorker.full_name)}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {isEditing ? (
                // Edit Mode - Show input fields
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-800">Profile Images</h3>
                    <div className="space-y-3">
                      {/* Image URL 1 */}
                      <div>
                        <Label htmlFor="image_url_1">Image URL 1</Label>
                        <Input
                          id="image_url_1"
                          value={selectedWorker.image_url_1 || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, image_url_1: e.target.value })}
                          placeholder="Enter image URL"
                          className="border-green-200 focus:border-green-500"
                        />
                        {selectedWorker.image_url_1 && (
                          <div className="aspect-square w-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden mt-2">
                            <ImageWithFallback
                              src={selectedWorker.image_url_1 || "/placeholder.svg"}
                              alt={`${getAbridgedName(selectedWorker.full_name)} - Image 1`}
                              className="w-full h-full object-cover"
                              fallbackSrc="/placeholder.svg?key=rcwal"
                            />
                          </div>
                        )}
                      </div>

                      {/* Image URL 2 */}
                      <div>
                        <Label htmlFor="image_url_2">Image URL 2</Label>
                        <Input
                          id="image_url_2"
                          value={selectedWorker.image_url_2 || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, image_url_2: e.target.value })}
                          placeholder="Enter image URL"
                          className="border-green-200 focus:border-green-500"
                        />
                        {selectedWorker.image_url_2 && (
                          <div className="aspect-square w-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden mt-2">
                            <ImageWithFallback
                              src={selectedWorker.image_url_2 || "/placeholder.svg"}
                              alt={`${getAbridgedName(selectedWorker.full_name)} - Image 2`}
                              className="w-full h-full object-cover"
                              fallbackSrc="/placeholder.svg?key=rcwal"
                            />
                          </div>
                        )}
                      </div>

                      {/* Image URL 3 */}
                      <div>
                        <Label htmlFor="image_url_3">Image URL 3</Label>
                        <Input
                          id="image_url_3"
                          value={selectedWorker.image_url_3 || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, image_url_3: e.target.value })}
                          placeholder="Enter image URL"
                          className="border-green-200 focus:border-green-500"
                        />
                        {selectedWorker.image_url_3 && (
                          <div className="aspect-square w-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden mt-2">
                            <ImageWithFallback
                              src={selectedWorker.image_url_3 || "/placeholder.svg"}
                              alt={`${getAbridgedName(selectedWorker.full_name)} - Image 3`}
                              className="w-full h-full object-cover"
                              fallbackSrc="/placeholder.svg?key=rcwal"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-green-800">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={selectedWorker.full_name || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, full_name: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={selectedWorker.age || ""}
                          onChange={(e) =>
                            setSelectedWorker({ ...selectedWorker, age: Number.parseInt(e.target.value) || null })
                          }
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={selectedWorker.date_of_birth || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, date_of_birth: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tribe">Tribe</Label>
                        <Input
                          id="tribe"
                          value={selectedWorker.tribe || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, tribe: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="religion">Religion</Label>
                        <Input
                          id="religion"
                          value={selectedWorker.religion || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, religion: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="years_of_experience">Years of Experience</Label>
                        <Input
                          id="years_of_experience"
                          type="number"
                          value={selectedWorker.years_of_experience || ""}
                          onChange={(e) =>
                            setSelectedWorker({
                              ...selectedWorker,
                              years_of_experience: Number.parseInt(e.target.value) || null,
                            })
                          }
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="marital_status">Marital Status</Label>
                        <Select
                          value={selectedWorker.marital_status || ""}
                          onValueChange={(value) => setSelectedWorker({ ...selectedWorker, marital_status: value })}
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-500">
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="number_of_children">Number of Children</Label>
                        <Input
                          id="number_of_children"
                          type="number"
                          value={selectedWorker.number_of_children || ""}
                          onChange={(e) =>
                            setSelectedWorker({
                              ...selectedWorker,
                              number_of_children: Number.parseInt(e.target.value) || null,
                            })
                          }
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="current_location">Current Location</Label>
                        <Input
                          id="current_location"
                          value={selectedWorker.current_location || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, current_location: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="primary_language">Primary Language</Label>
                        <Input
                          id="primary_language"
                          value={selectedWorker.primary_language || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, primary_language: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="other_languages">Other Languages</Label>
                        <Input
                          id="other_languages"
                          value={selectedWorker.other_languages || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, other_languages: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="highest_education_level">Education Level</Label>
                        <Select
                          value={selectedWorker.highest_education_level || ""}
                          onValueChange={(value) =>
                            setSelectedWorker({ ...selectedWorker, highest_education_level: value })
                          }
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-500">
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="tertiary">Tertiary</SelectItem>
                            <SelectItem value="university">University</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="field_of_study">Field of Study</Label>
                        <Input
                          id="field_of_study"
                          value={selectedWorker.field_of_study || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, field_of_study: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="health_conditions">Health Conditions</Label>
                        <Input
                          id="health_conditions"
                          value={selectedWorker.health_conditions || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, health_conditions: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                          placeholder="None"
                        />
                      </div>
                      <div>
                        <Label htmlFor="allergies">Allergies</Label>
                        <Input
                          id="allergies"
                          value={selectedWorker.allergies || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, allergies: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                          placeholder="None"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hobbies">Hobbies</Label>
                        <Input
                          id="hobbies"
                          value={selectedWorker.hobbies || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, hobbies: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="physical_disabilities">Physical Disabilities</Label>
                        <Input
                          id="physical_disabilities"
                          value={selectedWorker.physical_disabilities || ""}
                          onChange={(e) =>
                            setSelectedWorker({ ...selectedWorker, physical_disabilities: e.target.value })
                          }
                          className="border-green-200 focus:border-green-500"
                          placeholder="None"
                        />
                      </div>

                      <div>
                        <Label htmlFor="willing_to_relocate_edit">Willing To Relocate</Label>
                        <Select
                          value={selectedWorker.willing_to_relocate ? "Yes" : "No"}
                          onValueChange={(value) =>
                            setSelectedWorker({ ...selectedWorker, willing_to_relocate: value === "Yes" })
                          }
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="job_type_edit">Job Type</Label>
                        <Select
                          value={selectedWorker.job_type || ""}
                          onValueChange={(value: "Live-In" | "Live-Out" | "Live-In or Live-Out") =>
                            setSelectedWorker({ ...selectedWorker, job_type: value })
                          }
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-500">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Live-In">Live-In</SelectItem>
                            <SelectItem value="Live-Out">Live-Out</SelectItem>
                            <SelectItem value="Live-In or Live-Out">Live-In or Live-Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="reference_1_name_edit">Reference 1 Name</Label>
                        <Input
                          id="reference_1_name_edit"
                          value={selectedWorker.reference_1_name || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, reference_1_name: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="reference_1_contact_edit">Reference 1 Contact</Label>
                        <Input
                          id="reference_1_contact_edit"
                          value={selectedWorker.reference_1_contact || ""}
                          onChange={(e) =>
                            setSelectedWorker({ ...selectedWorker, reference_1_contact: e.target.value })
                          }
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="reference_2_name_edit">Reference 2 Name</Label>
                        <Input
                          id="reference_2_name_edit"
                          value={selectedWorker.reference_2_name || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, reference_2_name: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="reference_2_contact_edit">Reference 2 Contact</Label>
                        <Input
                          id="reference_2_contact_edit"
                          value={selectedWorker.reference_2_contact || ""}
                          onChange={(e) =>
                            setSelectedWorker({ ...selectedWorker, reference_2_contact: e.target.value })
                          }
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="whatsapp_number_edit">WhatsApp Number</Label>
                        <Input
                          id="whatsapp_number_edit"
                          value={selectedWorker.whatsapp_number || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, whatsapp_number: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="mobile_line_edit">Mobile Line</Label>
                        <Input
                          id="mobile_line_edit"
                          value={selectedWorker.mobile_line || ""}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, mobile_line: e.target.value })}
                          className="border-green-200 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="key_skills">Key Skills</Label>
                      <Textarea
                        id="key_skills"
                        value={selectedWorker.key_skills || ""}
                        onChange={(e) => setSelectedWorker({ ...selectedWorker, key_skills: e.target.value })}
                        rows={3}
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="availability_status">Availability Status</Label>
                        <Select
                          value={selectedWorker.availability_status || ""}
                          onValueChange={(value) =>
                            setSelectedWorker({ ...selectedWorker, availability_status: value })
                          }
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-500">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="is_published"
                          checked={selectedWorker.is_published || false}
                          onCheckedChange={(checked) =>
                            setSelectedWorker({ ...selectedWorker, is_published: !!checked })
                          }
                        />
                        <Label htmlFor="is_published">Published</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode - Show existing display code
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-800">Profile Images</h3>
                    <div className="space-y-3">
                      {[selectedWorker.image_url_1, selectedWorker.image_url_2, selectedWorker.image_url_3]
                        .filter(Boolean)
                        .map((url, index) => (
                          <div
                            key={index}
                            className="aspect-square w-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden"
                          >
                            <ImageWithFallback
                              src={url || "/placeholder.svg"}
                              alt={`${getAbridgedName(selectedWorker.full_name)} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              fallbackSrc="/placeholder.svg?key=rcwal"
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-green-800">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Full Name:</strong> {selectedWorker.full_name}
                      </div>
                      <div>
                        <strong>Age:</strong> {selectedWorker.age} years
                      </div>
                      <div>
                        <strong>Date of Birth:</strong> {selectedWorker.date_of_birth}
                      </div>
                      <div>
                        <strong>Tribe:</strong> {selectedWorker.tribe}
                      </div>
                      <div>
                        <strong>Religion:</strong> {selectedWorker.religion}
                      </div>
                      <div>
                        <strong>Experience:</strong> {selectedWorker.years_of_experience} years
                      </div>
                      <div>
                        <strong>Marital Status:</strong> {selectedWorker.marital_status}
                      </div>
                      <div>
                        <strong>Children:</strong> {selectedWorker.number_of_children}
                      </div>
                      <div>
                        <strong>Location:</strong> {selectedWorker.current_location}
                      </div>
                      <div>
                        <strong>Primary Language:</strong> {selectedWorker.primary_language}
                      </div>
                      <div>
                        <strong>Other Languages:</strong> {selectedWorker.other_languages}
                      </div>
                      <div>
                        <strong>Education:</strong> {selectedWorker.highest_education_level}
                      </div>
                      <div>
                        <strong>Field of Study:</strong> {selectedWorker.field_of_study}
                      </div>
                      <div>
                        <strong>Health Conditions:</strong> {selectedWorker.health_conditions || "None"}
                      </div>
                      <div>
                        <strong>Allergies:</strong> {selectedWorker.allergies || "None"}
                      </div>
                      <div>
                        <strong>Hobbies:</strong> {selectedWorker.hobbies}
                      </div>
                      <div>
                        <strong>Physical Disabilities:</strong> {selectedWorker.physical_disabilities || "None"}
                      </div>

                      <div>
                        <strong>Willing To Relocate:</strong> {selectedWorker.willing_to_relocate ? "Yes" : "No"}
                      </div>
                      <div>
                        <strong>Job Type:</strong> {selectedWorker.job_type || "Not specified"}
                      </div>
                      <div>
                        <strong>Reference 1:</strong> {selectedWorker.reference_1_name || "Not provided"}
                        {selectedWorker.reference_1_contact && ` (${selectedWorker.reference_1_contact})`}
                      </div>
                      <div>
                        <strong>Reference 2:</strong> {selectedWorker.reference_2_name || "Not provided"}
                        {selectedWorker.reference_2_contact && ` (${selectedWorker.reference_2_contact})`}
                      </div>
                      <div>
                        <strong>WhatsApp:</strong> {selectedWorker.whatsapp_number || "Not provided"}
                      </div>
                      <div>
                        <strong>Mobile Line:</strong> {selectedWorker.mobile_line || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <strong>Key Skills:</strong>
                      <p className="mt-1 text-sm text-green-600">{selectedWorker.key_skills}</p>
                    </div>

                    <div className="flex gap-2">
                      <Badge
                        className={
                          selectedWorker.availability_status === "available"
                            ? "bg-green-500"
                            : selectedWorker.availability_status === "busy"
                              ? "bg-orange-500"
                              : "bg-red-500"
                        }
                      >
                        {selectedWorker.availability_status}
                      </Badge>
                      <Badge variant={selectedWorker.is_published ? "default" : "secondary"}>
                        {selectedWorker.is_published ? "Published" : "Unpublished"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-green-200 space-y-3">
                {/* First row - Close and Copy buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false) // Reset editing state when closing
                      setShowWorkerModal(false)
                    }}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button onClick={() => copyWorkerDetails(selectedWorker)} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                {/* Second row - Edit/Cancel and Update buttons */}
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setIsEditing(false) // Cancel editing, revert to view mode
                          // Optionally, re-fetch the original data if needed to discard changes
                          // loadData(); // This might be too aggressive, consider a confirmation
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateWorker}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold text-blue-800">
                Request Details - {selectedRequest.client_full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Client Name:</strong> {selectedRequest.client_full_name}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedRequest.client_phone || "Not provided"}
                </div>
                <div>
                  <strong>Email:</strong> {selectedRequest.client_email || "Not provided"}
                </div>
                <div>
                  <strong>Location:</strong> {selectedRequest.exact_location}
                </div>
                <div>
                  <strong>People Needing Support:</strong> {selectedRequest.number_of_people_needing_support}
                </div>
                <div>
                  <strong>Person Needing Support:</strong> {selectedRequest.person_needing_support}
                </div>
                <div>
                  <strong>Religious Faith:</strong> {selectedRequest.religious_faith}
                </div>
                <div>
                  <strong>Salary Estimation:</strong> {formatSalaryEstimation(selectedRequest.salary_estimation)}
                </div>
                <div>
                  <strong>Working Hours/Days:</strong> {selectedRequest.working_hours_days || "Not specified"}
                </div>
                <div>
                  <strong>Worker Type:</strong> {selectedRequest.worker_type || "Not specified"}
                </div>
                <div>
                  <strong>Faith Preference:</strong> {selectedRequest.faith_preference || "Not specified"}
                </div>
                <div>
                  <strong>Start Date:</strong> {selectedRequest.start_date_preference}
                </div>
              </div>

              {selectedRequest.additional_info && (
                <div>
                  <strong>Additional Information:</strong>
                  <p className="mt-1 text-sm text-blue-600 break-words">{selectedRequest.additional_info}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <strong>Status:</strong>
                <Badge
                  className={
                    selectedRequest.status === "pending"
                      ? "bg-yellow-500"
                      : selectedRequest.status === "processing"
                        ? "bg-blue-500"
                        : selectedRequest.status === "completed"
                          ? "bg-green-500"
                          : "bg-red-500"
                  }
                >
                  {selectedRequest.status}
                </Badge>
              </div>

              <div className="text-xs text-gray-500">
                <div>Created: {new Date(selectedRequest.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(selectedRequest.updated_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t border-blue-200">
              <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1 text-sm">
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteRequest(selectedRequest.id)}
                className="flex-1 text-sm"
              >
                Delete
              </Button>
              {selectedRequest.client_phone && (
                <Button
                  onClick={() => window.open(`tel:${selectedRequest.client_phone}`, "_self")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Client
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})
