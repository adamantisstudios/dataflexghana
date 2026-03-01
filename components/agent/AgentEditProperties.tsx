"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Trash2, Search, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Property {
  id: string
  title: string
  description: string
  category: string
  price: number
  currency: string
  location: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  image_urls: string[]
  is_approved: boolean
  published_by_agent_id: string
  created_at: string
}

interface AgentEditPropertiesProps {
  agentId: string
  canUpdateProperties?: boolean
}

const PROPERTY_CATEGORIES = [
  "Houses for Sale",
  "Houses for Rent",
  "Apartments / Flats",
  "Commercial Properties",
  "Land for Sale",
  "New Developments / Estates",
  "Short Stay / Airbnb-style Rentals",
  "Luxury Properties",
  "Industrial Properties",
  "Serviced / Shared Spaces",
]

export default function AgentEditProperties({ agentId, canUpdateProperties = true }: AgentEditPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const isReadOnly = !canUpdateProperties

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    currency: "GHS",
    location: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    commission: "",
    image_urls: [] as string[],
  })

  useEffect(() => {
    loadProperties()
  }, [agentId])

  useEffect(() => {
    filterProperties()
  }, [properties, searchTerm, categoryFilter, statusFilter])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("published_by_agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setProperties(data || [])
      setMessage(null)
    } catch (error) {
      console.error("Error loading properties:", error)
      setMessage({
        type: "error",
        text: "Failed to load properties. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = properties

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((p) =>
        statusFilter === "Approved" ? p.is_approved : !p.is_approved
      )
    }

    setFilteredProperties(filtered)
  }

  const openEditDialog = (property: Property) => {
    setEditingProperty(property)
    setFormData({
      title: property.title,
      description: property.description,
      category: property.category,
      price: property.price.toString(),
      currency: property.currency,
      location: property.location,
      bedrooms: property.details?.bedrooms?.toString() || "",
      bathrooms: property.details?.bathrooms?.toString() || "",
      square_feet: property.details?.size?.toString() || "",
      commission: property.commission?.toString() || "",
      image_urls: property.image_urls || [],
    })
    setShowEditDialog(true)
  }

  const closeEditDialog = () => {
    setShowEditDialog(false)
    setEditingProperty(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      currency: "GHS",
      location: "",
      bedrooms: "",
      bathrooms: "",
      square_feet: "",
      commission: "",
      image_urls: [],
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleCurrencyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, currency: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!editingProperty) return

    try {
      setSubmitting(true)

      const details = {
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
        size: formData.square_feet ? parseInt(formData.square_feet) : 0,
      }

      const { error } = await supabase
        .from("properties")
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          location: formData.location,
          details: details,
          commission: formData.commission ? parseFloat(formData.commission) : 0,
          image_urls: formData.image_urls,
          is_approved: false, // Always submit as unapproved (awaiting admin approval)
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProperty.id)

      if (error) throw error

      toast.success("Property submitted for admin approval")
      closeEditDialog()
      loadProperties()
    } catch (error) {
      console.error("Error updating property:", error)
      toast.error("Failed to submit property. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId)

      if (error) throw error

      toast.success("Property deleted successfully")
      loadProperties()
    } catch (error) {
      console.error("Error deleting property:", error)
      toast.error("Failed to delete property. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (filteredProperties.length === 0 && properties.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">No properties yet</p>
            <p className="text-sm text-gray-600">
              {isReadOnly 
                ? "No properties available to view."
                : "You haven't submitted any properties yet. Submit a property to get started."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertCircle className={`h-4 w-4 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} />
          <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card className="border-amber-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className={`grid ${isReadOnly ? 'grid-cols-1 md:grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {filteredProperties.map((property) => (
          <Card key={property.id} className={`border-amber-200 hover:border-amber-400 transition-all overflow-hidden ${isReadOnly ? 'shadow-sm' : ''}`}>
            {/* Property Image */}
            {property.image_urls && property.image_urls.length > 0 ? (
              <div className={`relative w-full ${isReadOnly ? 'h-32' : 'h-48'} bg-gray-100 overflow-hidden`}>
                <img
                  src={property.image_urls[0]}
                  alt={property.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%' y='50%' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"
                  }}
                />
                {property.image_urls.length > 1 && (
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    +{property.image_urls.length - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className={`w-full ${isReadOnly ? 'h-32' : 'h-48'} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-gray-400 text-2xl mb-1">🏠</div>
                  <p className="text-gray-500 text-xs">No image</p>
                </div>
              </div>
            )}

            <CardHeader className={isReadOnly ? 'pb-2' : 'pb-3'}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className={`line-clamp-2 ${isReadOnly ? 'text-sm' : 'text-base'}`}>{property.title}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{property.location}</p>
                </div>
                <Badge className={`text-xs flex-shrink-0 ${property.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {property.is_approved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className={`space-y-2 ${isReadOnly ? 'pb-2' : 'pb-3'}`}>  {/* Increased bottom padding for editable cards */}
              <div className={`grid grid-cols-2 gap-1.5 ${isReadOnly ? 'text-xs' : 'text-sm'}`}>
                <div>
                  <p className="text-gray-500 text-xs">Price</p>
                  <p className="font-semibold">{property.currency}{property.price.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Category</p>
                  <p className="font-semibold text-xs line-clamp-1">{property.category}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Beds</p>
                  <p className="font-semibold">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Baths</p>
                  <p className="font-semibold">{property.bathrooms}</p>
                </div>
              </div>

              <p className={`text-gray-600 line-clamp-1 ${isReadOnly ? 'text-xs' : 'text-sm'}`}>{property.description}</p>

              {/* Actions Row */}
              <div className={`flex items-center gap-1.5 pt-2 border-t border-amber-100 ${isReadOnly ? 'justify-end' : ''}`}>
                {!isReadOnly && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(property)}
                      className="border-amber-300 text-amber-600 hover:bg-amber-50 flex-1 text-xs h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white flex-1 text-xs h-8"
                      disabled={submitting}
                      onClick={() => handleSubmit({preventDefault: () => {}} as any)}
                    >
                      Submit
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(property.id)}
                  className={isReadOnly ? 'w-full text-xs h-8' : 'flex-1 text-xs h-8'}
                  disabled={isReadOnly && property.is_approved}
                  title={isReadOnly && property.is_approved ? "Cannot delete approved properties" : ""}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Make changes to your property. Click submit to send for admin approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GHS">GHS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="square_feet">Square Feet</Label>
                <Input
                  id="square_feet"
                  name="square_feet"
                  type="number"
                  value={formData.square_feet}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission (GH¢)</Label>
              <Input
                id="commission"
                name="commission"
                type="number"
                step="0.01"
                value={formData.commission}
                onChange={handleInputChange}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">Commission amount in Ghana Cedis (GH¢)</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}