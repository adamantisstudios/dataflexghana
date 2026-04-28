"use client"
import { FileText, File } from "lucide-react"

interface DocumentPreviewProps {
  fileName: string
  fileType: string
  fileUrl: string
}

export function DocumentPreview({ fileName, fileType, fileUrl }: DocumentPreviewProps) {
  const getFileIcon = () => {
    if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-600" />
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileText className="h-8 w-8 text-blue-600" />
    if (fileType.includes("sheet") || fileType.includes("excel")) return <FileText className="h-8 w-8 text-green-600" />
    if (fileType.includes("text")) return <FileText className="h-8 w-8 text-gray-600" />
    return <File className="h-8 w-8 text-gray-600" />
  }

  const getFileExtension = () => {
    const ext = fileName.split(".").pop()?.toUpperCase() || "FILE"
    return ext
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors my-2 w-full"
    >
      <div className="flex-shrink-0">{getFileIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
        <p className="text-xs text-gray-500">{getFileExtension()} Document</p>
      </div>
      <div className="flex-shrink-0 text-blue-600 hover:text-blue-700">
        <FileText className="h-4 w-4" />
      </div>
    </a>
  )
}
