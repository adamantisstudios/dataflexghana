"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AVAILABLE_TABS } from "@/lib/sub-admin-types"
import { getStoredAdmin } from "@/lib/unified-auth-system"

/* ------------------------------------------------------------------ */

export default function SubAdminManagementTab() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchingAgents, setSearchingAgents] = useState(false)

  const [agentResults, setAgentResults] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [selectedTabs, setSelectedTabs] = useState<string[]>([])
  const [notes, setNotes] = useState("")

  /* ------------------------------------------------------------------ */
  /* Fetch assignments */
  useEffect(() => {
    fetchAssignments()
  }, [])

  async function fetchAssignments() {
    try {
      setLoading(true)
      const admin = getStoredAdmin()

      const res = await fetch("/api/admin/sub-admin/list", {
        headers: admin ? { Authorization: `Bearer ${btoa(JSON.stringify(admin))}` } : {},
      })

      const data = await res.json()
      if (data.success) setAssignments(data.data)
    } catch {
      toast.error("Failed to load sub-admin assignments")
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /* Agent Search */
  async function searchAgents(query: string) {
    if (query.trim().length < 2) {
      setAgentResults([])
      return
    }

    try {
      setSearchingAgents(true)
      const res = await fetch("/api/admin/agents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: query }),
      })

      const data = await res.json()
      if (data.success) setAgentResults(data.agents)
    } catch {
      toast.error("Failed to search agents")
    } finally {
      setSearchingAgents(false)
    }
  }

  /* ------------------------------------------------------------------ */
  async function assignSubAdmin() {
    if (!selectedAgent || selectedTabs.length === 0) {
      toast.error("Select agent and at least one tab")
      return
    }

    try {
      const admin = getStoredAdmin()

      const res = await fetch("/api/admin/sub-admin/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(admin && {
            Authorization: `Bearer ${btoa(JSON.stringify(admin))}`,
          }),
        },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          assigned_tabs: selectedTabs,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSelectedAgent(null)
        setSelectedTabs([])
        setNotes("")
        fetchAssignments()
      }
    } catch {
      toast.error("Failed to assign sub-admin")
    }
  }

  async function revokeAccess(agentId: string) {
    try {
      const admin = getStoredAdmin()
      await fetch("/api/admin/sub-admin/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(admin && {
            Authorization: `Bearer ${btoa(JSON.stringify(admin))}`,
          }),
        },
        body: JSON.stringify({ agent_id: agentId }),
      })

      toast.success("Access revoked")
      fetchAssignments()
    } catch {
      toast.error("Failed to revoke access")
    }
  }

  /* ------------------------------------------------------------------ */
  const filtered = assignments.filter(
    (a) => a.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) || a.agent_phone.includes(searchQuery),
  )

  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sub-Admin Management</h2>
          <p className="text-sm text-muted-foreground">Assign admin tab access to agents</p>
        </div>

        {/* ASSIGN MODAL */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" />
              Assign Sub-Admin
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Assign Sub-Admin</DialogTitle>
              <DialogDescription>Select an agent and assign admin tabs</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 flex-1 overflow-y-auto px-1 py-2">
              {/* SEARCH */}
              <div>
                <Label>Search Agent</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Name or phone" onChange={(e) => searchAgents(e.target.value)} />
                </div>

                {agentResults.length > 0 && (
                  /* improved search results dropdown max-height for mobile */
                  <div className="border rounded-md mt-2 max-h-40 sm:max-h-48 overflow-y-auto bg-popover">
                    {agentResults.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelectedAgent(a)
                          setAgentResults([])
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted"
                      >
                        <div className="font-medium">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.phone_number}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedAgent && (
                <>
                  {/* TABS */}
                  <div>
                    <Label className="mb-2 block">Select Tabs to Manage</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3 max-h-64 overflow-y-auto bg-muted/20">
                      {AVAILABLE_TABS.map((tab) => (
                        <label key={tab.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedTabs.includes(tab.id)}
                            onCheckedChange={() =>
                              setSelectedTabs((p) =>
                                p.includes(tab.id) ? p.filter((t) => t !== tab.id) : [...p, tab.id],
                              )
                            }
                          />
                          {tab.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* NOTES */}
                  <div>
                    <Label>Notes</Label>
                    <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button onClick={assignSubAdmin}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* LIST */}
      {loading ? (
        <p className="text-center py-10 text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">No assignments found</p>
      ) : (
        <>
          {/* MOBILE CARDS */}
          <div className="space-y-4 md:hidden">
            {filtered.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="font-semibold">{a.agent_name}</div>
                    <div className="text-sm text-muted-foreground">{a.agent_phone}</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {a.assigned_tabs.map((t: string) => (
                      <Badge key={t} variant="secondary">
                        {AVAILABLE_TABS.find((x) => x.id === t)?.label}
                      </Badge>
                    ))}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-600 bg-transparent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke Access
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove all admin permissions.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revokeAccess(a.agent_id)} className="bg-red-600">
                          Revoke
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tabs</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.agent_name}</TableCell>
                    <TableCell>{a.agent_phone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.assigned_tabs.map((t: string) => (
                          <Badge key={t} variant="secondary">
                            {AVAILABLE_TABS.find((x) => x.id === t)?.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => revokeAccess(a.agent_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
