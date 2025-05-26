"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, Trash2, File, ImageIcon, Video, Music, FileText, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DragDropUpload from "./drag-and-drop"
import { toast } from "sonner"
import { FileObject } from "@/lib/s3/types"

export default function FileManager() {
  const [files, setFiles] = useState<FileObject[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchFiles = async (prefix?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files?prefix=${encodeURIComponent(prefix || "")}`)
      const data = await response.json()
      if (response.ok) {
        setFiles(data.files)
      } else {
        toast(data.error || "Failed to fetch files")
      }
    } catch {
      toast("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (key: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}/url`)
      const data = await response.json()
      if (response.ok) {
        window.open(data.url, "_blank")
      } else {
        toast(data.error || "Failed to get download URL")
      }
    } catch {
      toast("Failed to get download URL")
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) return

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (response.ok) {
        toast("File deleted successfully")
        fetchFiles() // Refresh the file list after deletion
      } else {
        toast(data.error || "Failed to delete file")
      }
    } catch {
      toast("Failed to delete file")
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return <ImageIcon className="h-4 w-4" />
    }
    if (["mp4", "avi", "mov", "wmv", "flv"].includes(ext || "")) {
      return <Video className="h-4 w-4" />
    }
    if (["mp3", "wav", "flac", "aac"].includes(ext || "")) {
      return <Music className="h-4 w-4" />
    }
    if (["txt", "md", "doc", "docx", "pdf"].includes(ext || "")) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (date?: Date) => {
    if (!date) return "Unknown"
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString()
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()

        if (response.ok) {
          continue;
        } else {
          throw new Error(data.error || "Failed to upload file")
        }
      }

      toast(`${files.length} file(s) uploaded successfully`)
      fetchFiles() // Refresh the file list
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to upload files")
    } finally {
      setUploading(false)
      event.target.value = "" // Reset the input
    }
  }


  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Manager
          </CardTitle>
          <CardDescription>Upload, download, and manage your files in R2 storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <DragDropUpload onUploadComplete={fetchFiles} />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="file-upload">Or upload manually</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="mt-1"
                  multiple
                />
              </div>
              <Button onClick={() => fetchFiles()} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {uploading && <div className="text-sm text-muted-foreground">Uploading file...</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files ({files.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No files found. Upload your first file above.</div>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={file.Key || index}>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.Key || "")}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.Key}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.Size)}</span>
                          <span>{formatDate(file.LastModified)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                     
                      <Button size="sm" variant="outline" onClick={() => handleDownload(file.Key!)}>
                        <Download className="h-4 w-4" />
                        VIew
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(file.Key!)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  {index < files.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  )
}
