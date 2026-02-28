"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Calendar,
  Tag,
  Clock,
  Globe,
  Save,
  X,
  Bold,
  Italic,
  List,
  Link,
  Table,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface BlogsTabProps {
  getCachedData?: (key: string) => any
  setCachedData?: (key: string, data: any) => void
}

interface Blog {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  status: "draft" | "published" | "archived"
  published_at: string
  created_at: string
  updated_at: string
  views_count: number
  reading_time: number
  tags: string[]
  category_id: string
  category?: {
    name: string
    color: string
  }
}

interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
}

export default function BlogsTab({ getCachedData, setCachedData }: BlogsTabProps) {
  const [activeTab, setActiveTab] = useState("posts")
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Blog editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    status: "draft" as const,
    category_id: "",
    tags: [] as string[],
  })

  // Category editor state
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#3B82F6",
  })

  // Rich editor state
  const [editorMode, setEditorMode] = useState<"visual" | "markdown">("visual")

  // Stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalCategories: 0,
    todayPosts: 0,
  })

  // Load data
  const loadBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          *,
          category:blog_categories(name, color)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBlogs(data || [])
    } catch (error) {
      console.error("Error loading blogs:", error)
      toast.error("Failed to load blogs")
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("blog_categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
      toast.error("Failed to load categories")
    }
  }

  const calculateStats = () => {
    const today = new Date().toISOString().split("T")[0]
    const totalPosts = blogs.length
    const publishedPosts = blogs.filter((b) => b.status === "published").length
    const draftPosts = blogs.filter((b) => b.status === "draft").length
    const totalViews = blogs.reduce((sum, b) => sum + b.views_count, 0)
    const totalCategories = categories.length
    const todayPosts = blogs.filter((b) => b.created_at.startsWith(today)).length

    setStats({
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalCategories,
      todayPosts,
    })
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadBlogs(), loadCategories()])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [blogs, categories])

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  // Calculate reading time
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  // Rich text editor functions
  const insertMarkdown = (before: string, after = "") => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = blogForm.content.substring(start, end)
    const newText = before + selectedText + after

    const newContent = blogForm.content.substring(0, start) + newText + blogForm.content.substring(end)
    setBlogForm((prev) => ({ ...prev, content: newContent }))

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const insertTable = () => {
    const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`
    setBlogForm((prev) => ({ ...prev, content: prev.content + tableMarkdown }))
  }

  const insertTOC = () => {
    const tocMarkdown = `
## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

`
    setBlogForm((prev) => ({ ...prev, content: prev.content + tocMarkdown }))
  }

  // Handle blog form submission
  const handleBlogSubmit = async () => {
    try {
      if (!blogForm.title || !blogForm.content) {
        toast.error("Title and content are required")
        return
      }

      const slug = blogForm.slug || generateSlug(blogForm.title)
      const readingTime = calculateReadingTime(blogForm.content)

      const blogData = {
        ...blogForm,
        slug,
        reading_time: readingTime,
        meta_title: blogForm.meta_title || blogForm.title,
        meta_description: blogForm.meta_description || blogForm.excerpt,
        published_at: blogForm.status === "published" ? new Date().toISOString() : null,
      }

      if (editingBlog) {
        const { error } = await supabase.from("blogs").update(blogData).eq("id", editingBlog.id)

        if (error) throw error
        toast.success("Blog updated successfully")
      } else {
        const { error } = await supabase.from("blogs").insert([blogData])

        if (error) throw error
        toast.success("Blog created successfully")
      }

      setIsEditorOpen(false)
      resetBlogForm()
      loadBlogs()
    } catch (error) {
      console.error("Error saving blog:", error)
      toast.error("Failed to save blog")
    }
  }

  // Handle category form submission
  const handleCategorySubmit = async () => {
    try {
      if (!categoryForm.name) {
        toast.error("Category name is required")
        return
      }

      const slug = categoryForm.slug || generateSlug(categoryForm.name)
      const categoryData = { ...categoryForm, slug }

      if (editingCategory) {
        const { error } = await supabase.from("blog_categories").update(categoryData).eq("id", editingCategory.id)

        if (error) throw error
        toast.success("Category updated successfully")
      } else {
        const { error } = await supabase.from("blog_categories").insert([categoryData])

        if (error) throw error
        toast.success("Category created successfully")
      }

      setIsCategoryEditorOpen(false)
      resetCategoryForm()
      loadCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("Failed to save category")
    }
  }

  // Reset forms
  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image_url: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      status: "draft",
      category_id: "",
      tags: [],
    })
    setEditingBlog(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      color: "#3B82F6",
    })
    setEditingCategory(null)
  }

  // Edit handlers
  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog)
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      featured_image_url: blog.featured_image_url,
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
      meta_keywords: blog.meta_keywords,
      status: blog.status,
      category_id: blog.category_id,
      tags: blog.tags || [],
    })
    setIsEditorOpen(true)
  }

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
    })
    setIsCategoryEditorOpen(true)
  }

  // Delete handlers
  const handleDeleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id)

      if (error) throw error
      toast.success("Blog deleted successfully")
      loadBlogs()
    } catch (error) {
      console.error("Error deleting blog:", error)
      toast.error("Failed to delete blog")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id)

      if (error) throw error
      toast.success("Category deleted successfully")
      loadCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    }
  }

  // Filter blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || blog.status === selectedStatus
    const matchesCategory = selectedCategory === "all" || blog.category_id === selectedCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">Blog Management</h2>
          <p className="text-blue-600">Create and manage your blog content with full SEO optimization</p>
        </div>
        <Button
          onClick={() => {
            resetBlogForm()
            setIsEditorOpen(true)
          }}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPosts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftPosts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-100 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-100 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 p-1 rounded-xl">
          <TabsTrigger
            value="posts"
            className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Blog Posts ({stats.totalPosts})
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
          >
            <Tag className="h-4 w-4 mr-2" />
            Categories ({stats.totalCategories})
          </TabsTrigger>
        </TabsList>

        {/* Blog Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          {/* Filters */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search blog posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Blog Posts List */}
          <div className="grid gap-4">
            {filteredBlogs.map((blog) => (
              <Card key={blog.id} className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-start gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-blue-800 break-words">{blog.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={blog.status === "published" ? "default" : "secondary"}
                            className={
                              blog.status === "published"
                                ? "bg-green-500 hover:bg-green-600 text-xs"
                                : blog.status === "draft"
                                  ? "bg-amber-500 hover:bg-amber-600 text-xs"
                                  : "bg-gray-500 hover:bg-gray-600 text-xs"
                            }
                          >
                            {blog.status}
                          </Badge>
                          {blog.category && (
                            <Badge style={{ backgroundColor: blog.category.color }} className="text-white text-xs">
                              {blog.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-blue-600 text-sm mb-2 line-clamp-2 break-words">{blog.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(blog.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {blog.views_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {blog.reading_time} min read
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
                      {blog.featured_image_url && (
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={blog.featured_image_url || "/placeholder.svg"}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )}
                      <div className="flex flex-row gap-2 justify-center lg:justify-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBlog(blog)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-3 py-2"
                        >
                          <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                          <span className="ml-1 hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/blogs/${blog.slug}`, "_blank")}
                          className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-3 py-2"
                        >
                          <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                          <span className="ml-1 hidden sm:inline">View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-2"
                        >
                          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                          <span className="ml-1 hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBlogs.length === 0 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No blog posts found</h3>
                <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
                <Button
                  onClick={() => {
                    resetBlogForm()
                    setIsEditorOpen(true)
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog Post
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetCategoryForm()
                setIsCategoryEditorOpen(true)
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCategory(category)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">{category.name}</h3>
                  <p className="text-blue-600 text-sm mb-2">{category.description}</p>
                  <p className="text-xs text-gray-500">
                    {blogs.filter((b) => b.category_id === category.id).length} posts
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Blog Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-blue-800">
              {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={blogForm.title}
                  onChange={(e) => {
                    setBlogForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    }))
                  }}
                  placeholder="Enter blog title"
                  className="text-base sm:text-lg font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={blogForm.slug}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <Label htmlFor="content">Content *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={editorMode === "visual" ? "default" : "outline"}
                    onClick={() => setEditorMode("visual")}
                  >
                    Visual
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editorMode === "markdown" ? "default" : "outline"}
                    onClick={() => setEditorMode("markdown")}
                  >
                    Markdown
                  </Button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={() => insertMarkdown("**", "**")} title="Bold">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => insertMarkdown("*", "*")} title="Italic">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => insertMarkdown("# ", "")}
                  title="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => insertMarkdown("## ", "")}
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => insertMarkdown("### ", "")}
                  title="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => insertMarkdown("- ", "")}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const url = prompt("Enter URL:")
                    const text = prompt("Enter link text:")
                    if (url && text) {
                      insertMarkdown(`[${text}](${url})`, "")
                    }
                  }}
                  title="Insert Link"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const url = prompt("Enter image URL:")
                    const alt = prompt("Enter image description:")
                    if (url && alt) {
                      insertMarkdown(`![${alt}](${url})`, "")
                    }
                  }}
                  title="Insert Image"
                >
                  <img className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={insertTable} title="Insert Table">
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={insertTOC}
                  title="Insert Table of Contents"
                  className="text-xs px-2 bg-transparent"
                >
                  TOC
                </Button>
              </div>

              <Textarea
                id="content"
                value={blogForm.content}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog content here... Use Markdown for formatting."
                rows={15}
                className="font-mono text-sm rounded-t-none border-t-0 resize-none"
              />

              <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded-b-lg">
                <strong>Markdown Tips:</strong> Use **bold**, *italic*, # Heading, - Lists, [Link](url), &lt;img
                src=&quot;url&quot; alt=&quot;description&quot;&gt;, ```code```, &gt; Blockquote
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={blogForm.excerpt}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the blog post (recommended: 150-160 characters for SEO)"
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">{blogForm.excerpt.length}/160 characters</div>
            </div>

            {/* Featured Image */}
            <div>
              <Label htmlFor="featured_image_url">Featured Image URL</Label>
              <Input
                id="featured_image_url"
                value={blogForm.featured_image_url}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, featured_image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              {blogForm.featured_image_url && (
                <div className="mt-2">
                  <img
                    src={blogForm.featured_image_url || "/placeholder.svg"}
                    alt="Featured image preview"
                    className="w-full max-w-xs h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={blogForm.category_id}
                  onValueChange={(value) => setBlogForm((prev) => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={blogForm.status}
                  onValueChange={(value: any) => setBlogForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">Only published posts appear on the public blog</div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={blogForm.tags.join(", ")}
                onChange={(e) =>
                  setBlogForm((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>

            {/* SEO Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                SEO Settings
              </h4>
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={blogForm.meta_title}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (defaults to blog title)"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {blogForm.meta_title.length}/60 characters (recommended)
                </div>
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={blogForm.meta_description}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description (defaults to excerpt)"
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {blogForm.meta_description.length}/160 characters (recommended)
                </div>
              </div>
              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={blogForm.meta_keywords}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t gap-4">
              <div className="text-sm text-gray-500">
                Reading time: ~{calculateReadingTime(blogForm.content)} minutes
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleBlogSubmit}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingBlog ? "Update" : "Create"} Blog
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Editor Dialog */}
      <Dialog open={isCategoryEditorOpen} onOpenChange={setIsCategoryEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category_name">Name *</Label>
              <Input
                id="category_name"
                value={categoryForm.name}
                onChange={(e) => {
                  setCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  }))
                }}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label htmlFor="category_slug">Slug</Label>
              <Input
                id="category_slug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
            <div>
              <Label htmlFor="category_description">Description</Label>
              <Textarea
                id="category_description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Category description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category_color">Color</Label>
              <Input
                id="category_color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsCategoryEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCategorySubmit}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {editingCategory ? "Update" : "Create"} Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
