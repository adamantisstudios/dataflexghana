"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { RichTextRenderer } from "@/components/ui/rich-text-renderer"
import { Textarea } from "@/components/ui/textarea"

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
        placeholder={placeholder || "Enter text..."}
        className="rounded-b-md border-t-0 resize-none min-h-[200px]"
      />
    </div>
  )
}

interface OnlineCourse {
  id: string
  title: string
  instructor: string
  description: string
  modules_count: number
  course_fee: number
  certificate_available: boolean
  video_preview_url?: string
  course_structure_url?: string
  signup_link: string
  preview_link?: string
  image_url?: string
  is_published: boolean
  created_at: string
}

interface OnlineCoursesTabProps {
  getCachedData: (key: string) => any
  setCachedData: (key: string, data: any) => void
}

export default function OnlineCoursesTab({ getCachedData, setCachedData }: OnlineCoursesTabProps) {
  const [courses, setCourses] = useState<OnlineCourse[]>([])
  const [filteredCourses, setFilteredCourses] = useState<OnlineCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("All Courses")
  const [currentPage, setCurrentPage] = useState(1)
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<OnlineCourse | null>(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const itemsPerPage = 12

  const [courseForm, setCourseForm] = useState({
    title: "",
    instructor: "",
    description: "",
    modules_count: "0",
    course_fee: "0",
    certificate_available: true,
    video_preview_url: "",
    course_structure_url: "",
    signup_link: "",
    preview_link: "",
    image_url: "",
    is_published: false,
  })

  // Load courses
  useEffect(() => {
    fetchCourses()
  }, [])

  // Filter and search
  useEffect(() => {
    let filtered = courses

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (filterStatus === "Published") {
      filtered = filtered.filter((course) => course.is_published)
    } else if (filterStatus === "Draft") {
      filtered = filtered.filter((course) => !course.is_published)
    }

    setFilteredCourses(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, courses])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("online_courses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCourses(data || [])
      setCachedData("online_courses", data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      alert("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  const createOrUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const courseData = {
        ...courseForm,
        modules_count: Number.parseInt(courseForm.modules_count),
        course_fee: Number.parseFloat(courseForm.course_fee),
      }

      let updatedCourses
      if (editingCourse) {
        const { error } = await supabase.from("online_courses").update(courseData).eq("id", editingCourse.id)
        if (error) throw error
        updatedCourses = courses.map((course) =>
          course.id === editingCourse.id ? { ...course, ...courseData } : course,
        )
      } else {
        const { data, error } = await supabase.from("online_courses").insert([courseData]).select()
        if (error) throw error
        updatedCourses = [data[0], ...courses]
      }

      setCourses(updatedCourses)
      setCachedData("online_courses", updatedCourses)
      setShowCourseDialog(false)
      setEditingCourse(null)
      resetForm()
      alert(editingCourse ? "Course updated successfully!" : "Course created successfully!")
    } catch (error) {
      console.error("Error saving course:", error)
      alert("Failed to save course")
    }
  }

  const editCourse = (course: OnlineCourse) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      instructor: course.instructor,
      description: course.description,
      modules_count: course.modules_count.toString(),
      course_fee: course.course_fee.toString(),
      certificate_available: course.certificate_available,
      video_preview_url: course.video_preview_url || "",
      course_structure_url: course.course_structure_url || "",
      signup_link: course.signup_link,
      preview_link: course.preview_link || "",
      image_url: course.image_url || "",
      is_published: course.is_published,
    })
    setShowCourseDialog(true)
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("online_courses").delete().eq("id", courseId)
      if (error) throw error

      const updatedCourses = courses.filter((course) => course.id !== courseId)
      setCourses(updatedCourses)
      setCachedData("online_courses", updatedCourses)
      alert("Course deleted successfully!")
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course")
    }
  }

  const resetForm = () => {
    setCourseForm({
      title: "",
      instructor: "",
      description: "",
      modules_count: "0",
      course_fee: "0",
      certificate_available: true,
      video_preview_url: "",
      course_structure_url: "",
      signup_link: "",
      preview_link: "",
      image_url: "",
      is_published: false,
    })
  }

  const toggleDescription = (courseId: string) => {
    const newExpanded = new Set(expandedDescriptions)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedDescriptions(newExpanded)
  }

  const getPaginatedData = (data: OnlineCourse[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }

  const getTotalPages = (total: number) => Math.ceil(total / itemsPerPage)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-blue-800">Online Courses Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48 border-blue-200 focus:border-blue-500 bg-white/80">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Courses">All Courses</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-blue-200 focus:border-blue-500 bg-white/80"
            />
          </div>
          <Button
            onClick={() => {
              resetForm()
              setEditingCourse(null)
              setShowCourseDialog(true)
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getPaginatedData(filteredCourses).map((course) => (
          <Card
            key={course.id}
            className="hover:shadow-xl transition-all duration-300 border-blue-200 bg-white/90 flex flex-col"
          >
            <CardHeader>
              {course.image_url && (
                <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={course.image_url || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg text-blue-800">{course.title}</CardTitle>
                  <p className="text-sm text-blue-600 font-medium mt-1">{course.instructor}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                    course.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {course.is_published ? "Published" : "Draft"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                {/* Description */}
                <div>
                  {expandedDescriptions.has(course.id) ? (
                    <RichTextRenderer content={course.description} className="text-sm text-blue-700" />
                  ) : (
                    <>
                      <div className="text-sm text-blue-700 line-clamp-2">
                        <RichTextRenderer content={course.description} className="text-sm" />
                      </div>
                      {course.description && course.description.length > 100 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => toggleDescription(course.id)}
                          className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
                        >
                          Read more
                        </Button>
                      )}
                    </>
                  )}
                  {expandedDescriptions.has(course.id) && course.description.length > 100 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleDescription(course.id)}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
                    >
                      Show less
                    </Button>
                  )}
                </div>

                {/* Course Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-blue-600">Modules</p>
                    <p className="font-bold text-blue-800">{course.modules_count}</p>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-blue-600">Fee</p>
                    <p className="font-bold text-blue-800">GH₵ {course.course_fee}</p>
                  </div>
                  <div className="bg-blue-50 rounded p-2 col-span-2">
                    <p className="text-blue-600">Certificate</p>
                    <p className="font-bold text-blue-800">{course.certificate_available ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-blue-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editCourse(course)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteCourse(course.id)} className="flex-1">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No courses found</p>
          <Button
            onClick={() => {
              resetForm()
              setEditingCourse(null)
              setShowCourseDialog(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create First Course
          </Button>
        </div>
      )}

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create Course"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={createOrUpdateCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="instructor">Instructor Name</Label>
                <Input
                  id="instructor"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Course Description</Label>
              <RichTextEditor
                value={courseForm.description}
                onChange={(value) => setCourseForm({ ...courseForm, description: value })}
                placeholder="Enter course description..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modules_count">Number of Modules</Label>
                <Input
                  id="modules_count"
                  type="number"
                  value={courseForm.modules_count}
                  onChange={(e) => setCourseForm({ ...courseForm, modules_count: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="course_fee">Course Fee (GH₵)</Label>
                <Input
                  id="course_fee"
                  type="number"
                  step="0.01"
                  value={courseForm.course_fee}
                  onChange={(e) => setCourseForm({ ...courseForm, course_fee: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="signup_link">Signup/Registration Link</Label>
              <Input
                id="signup_link"
                type="url"
                value={courseForm.signup_link}
                onChange={(e) => setCourseForm({ ...courseForm, signup_link: e.target.value })}
                className="mt-1"
                placeholder="https://example.com/signup"
                required
              />
            </div>

            <div>
              <Label htmlFor="preview_link">Video Preview Link</Label>
              <Input
                id="preview_link"
                type="url"
                value={courseForm.preview_link}
                onChange={(e) => setCourseForm({ ...courseForm, preview_link: e.target.value })}
                className="mt-1"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <Label htmlFor="course_structure_url">Course Structure/Syllabus Link</Label>
              <Input
                id="course_structure_url"
                type="url"
                value={courseForm.course_structure_url}
                onChange={(e) => setCourseForm({ ...courseForm, course_structure_url: e.target.value })}
                className="mt-1"
                placeholder="https://example.com/syllabus"
              />
            </div>

            <div>
              <Label htmlFor="image_url">Course Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={courseForm.image_url}
                onChange={(e) => setCourseForm({ ...courseForm, image_url: e.target.value })}
                className="mt-1"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseForm.certificate_available}
                  onChange={(e) => setCourseForm({ ...courseForm, certificate_available: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Certificate Available</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseForm.is_published}
                  onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Publish Course</span>
              </label>
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
