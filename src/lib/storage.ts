import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { getStorageConfig, type StorageConfig } from '@/lib/platform-config'

/**
 * S3-compatible object storage for user uploads (event covers, documents).
 * Objects land under uploads/<orgId>/ and are public-read via bucket policy.
 *
 * Config comes from the platform-config resolver: admin-portal values override
 * env, and when nothing is set in the DB it falls back to the same env vars as
 * before (AWS_REGION / S3_BUCKET_NAME + default credential chain), so behaviour
 * is unchanged until an admin configures storage. Supports AWS S3 and
 * S3-compatible providers (DigitalOcean Spaces) via an optional endpoint.
 */

let cached: { sig: string; client: S3Client } | null = null

function clientFor(cfg: StorageConfig): S3Client {
  const sig = `${cfg.region}|${cfg.endpoint ?? ''}|${cfg.accessKeyId ?? ''}`
  if (cached && cached.sig === sig) return cached.client
  const endpoint = cfg.endpoint
    ? cfg.endpoint.startsWith('http')
      ? cfg.endpoint
      : `https://${cfg.endpoint}`
    : undefined
  const client = new S3Client({
    region: cfg.region,
    ...(endpoint ? { endpoint } : {}),
    // Only pass explicit credentials when configured; otherwise fall back to
    // the SDK default provider chain (IAM role / env), matching prior behaviour.
    ...(cfg.accessKeyId && cfg.secretAccessKey
      ? { credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey } }
      : {}),
  })
  cached = { sig, client }
  return client
}

function publicUrl(key: string, cfg: StorageConfig): string {
  if (cfg.cdnUrl) return `${cfg.cdnUrl.replace(/\/+$/, '')}/${key}`
  if (cfg.endpoint) {
    const host = cfg.endpoint.replace(/^https?:\/\//, '')
    return `https://${cfg.bucket}.${host}/${key}`
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`
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
  const cfg = await getStorageConfig()
  if (!cfg.bucket) {
    throw new Error('Storage bucket is not configured — set S3_BUCKET_NAME or configure Storage in admin settings')
  }
  const ext = (opts.fileName.split('.').pop() || 'bin').toLowerCase()
  const category = opts.category ?? 'documents'
  const key = `uploads/${opts.orgId}/${category}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`

  await clientFor(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  return { key, url: publicUrl(key, cfg) }
}

export async function deleteObject(key: string): Promise<void> {
  const cfg = await getStorageConfig()
  if (!cfg.bucket) return
  await clientFor(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }))
}
