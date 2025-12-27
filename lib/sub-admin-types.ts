export interface SubAdminRole {
  id: string
  agent_id: string
  assigned_by_admin_id: string
  assigned_tabs: string[]
  permissions: Record<string, any>
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface TabAccessInfo {
  agentId: string
  tabId: string
  hasAccess: boolean
  assignedTabs: string[]
}

export interface SubAdminAssignmentPayload {
  agent_id: string
  assigned_tabs: string[]
  notes?: string
}

export const AVAILABLE_TABS = [
  { id: "agents", label: "Agents" },
  { id: "agent-management", label: "Agent Management" },
  { id: "sub-admin-management", label: "Sub-Admin Management" }, // added sub-admin management to available tabs
  { id: "manual-registration", label: "Manual Registration" },
  { id: "teacher-hub", label: "Teacher Hub" },
  { id: "audio-management", label: "Audio Management" },
  { id: "link-cache", label: "Link Cache" },
  { id: "domestic-workers", label: "Domestic Workers" },
  { id: "domestic-worker-requests", label: "Client Requests" },
  { id: "wholesale", label: "Wholesale" },
  { id: "properties", label: "Properties" },
  { id: "blogs", label: "Blogs" },
  { id: "services", label: "Services" },
  { id: "data", label: "Data" },
  { id: "wallet-overview", label: "Wallet Overview" },
  { id: "orders", label: "Orders" },
  { id: "bulk-orders", label: "Bulk Orders" },
  { id: "referrals", label: "Referrals" },
  { id: "payouts", label: "Payouts" },
  { id: "wallets", label: "Wallets" },
  { id: "savings", label: "Savings" },
  { id: "compliance", label: "Compliance" },
  { id: "professional-writing", label: "Professional Writing" },
  { id: "invitation-management", label: "Invitation Management" },
  { id: "online-courses", label: "Online Courses" },
]
