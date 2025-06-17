"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, RefreshCw, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import type { ListObjectsResponse, FileObject } from "@/lib/s3/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImageGalleryProps {
  limit?: number
}

export default function ImageGallery({ limit = 20 }: ImageGalleryProps) {
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

  const handleDelete = async (file: FileObject) => {
    if (!file.Key || !confirm(`Are you sure you want to delete this image?`)) return

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
    alert("i am clicked")
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Gallery ({objectResponse.objects.length}
            {objectResponse.isTruncated ? "+" : ""} images)
          </CardTitle>
          <Button onClick={() => fetchFiles()} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Loading images...
          </div>
        ) : objectResponse.objects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            No images found in your storage.
          </div>
        ) : (
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-6 pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {objectResponse.objects.map((file) => (
                  <div key={file.Key} className="group relative">
                    <div className="relative rounded-lg border-2 border-muted overflow-hidden bg-muted/50 hover:border-primary/20 transition-all duration-200">
                      {/* Image container */}
                      <div className="aspect-square cursor-pointer" onClick={() => handleImageClick(file)}>
                        <img
                          src={getImageUrl(file.Key!) || "/placeholder.svg"}
                          alt="Gallery image"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>

                      {/* Beautiful delete button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(file)
                          }}
                          className="h-9 w-9 p-0 shadow-lg backdrop-blur-sm bg-red-500/90 hover:bg-red-600/90 border border-red-400/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Image details at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                        <p className="text-sm font-medium truncate mb-1" title={getFileName(file.Key!)}>
                          {getFileName(file.Key!)}
                        </p>
                        <div className="flex items-center justify-between text-xs opacity-90">
                          <span>{getFileExtension(file.Key!)}</span>
                          <span>{formatFileSize(file.Size)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {objectResponse.isTruncated && objectResponse.nextToken && (
                <div className="flex justify-center pt-4">
                  <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" size="lg">
                    {loadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading more images...
                      </>
                    ) : (
                      "Load More Images"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
