"use client"
import type React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, File } from "lucide-react"
import { toast } from "sonner"

interface DragDropUploadProps {
  onUploadComplete: (data: any) => void
}

export default function DragDropUpload({ onUploadComplete }: DragDropUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const files = Array.from(e.dataTransfer.files)
        setUploading(true)

        try {
          for (const file of files) {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/files/upload", {
              method: "POST",
              body: formData,
            })
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.error || "Failed to upload file")
            }
            onUploadComplete(data)
          }
          toast(`${files.length} file(s) uploaded successfully`)
          
        } catch (error) {
          toast(error instanceof Error ? error.message : "Failed to upload files")
        } finally {
          setUploading(false)
        }
      }
    },
    [onUploadComplete],
  )

  
  const handleClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
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

          if (!response.ok) {
            throw new Error(data.error || "Failed to upload file")
          }
          onUploadComplete(data)
        }

        toast(`${files.length} file(s) uploaded successfully`)
        
      } catch (error) {
        toast(error instanceof Error ? error.message : "Failed to upload files")
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  return (
    <Card className={`transition-colors ${dragActive ? "border-primary bg-primary/5" : ""}`}>
      <CardContent className="p-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${uploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            {uploading ? (
              <>
                <Upload className="h-12 w-12 text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Uploading files...</p>
                  <p className="text-sm text-muted-foreground">Please wait</p>
                </div>
              </>
            ) : dragActive ? (
              <>
                <Upload className="h-12 w-12 text-primary" />
                <div>
                  <p className="text-lg font-medium">Drop files here</p>
                  <p className="text-sm text-muted-foreground">Release to upload</p>
                </div>
              </>
            ) : (
              <>
                <File className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drag & drop files here</p>
                  <p className="text-sm text-muted-foreground">or click to select files</p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
