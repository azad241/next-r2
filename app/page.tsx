import FileManager from "@/components/s3/file-manager"
import { Toaster } from "@/components/ui/sonner"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FileManager />
      <Toaster />
    </main>
  )
}
