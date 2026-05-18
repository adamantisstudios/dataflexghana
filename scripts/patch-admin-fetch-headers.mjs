import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const files = [
  "components/admin/tabs/FashionProjectRequestsTab.tsx",
  "components/admin/tabs/FashionReferralsTab.tsx",
  "components/admin/tabs/FashionAvenueTab.tsx",
  "components/admin/tabs/AgentManagementTab.tsx",
  "components/admin/tabs/DataBundleOrdersLogTab.tsx",
  "components/admin/tabs/InvitationManagementTab.tsx",
  "components/admin/tabs/LinkCacheManagementTab.tsx",
  "components/admin/tabs/SavingsTab.tsx",
  "components/admin/pending-alerts-card.tsx",
  "components/admin/AdminAgentRanking.tsx",
  "app/admin/page.tsx",
  "app/admin/storage/page.tsx",
  "app/admin/wholesale/page.tsx",
  "app/admin/agents/page.tsx",
  "app/admin/agents/[id]/wallet/page.tsx",
  "app/admin/agents/[id]/data-orders/page.tsx",
  "lib/wholesale.ts",
  "lib/earnings-calculator.ts",
]

const importLine = 'import { getAdminAuthHeaders } from "@/lib/api-client"\n'

for (const rel of files) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) {
    console.log("skip missing", rel)
    continue
  }
  let content = fs.readFileSync(file, "utf8")
  if (!content.includes("/api/admin")) continue

  if (!content.includes("getAdminAuthHeaders")) {
    const firstImport = content.match(/^import .+$/m)
    if (firstImport) {
      const idx = content.indexOf(firstImport[0])
      content = content.slice(0, idx) + importLine + content.slice(idx)
    }
  }

  // fetch('/api/admin...') with no second arg
  content = content.replace(
    /await fetch\(([`'"])\/api\/admin([^`'"]+)\1\)(?!\s*,)/g,
    "await fetch($1/api/admin$2$1, { headers: getAdminAuthHeaders() })",
  )

  // headers: { "Content-Type": "application/json" } on admin fetches - only if file has getAdminAuthHeaders
  if (content.includes("getAdminAuthHeaders")) {
    content = content.replace(
      /(fetch\([`'"]\/api\/admin[^)]+\)[\s\S]*?headers:\s*)\{\s*"Content-Type":\s*"application\/json"\s*\}/g,
      "$1getAdminAuthHeaders()",
    )
  }

  fs.writeFileSync(file, content, "utf8")
  console.log("patched", rel)
}
