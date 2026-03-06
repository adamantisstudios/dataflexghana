"use client"

interface AgentData {
  id: string
  full_name: string
  phone_number: string
  momo_number?: string
  region?: string
  created_at: string
  isapproved?: boolean
  wallet_balance?: number
  commission_balance?: number
}

function generateAgentsCsv(agents: AgentData[]): string {
  const headers = [
    "Agent Name",
    "Phone Number",
    "Momo Number",
    "Joined Date",
    "Status",
    "Current Wallet Balance",
    "Commission Balance",
  ]

  const csvContent = [headers.join(",")]

  agents.forEach((agent) => {
    const joinedDate = new Date(agent.created_at).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    const status = agent.isapproved ? "Approved" : "Unapproved"
    const walletBalance = (agent.wallet_balance || 0).toFixed(2)
    const commissionBalance = (agent.commission_balance || 0).toFixed(2)
    const momo = agent.momo_number || "N/A"

    const row = [
      `"${(agent.full_name || "").replace(/"/g, '""')}"`,
      `"${(agent.phone_number || "").replace(/"/g, '""')}"`,
      `"${momo.replace(/"/g, '""')}"`,
      joinedDate,
      status,
      walletBalance,
      commissionBalance,
    ]

    csvContent.push(row.join(","))
  })

  return csvContent.join("\n")
}

function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function exportAgentsToCsv(agents: AgentData[], filename: string): void {
  const csvContent = generateAgentsCsv(agents)
  downloadCsv(csvContent, filename)
}
