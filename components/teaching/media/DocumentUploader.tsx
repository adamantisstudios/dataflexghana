"use client"
import { useState, useRef } from "react"
import type React from "react"

import { X, FileText, type File } from "lucide-react"

interface SelectedDocument {
  file: File
  name: string
  type: string
}

interface DocumentUploaderProps {
  onDocumentsSelected: (documents: File[]) => void
  maxDocuments?: number
  disabled?: boolean
}

export function DocumentUploader({ onDocumentsSelected, maxDocuments = 5, disabled = false }: DocumentUploaderProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const documentFiles = files.filter((file) => {
      const type = file.type
      return (
        type === "application/pdf" ||
        type.includes("word") ||
        type.includes("spreadsheet") ||
        type.includes("text") ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".txt")
      )
    })

    const newDocuments: SelectedDocument[] = documentFiles.map((file) => ({
      file,
      name: file.name,
      type: file.type || "application/octet-stream",
    }))

    const combined = [...selectedDocuments, ...newDocuments].slice(0, maxDocuments)
    setSelectedDocuments(combined)
    onDocumentsSelected(combined.map((doc) => doc.file))

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeDocument = (index: number) => {
    const updated = selectedDocuments.filter((_, i) => i !== index)
    setSelectedDocuments(updated)
    onDocumentsSelected(updated.map((doc) => doc.file))
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return "📄"
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "📝"
    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) return "📊"
    return "📎"
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || selectedDocuments.length >= maxDocuments}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText size={18} />
          <span className="text-sm font-medium">Add Documents</span>
        </button>
        {selectedDocuments.length > 0 && (
          <span className="text-xs text-gray-500">
            {selectedDocuments.length}/{maxDocuments}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {selectedDocuments.length > 0 && (
        <div className="space-y-2">
          {selectedDocuments.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">{getFileIcon(doc.name)}</span>
                <span className="text-sm text-gray-700 truncate">{doc.name}</span>
              </div>
              <button
                onClick={() => removeDocument(index)}
                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
