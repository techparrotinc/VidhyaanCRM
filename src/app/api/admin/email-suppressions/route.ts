import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { resolveAdminUser } from '@/lib/admin-auth'

// unsuppressEmail() has existed in src/lib/email/suppression.ts with zero
// callers — a hard bounce (mailbox full, transient block, or a bounce that
// turns out to be misclassified) had no way to be reversed short of a manual
// DB edit. This is the missing admin surface for it.

export async function GET(req: NextRequest) {
  const admin = await resolveAdminUser(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim().toLowerCase()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
  const limit = 25
  const where = search ? { email: { contains: search } } : {}

  const [rows, total] = await Promise.all([
    prisma.emailSuppression.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.emailSuppression.count({ where })
  ])

  return NextResponse.json({ success: true, data: rows, total, page, totalPages: Math.ceil(total / limit) })
}

export async function DELETE(req: NextRequest) {
  const admin = await resolveAdminUser(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = z.object({ email: z.string().email().max(200) }).safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  const { unsuppressEmail } = await import('@/lib/email/suppression')
  await unsuppressEmail(parsed.data.email)

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'DELETE',
      entityType: 'EmailSuppression',
      entityId: parsed.data.email.trim().toLowerCase(),
      after: { event: 'unsuppressed_by_admin' }
    }
  }).catch(e => console.error('Failed to audit-log unsuppress:', e))

  return NextResponse.json({ success: true })
}
