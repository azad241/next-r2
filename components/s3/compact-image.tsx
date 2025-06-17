"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import type { ListObjectsResponse, FileObject } from "@/lib/s3/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CompactImageGalleryProps {
  limit?: number
  onImageSelect?: (file: FileObject) => void
  height?: string
}

export default function CompactImageGallery({ limit = 12, onImageSelect, height = "400px" }: CompactImageGalleryProps) {
  const [objectResponse, setObjectResponse] = useState<ListObjectsResponse>({ objects: [] })
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const isImageFile = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")
  }

  const fetchFiles = async (continuationToken?: string, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(
        `/api/files?continuationToken=${encodeURIComponent(continuationToken || "")}&limit=${limit}`,
      )
      const data = await response.json()

      if (response.ok) {
        // Filter only image files
        const imageFiles = data.ListObjectsResponse.objects.filter(
          (file: FileObject) => file.Key && isImageFile(file.Key),
        )

        const newResponse = {
          ...data.ListObjectsResponse,
          objects: imageFiles,
        }

        if (append) {
          // Append new files to existing ones
          setObjectResponse((prev) => ({
            ...newResponse,
            objects: [...prev.objects, ...imageFiles],
          }))
        } else {
          // Replace all files (initial load or refresh)
          setObjectResponse(newResponse)
        }
      } else {
        toast(data.error || "Failed to fetch images")
      }
    } catch {
      toast("Failed to fetch images")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleDelete = async (file: FileObject, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!file.Key) return

    const confirmed = confirm(`Are you sure you want to delete "${file.Key.split("/").pop()}"?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(file.Key)}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (response.ok) {
        toast("Image deleted successfully")
        // Remove from state
        setObjectResponse((prev) => ({
          ...prev,
          objects: prev.objects.filter((f) => f.Key !== file.Key),
        }))
      } else {
        toast(data.error || "Failed to delete image")
      }
    } catch {
      toast("Failed to delete image")
    }
  }

  const handleLoadMore = () => {
    if (objectResponse.nextToken) {
      fetchFiles(objectResponse.nextToken, true)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getImageUrl = (key: string) => {
    return `${process.env.NEXT_PUBLIC_R2_URL}/${key}`
  }

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toUpperCase() || "UNKNOWN"
  }

  const getFileName = (key: string) => {
    return key.split("/").pop() || key
  }

  const handleImageClick = (file: FileObject) => {
    if (onImageSelect) {
      onImageSelect(file)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {objectResponse.objects.length}
            {objectResponse.isTruncated ? "+" : ""} images
          </span>
        </div>
        <Button onClick={() => fetchFiles()} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading images...</p>
        </div>
      ) : objectResponse.objects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images found</p>
        </div>
      ) : (
        <ScrollArea style={{ height }} className="w-full">
          <div className="space-y-4 pr-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {objectResponse.objects.map((file) => (
                <div key={file.Key} className="group relative">
                  <div
                    className="relative aspect-square rounded-md border border-muted overflow-hidden bg-muted/50 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleImageClick(file)}
                  >
                    {/* Image */}
                    <img
                      src={getImageUrl(file.Key!) || "/placeholder.svg"}
                      alt="Gallery image"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />

                    {/* Delete button */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => handleDelete(file, e)}
                        className="h-7 w-7 p-0 shadow-lg bg-red-500/95 hover:bg-red-600 border border-red-400/50 backdrop-blur-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Hover overlay with info */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-200 flex items-end opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="p-2 text-white w-full">
                        <p className="text-xs font-medium truncate mb-1" title={getFileName(file.Key!)}>
                          {getFileName(file.Key!)}
                        </p>
                        <div className="flex items-center justify-between text-xs opacity-90">
                          <span>{getFileExtension(file.Key!)}</span>
                          <span>{formatFileSize(file.Size)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {objectResponse.isTruncated && objectResponse.nextToken && (
              <div className="flex justify-center pt-2">
                <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" size="sm" className="w-full">
                  {loadingMore ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
