"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase, type DataBundle } from "@/lib/supabase"
import { Database, Plus, Edit, Trash2, AlertCircle } from "lucide-react"

interface BundleGridProps {
  provider: string
  bundles: DataBundle[]
  editBundle: (bundle: DataBundle) => void
  loadData: () => void
}

const BundleGrid: React.FC<BundleGridProps> = ({ provider, bundles, editBundle, loadData }) => {
  // Filter bundles by provider and sort by size_gb in ascending order
  const filteredBundles = bundles.filter((bundle) => bundle.provider === provider).sort((a, b) => a.size_gb - b.size_gb)

  const deleteBundle = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this data bundle? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("data_bundles").delete().eq("id", bundleId)
      if (error) throw error
      alert("Data bundle deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting data bundle:", error)
      alert("Failed to delete data bundle.")
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {filteredBundles.map((bundle) => (
        <Card
          key={bundle.id}
          className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
        >
          <CardHeader>
            {bundle.image_url && (
              <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden">
                <img
                  src={bundle.image_url || "/placeholder.svg"}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardTitle className="text-lg text-emerald-800">{bundle.name}</CardTitle>
            <CardDescription className="text-emerald-600 flex items-center gap-2">
              <img
                src={
                  bundle.provider === "MTN"
                    ? "/images/mtn.jpg"
                    : bundle.provider === "AirtelTigo"
                      ? "/images/airteltigo.jpg"
                      : "/images/telecel.jpg"
                }
                alt={`${bundle.provider} logo`}
                className="w-5 h-5 rounded object-cover"
              />
              {bundle.size_gb}GB - {bundle.provider}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">Price:</span>
                <span className="text-sm font-semibold text-emerald-800">₵{bundle.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">Commission Rate:</span>
                {/* CRITICAL FIX: Display precise commission rate with proper decimal places */}
                <div className="text-right">
                  <span className="text-sm font-semibold text-emerald-800">
                    {(bundle.commission_rate * 100).toFixed(4)}%
                  </span>
                  <div className="text-xs text-gray-500">(₵{(bundle.price * bundle.commission_rate).toFixed(4)})</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">Validity:</span>
                <span className="text-sm font-semibold text-emerald-800">{bundle.validity_months} Months</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => editBundle(bundle)}
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteBundle(bundle.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface DataTabProps {
  getCachedData: () => DataBundle[] | undefined
  setCachedData: (data: DataBundle[]) => void
}

export default function DataTab({ getCachedData, setCachedData }: DataTabProps) {
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [showBundleDialog, setShowBundleDialog] = useState(false)
  const [editingBundle, setEditingBundle] = useState<DataBundle | null>(null)
  const [bundleForm, setBundleForm] = useState({
    name: "",
    provider: "MTN",
    size_gb: "",
    price: "",
    validity_months: "",
    commission_rate: "",
    image_url: "",
  })
  const [commissionRateError, setCommissionRateError] = useState("")
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({
    MTN: true,
    AirtelTigo: true,
    Telecel: true,
  })
  const [togglingProvider, setTogglingProvider] = useState<string | null>(null)

  const loadData = async () => {
    const cachedData = getCachedData()
    if (cachedData) {
      // Sort cached data by provider first, then by size_gb in ascending order
      const sortedData = [...cachedData].sort((a, b) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider)
        }
        return a.size_gb - b.size_gb
      })
      setDataBundles(sortedData)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("data_bundles")
        .select("*")
        .order("provider", { ascending: true })
        .order("size_gb", { ascending: true })

      if (error) throw error
      const bundlesData = data || []
      setDataBundles(bundlesData)
      setCachedData(bundlesData)
    } catch (error) {
      console.error("Error loading data bundles:", error)
      alert("Failed to load data bundles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [getCachedData, setCachedData])

  useEffect(() => {
    if (dataBundles.length > 0) {
      const status: Record<string, boolean> = {}
      const providers = ["MTN", "AirtelTigo", "Telecel"]

      providers.forEach((provider) => {
        const providerBundles = dataBundles.filter((b) => b.provider === provider)
        // Provider is enabled if at least one bundle is active
        status[provider] = providerBundles.some((b) => b.is_active)
      })

      setProviderStatus(status)
    }
  }, [dataBundles])

  // CRITICAL FIX: Enhanced commission rate validation
  const validateCommissionRate = (value: string): boolean => {
    setCommissionRateError("")

    if (!value || value.trim() === "") {
      setCommissionRateError("Commission rate is required")
      return false
    }

    const numValue = Number.parseFloat(value)

    if (isNaN(numValue)) {
      setCommissionRateError("Commission rate must be a valid number")
      return false
    }

    if (numValue < 0) {
      setCommissionRateError("Commission rate cannot be negative")
      return false
    }

    if (numValue > 1) {
      setCommissionRateError("Commission rate cannot exceed 1 (100%)")
      return false
    }

    // Check decimal places (allow up to 6 decimal places for precision like 0.008765)
    const decimalPlaces = (value.split(".")[1] || "").length
    if (decimalPlaces > 6) {
      setCommissionRateError("Commission rate cannot have more than 6 decimal places")
      return false
    }

    return true
  }

  const createOrUpdateBundle = async (e: React.FormEvent) => {
    e.preventDefault()

    // CRITICAL FIX: Validate commission rate before submission
    if (!validateCommissionRate(bundleForm.commission_rate)) {
      return
    }

    try {
      const bundleData = {
        ...bundleForm,
        size_gb: Number.parseInt(bundleForm.size_gb),
        price: Number.parseFloat(bundleForm.price),
        validity_months: Number.parseInt(bundleForm.validity_months),
        // CRITICAL FIX: Preserve exact decimal precision
        commission_rate: Number.parseFloat(bundleForm.commission_rate),
      }

      // CRITICAL FIX: Additional validation before API call
      if (!bundleData.name || !bundleData.provider || !bundleData.size_gb || !bundleData.price) {
        alert("Please fill in all required fields")
        return
      }

      console.log("Submitting bundle data:", bundleData) // Debug log

      // CRITICAL FIX: Use API route instead of direct Supabase calls for better error handling
      let response
      if (editingBundle) {
        // Update existing bundle via API
        response = await fetch("/api/admin/data-bundles", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingBundle.id,
            ...bundleData,
          }),
        })
      } else {
        // Create new bundle via API
        response = await fetch("/api/admin/data-bundles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bundleData),
        })
      }

      console.log("API Response status:", response.status) // Debug log

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        console.error("API Error Response:", errorData) // Debug log

        // Extract error message with fallbacks
        const errorMessage =
          errorData?.error ||
          errorData?.message ||
          errorData?.details ||
          `HTTP ${response.status}: ${response.statusText}`

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("API Result:", result) // Debug log

      if (!result.success) {
        const errorMessage = result?.error || result?.message || result?.details || "Failed to save bundle"
        throw new Error(errorMessage)
      }

      // Update local state with the returned data
      let updatedBundles
      if (editingBundle) {
        updatedBundles = dataBundles.map((bundle) => (bundle.id === editingBundle.id ? result.data : bundle))
      } else {
        updatedBundles = [...dataBundles, result.data]
      }

      // Sort the updated bundles by provider first, then by size_gb in ascending order
      const sortedBundles = updatedBundles.sort((a, b) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider)
        }
        return a.size_gb - b.size_gb
      })

      setDataBundles(sortedBundles)
      setCachedData(sortedBundles)
      setShowBundleDialog(false)
      setEditingBundle(null)
      setCommissionRateError("")
      setBundleForm({
        name: "",
        provider: "MTN",
        size_gb: "",
        price: "",
        validity_months: "",
        image_url: "",
        commission_rate: "",
      })

      // Show success message
      alert(editingBundle ? "Bundle updated successfully!" : "Bundle created successfully!")
    } catch (error) {
      console.error("Error saving bundle:", error)
      alert(`Failed to save bundle: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const editBundle = (bundle: DataBundle) => {
    setEditingBundle(bundle)
    setBundleForm({
      name: bundle.name || "",
      provider: bundle.provider || "",
      size_gb: bundle.size_gb?.toString() || "",
      price: bundle.price?.toString() || "",
      validity_months: bundle.validity_months?.toString() || "",
      image_url: bundle.image_url || "",
      // CRITICAL FIX: Preserve exact decimal precision when editing
      commission_rate: bundle.commission_rate?.toString() || "",
    })
    setCommissionRateError("")
    setShowBundleDialog(true)
  }

  const toggleProvider = async (provider: string) => {
    const currentStatus = providerStatus[provider]
    const newStatus = !currentStatus

    if (
      !confirm(
        `Are you sure you want to ${newStatus ? "enable" : "disable"} all ${provider} data bundles? This will affect all agents.`,
      )
    ) {
      return
    }

    setTogglingProvider(provider)
    try {
      // Bulk update all bundles for this provider
      const { error } = await supabase.from("data_bundles").update({ is_active: newStatus }).eq("provider", provider)

      if (error) throw error

      const updatedBundles = dataBundles.map((bundle) =>
        bundle.provider === provider ? { ...bundle, is_active: newStatus } : bundle,
      )
      setDataBundles(updatedBundles)
      setCachedData(updatedBundles)

      // Update provider status immediately
      setProviderStatus((prev) => ({ ...prev, [provider]: newStatus }))

      // Reload data from database to ensure consistency
      await loadData()

      alert(`${provider} bundles have been ${newStatus ? "enabled" : "disabled"} successfully!`)
    } catch (error) {
      console.error(`Error toggling ${provider}:`, error)
      alert(`Failed to ${newStatus ? "enable" : "disable"} ${provider} bundles.`)
    } finally {
      setTogglingProvider(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Data Bundle Management</h2>
        <Button
          onClick={() => setShowBundleDialog(true)}
          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bundle
        </Button>
      </div>

      <Tabs defaultValue="MTN" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
          {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
            const logoMap = {
              MTN: "/images/mtn-logo.jpg",
              AirtelTigo: "/images/airteltigo-logo.jpg",
              Telecel: "/images/telecel-logo.jpg",
            }
            const bundleCount = dataBundles.filter((bundle) => bundle.provider === provider).length
            const isEnabled = providerStatus[provider]
            return (
              <TabsTrigger
                key={provider}
                value={provider}
                className="text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-2 lg:p-3 flex items-center justify-center gap-2"
              >
                <img
                  src={logoMap[provider as keyof typeof logoMap] || "/placeholder.svg"}
                  alt={`${provider} logo`}
                  className="w-5 h-5 rounded object-cover"
                />
                <div className="flex flex-col items-center">
                  <span className="hidden sm:inline">{provider}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs opacity-75">({bundleCount})</span>
                    {!isEnabled && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        OFF
                      </Badge>
                    )}
                  </div>
                </div>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
          const providerBundles = dataBundles
            .filter((bundle) => bundle.provider === provider)
            .sort((a, b) => a.size_gb - b.size_gb)

          const activeBundles = providerBundles.filter((b) => b.is_active).length
          const inactiveBundles = providerBundles.filter((b) => !b.is_active).length
          const isEnabled = providerStatus[provider]

          return (
            <TabsContent key={provider} value={provider} className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-emerald-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200">
                      <img
                        src={
                          provider === "MTN"
                            ? "/images/mtn.jpg"
                            : provider === "AirtelTigo"
                              ? "/images/airteltigo.jpg"
                              : "/images/telecel.jpg"
                        }
                        alt={`${provider} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>{provider} Data Bundles</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {activeBundles} active
                    </Badge>
                    {inactiveBundles > 0 && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        {inactiveBundles} inactive
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant={isEnabled ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleProvider(provider)}
                  disabled={togglingProvider === provider || providerBundles.length === 0}
                  className={isEnabled ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
                >
                  {togglingProvider === provider ? (
                    <>
                      <Database className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isEnabled ? (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Disable All {provider}
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Enable All {provider}
                    </>
                  )}
                </Button>
              </div>

              {!isEnabled && providerBundles.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-semibold">{provider} bundles are currently disabled</p>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Agents cannot order any {provider} data bundles until you enable them.
                  </p>
                </div>
              )}

              {providerBundles.length === 0 ? (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center">
                    <div className="text-gray-500 mb-4">
                      <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No data bundles available for {provider}</p>
                      <p className="text-sm">Click "Add Bundle" to create one</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <BundleGrid provider={provider} bundles={dataBundles} editBundle={editBundle} loadData={loadData} />
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Bundle Dialog */}
      <Dialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? "Edit Data Bundle" : "Create Data Bundle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createOrUpdateBundle} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="name"
                value={bundleForm.name}
                onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <Select
                value={bundleForm.provider}
                onValueChange={(value) => setBundleForm({ ...bundleForm, provider: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTN">MTN</SelectItem>
                  <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                  <SelectItem value="Telecel">Telecel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="size_gb" className="text-right">
                Size (GB)
              </Label>
              <Input
                type="number"
                id="size_gb"
                value={bundleForm.size_gb}
                onChange={(e) => setBundleForm({ ...bundleForm, size_gb: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (₵)
              </Label>
              <Input
                type="number"
                id="price"
                value={bundleForm.price}
                onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="validity_months" className="text-right">
                Validity (Months)
              </Label>
              <Input
                type="number"
                id="validity_months"
                value={bundleForm.validity_months}
                onChange={(e) => setBundleForm({ ...bundleForm, validity_months: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            {/* CRITICAL FIX: Enhanced commission rate input */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="commission_rate" className="text-right pt-2">
                Commission Rate
                <span className="text-xs text-gray-500 block">(decimal)</span>
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  type="number"
                  id="commission_rate"
                  value={bundleForm.commission_rate}
                  onChange={(e) => {
                    setBundleForm({ ...bundleForm, commission_rate: e.target.value })
                    // Clear error when user starts typing
                    if (commissionRateError) {
                      setCommissionRateError("")
                    }
                  }}
                  onBlur={(e) => validateCommissionRate(e.target.value)}
                  step="0.000001"
                  min="0"
                  max="1"
                  placeholder="e.g., 0.005 for 0.5%"
                  className={commissionRateError ? "border-red-500" : ""}
                  required
                />
                {commissionRateError && <p className="text-xs text-red-500">{commissionRateError}</p>}
                <div className="text-xs text-gray-500 space-y-1 bg-blue-50 p-2 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900">Commission Rate Guide:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>0.01 = 1% (¢0.29 for ₵29 bundle)</li>
                    <li>0.005 = 0.5% (¢0.145 for ₵29 bundle)</li>
                    <li>0.0087 = 0.87% (¢0.252 for ₵29 bundle)</li>
                    <li>0.05 = 5%</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 p-2 rounded border border-emerald-200 space-y-1">
                  <p className="text-xs font-semibold text-emerald-900">Live Preview:</p>
                  <p className="text-sm font-medium text-emerald-800">
                    Rate:{" "}
                    {bundleForm.commission_rate
                      ? `${(Number.parseFloat(bundleForm.commission_rate || "0") * 100).toFixed(6)}%`
                      : "0%"}
                  </p>
                  {bundleForm.commission_rate && bundleForm.price && (
                    <p className="text-sm font-medium text-emerald-800">
                      Amount: ₵
                      {(Number.parseFloat(bundleForm.price) * Number.parseFloat(bundleForm.commission_rate)).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">
                Image URL
              </Label>
              <Input
                type="url"
                id="image_url"
                value={bundleForm.image_url}
                onChange={(e) => setBundleForm({ ...bundleForm, image_url: e.target.value })}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={!!commissionRateError}
                className={commissionRateError ? "opacity-50 cursor-not-allowed" : ""}
              >
                {editingBundle ? "Update Bundle" : "Create Bundle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
