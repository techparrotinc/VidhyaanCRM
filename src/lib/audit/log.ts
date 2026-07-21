import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'

/**
 * Unified audit emission for critical CRUD across the CRM. This is THE entry
 * point for org-attributed activity logging — prefer it over hand-rolled
 * `prisma.auditLog.create` calls so every mutation captures the same shape
 * (actor, entity, before/after, request metadata).
 *
 * Fire-and-forget: never throws into the caller, never blocks the response.
 * `auditLog` lives in the `platform` schema and is not tenant-scoped, so it is
 * written with the base client, with orgId passed explicitly.
 */
export interface LogAuditInput {
  orgId: string
  userId: string | null
  action: AuditAction
  /** Logical record type, e.g. 'LEAD', 'STUDENT', 'INVOICE'. */
  entityType: string
  entityId?: string | null
  /** Snapshot before the change (for update/delete/void). */
  before?: unknown
  /** Snapshot after the change (for create/update), or event metadata. */
  after?: unknown
  /** Pass the request to capture IP + user agent. */
  req?: NextRequest | null
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip')
}

export function logAudit(input: LogAuditInput): void {
  const { req, before, after, entityId, ...rest } = input
  prisma.auditLog
    .create({
      data: {
        ...rest,
        entityId: entityId ?? null,
        before: (before ?? undefined) as any,
        after: (after ?? undefined) as any,
        ipAddress: req ? clientIp(req) : null,
        userAgent: req ? req.headers.get('user-agent') : null,
      },
    })
    .catch((err) => console.error('[audit] write failed:', rest.entityType, rest.action, err))
}

/** Convenience: strip noisy/large fields from a record before snapshotting. */
export function auditSnapshot<T extends Record<string, any>>(
  row: T,
  keys: (keyof T)[]
): Partial<T> {
  const out: Partial<T> = {}
  for (const k of keys) if (row[k] !== undefined) out[k] = row[k]
  return out
}
