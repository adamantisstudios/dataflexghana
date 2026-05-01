"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SubAdmin {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  createdAt: string
}

export default function SubAdminManagementTab() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "support_admin"
  })

  const handleOpenDialog = (subAdmin?: SubAdmin) => {
    if (subAdmin) {
      setEditingId(subAdmin.id)
      setFormData({
        name: subAdmin.name,
        email: subAdmin.email,
        role: subAdmin.role
      })
    } else {
      setEditingId(null)
      setFormData({
        name: "",
        email: "",
        role: "support_admin"
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert("Please fill all required fields")
      return
    }

    if (editingId) {
      // Update existing sub-admin
      setSubAdmins(subAdmins.map(admin =>
        admin.id === editingId
          ? { ...admin, ...formData }
          : admin
      ))
    } else {
      // Create new sub-admin
      setSubAdmins([...subAdmins, {
        id: Date.now().toString(),
        ...formData,
        status: "active",
        createdAt: new Date().toISOString()
      }])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this sub-admin?")) {
      setSubAdmins(subAdmins.filter(admin => admin.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h2>
          <p className="text-gray-600 mt-1">Manage sub-admin accounts and permissions</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sub-Admin
        </Button>
      </div>

      {/* Sub-Admin List */}
      {subAdmins.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sub-Admins ({subAdmins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {admin.role}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        admin.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {admin.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(admin)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(admin.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-gray-500">No sub-admins created yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Click "Add Sub-Admin" to create a new sub-admin account
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Sub-Admin" : "Add New Sub-Admin"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update sub-admin details"
                : "Create a new sub-admin account"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_admin">Support Admin</SelectItem>
                  <SelectItem value="limited_admin">Limited Admin</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
