import 'dotenv/config';
import {S3Client,ListBucketsCommand,ListObjectsV2Command,PutObjectCommand,GetObjectCommand,
    DeleteObjectCommand,HeadObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadResult } from './types';

const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME!;


export const listBuckets = async () => {
  const command = new ListBucketsCommand({})
  const response = await client.send(command)
  return response.Buckets
}

export const listObjects = async (prefix?: string) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: 100,
  })
  const response = await client.send(command)
  return response.Contents || []
}

export const uploadFile = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string,
): Promise<UploadResult> => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
    const response = await client.send(command)
    return {
      key,
      etag: response.ETag,
      location: `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${key}`,
    }
  } catch (error) {
    console.error("Upload error:", error)
    throw new Error(`Failed to upload file: ${error}`)
  }
}

export const getFileUrl = async (key: string, expiresIn = 3600) => {
  console.log('key', key)
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  const url =  await getSignedUrl(client, command, { expiresIn })
  return url
}
export const deleteFile = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  const response = await client.send(command)
  return response
}

export const getFileMetadata = async (key: string) => {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  const response = await client.send(command)
  return {
    size: response.ContentLength,
    lastModified: response.LastModified,
    contentType: response.ContentType,
    etag: response.ETag,
  }
}
