import { listBuckets, listObjects, uploadFile, getFileUrl, deleteFile, getFileMetadata } from "@/lib/s3/d2"
import { Hono } from "hono"
import { handle } from "hono/vercel"

export const runtime = "nodejs"

const app = new Hono().basePath("/api")



// hello test
app.get("/hello", async (c) => {
  const time  = Date.now()
  try {
    return c.json({
      message: "Hello Next.js!",
      time
    })
  } catch  {
    return c.json({ error: "Failed to get buckets" }, 500)
  }
})

// List buckets
app.get("/buckets", async (c) => {
  try {
    const buckets = await listBuckets()
    return c.json({ buckets })
  } catch  {
    return c.json({ error: "Failed to list buckets" }, 500)
  }
})

// List objects in bucket
app.get("/files", async (c) => {
  try {
    const prefix = c.req.query("prefix")
    const files = await listObjects(prefix)
    return c.json({ files })
  } catch  {
    return c.json({ error: "Failed to list files" }, 500)
  }
})

// Upload file
app.post("/files/upload", async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return c.json({ error: "No file provided" }, 400)
    }

    const buffer = await file.arrayBuffer()
    const key = `uploads/${Date.now()}-${file.name}`

    await uploadFile(key, new Uint8Array(buffer), file.type)

    return c.json({
      message: "File uploaded successfully",
      key,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (e)  {
    console.log("Upload error:", e)
    return c.json({ error: "Failed to upload file" }, 500)
  }
})

// Get file URL
app.get("/files/:key/url", async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"))
    const expiresIn = Number.parseInt(c.req.query("expires") || "3600")
    const url = await getFileUrl(key, expiresIn)
    return c.json({ url })
  } catch  {
    return c.json({ error: "Failed to get file URL" }, 500)
  }
})

// Get file metadata
app.get("/files/:key/metadata", async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"))
    const metadata = await getFileMetadata(key)
    return c.json({ metadata })
  } catch  {
    return c.json({ error: "Failed to get file metadata" }, 500)
  }
})

// Delete file
app.delete("/files/:key", async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"))
    await deleteFile(key)
    return c.json({ message: "File deleted successfully" })
  } catch  {
    return c.json({ error: "Failed to delete file" }, 500)
  }
})


export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)
export const PUT = handle(app)
