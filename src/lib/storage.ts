import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

/**
 * S3 object storage for user uploads (event covers, documents).
 * Objects land under uploads/<orgId>/ and are public-read via bucket policy;
 * writes require the app's IAM credentials.
 */

const REGION = process.env.AWS_REGION || 'ap-south-1'
const BUCKET = process.env.S3_BUCKET_NAME || ''

let client: S3Client | null = null
function s3(): S3Client {
  if (!BUCKET) {
    throw new Error('S3_BUCKET_NAME is not set — file uploads are not configured')
  }
  if (!client) client = new S3Client({ region: REGION })
  return client
}

export function publicUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}

export const UPLOAD_CATEGORIES = ['leads', 'admissions', 'events', 'campaigns', 'students', 'documents'] as const
export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number]

export async function uploadObject(opts: {
  orgId: string
  fileName: string
  contentType: string
  body: Buffer
  /** module folder inside the org's space; defaults to documents */
  category?: UploadCategory
}): Promise<{ key: string; url: string }> {
  const ext = (opts.fileName.split('.').pop() || 'bin').toLowerCase()
  const category = opts.category ?? 'documents'
  const key = `uploads/${opts.orgId}/${category}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`

  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  )

  return { key, url: publicUrl(key) }
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
