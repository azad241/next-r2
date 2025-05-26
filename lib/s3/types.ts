export interface UploadResult {
  key: string
  etag?: string
  location?: string
}

export interface FileMetadata {
  size?: number
  lastModified?: Date
  contentType?: string
  etag?: string
}


export interface FileObject {
  Key?: string
  LastModified?: Date
  Size?: number
  ETag?: string
}