import { LinkCacheManagementTab } from "@/components/admin/tabs/LinkCacheManagementTab"

export default function LinkCacheManagementPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Link Preview Cache Management</h1>
        <p className="text-gray-600 mt-2">Manage cached link previews and storage</p>
      </div>
      <LinkCacheManagementTab />
    </div>
  )
}
