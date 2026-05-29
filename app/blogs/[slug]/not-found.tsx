import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <FileQuestion className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Post not found</h1>
        <p className="text-gray-600 mb-6">
          This post may have been removed or is no longer published.
        </p>
        <Button asChild>
          <Link href="/blogs">Back to blog</Link>
        </Button>
      </div>
    </div>
  )
}
