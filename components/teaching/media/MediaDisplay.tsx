"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Download, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MediaItem {
  id: string
  media_type: "image" | "audio"
  media_url: string
  file_name: string
  file_size?: number
  width?: number
  height?: number
  duration?: number
}

interface MediaDisplayProps {
  media: MediaItem[]
}

export function MediaDisplay({ media }: MediaDisplayProps) {
  if (!media || media.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {media.map((item) => (
        <Card key={item.id} className="overflow-hidden border-gray-200">
          <CardContent className="p-0">
            {item.media_type === "image" ? (
              <div className="relative bg-gray-100 aspect-video flex items-center justify-center overflow-hidden">
                <img
                  src={item.media_url || "/placeholder.svg"}
                  alt={item.file_name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="bg-blue-600 rounded-full p-4 mb-4">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
                <p className="text-sm font-medium text-gray-800 text-center mb-2">{item.file_name}</p>
                {item.duration && (
                  <p className="text-xs text-gray-600 mb-4">Duration: {Math.floor(item.duration / 1000)}s</p>
                )}
                <audio src={item.media_url} controls className="w-full max-w-xs" />
              </div>
            )}
            <div className="p-3 bg-white border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.file_name}</p>
                  {item.file_size && (
                    <p className="text-xs text-gray-600">{(item.file_size / 1024 / 1024).toFixed(2)} MB</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" asChild className="ml-2">
                  <a href={item.media_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
