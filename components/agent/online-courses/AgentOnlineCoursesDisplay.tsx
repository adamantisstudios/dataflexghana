"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ExternalLink, Video, FileText, Award } from "lucide-react"
import { RichTextRenderer } from "@/components/ui/rich-text-renderer"
import Link from "next/link"

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

interface AgentOnlineCoursesDisplayProps {
  courses: OnlineCourse[]
  loading?: boolean
}

export default function AgentOnlineCoursesDisplay({ courses, loading = false }: AgentOnlineCoursesDisplayProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

  const toggleDescription = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <Card className="w-full border-blue-200 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-6 text-center py-16">
          <BookOpen className="h-20 w-20 mx-auto mb-4 text-blue-300" />
          <h3 className="text-2xl font-semibold text-blue-800 mb-2">No Courses Available Yet</h3>
          <p className="text-blue-600 max-w-md mx-auto">
            Check back soon! New online courses will be published here by the admin. These courses will help you enhance
            your skills and advance your career.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="hover:shadow-xl transition-all duration-300 border-blue-200 bg-white/95 backdrop-blur-sm flex flex-col"
          >
            <CardHeader className="space-y-3">
              {course.image_url && (
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden">
                  <img
                    src={course.image_url || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=200&width=400"
                    }}
                  />
                </div>
              )}
              <div>
                <CardTitle className="text-lg text-blue-900 leading-tight">{course.title}</CardTitle>
                <p className="text-sm text-blue-600 font-medium mt-1">by {course.instructor}</p>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Description */}
              <div className="flex-1">
                {expandedCourses.has(course.id) ? (
                  <>
                    <RichTextRenderer content={course.description} className="text-sm text-gray-700" />
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleDescription(course.id)}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-2"
                    >
                      Show less
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-700 line-clamp-3">
                      <RichTextRenderer content={course.description} />
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
              </div>

              {/* Course Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                  <p className="text-blue-600 font-medium mb-1">Modules</p>
                  <p className="text-xl font-bold text-blue-900">{course.modules_count}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                  <p className="text-emerald-600 font-medium mb-1">Course Fee</p>
                  <p className="text-xl font-bold text-emerald-900">GH₵{course.course_fee}</p>
                </div>
              </div>

              {/* Certificate Badge */}
              {course.certificate_available && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white w-fit mx-auto">
                  <Award className="h-3 w-3 mr-1" />
                  Certificate Available
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-blue-100">
                {course.preview_link && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                  >
                    <Link href={course.preview_link} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Preview
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                )}

                {course.course_structure_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-transparent"
                  >
                    <Link href={course.course_structure_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Syllabus
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                )}

                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                >
                  <Link href={course.signup_link} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Enroll Now
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
