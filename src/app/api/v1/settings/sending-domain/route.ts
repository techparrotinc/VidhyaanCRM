import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { createDomainIdentity, getDomainIdentity, sesConfigured } from '@/lib/integrations/ses'

// BYO custom sending domain — Enterprise-only. Lets an org send campaigns From
// their own SES-verified domain instead of the shared send.vidhyaan.com.

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i

const createSchema = z.object({
  domain: z.string().trim().toLowerCase().max(253).regex(DOMAIN_RE, 'Enter a valid domain'),
  fromLocalPart: z.string().trim().max(64).regex(/^[a-z0-9._-]+$/i, 'Invalid local part').default('no-reply'),
  fromName: z.string().trim().max(120).optional().nullable(),
})

async function assertEnterprise(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { plan: true },
  })
  if ((org?.plan?.slug ?? '').toLowerCase() !== 'enterprise') {
    throw Errors.businessRule('A custom sending domain is available on the Enterprise plan only.')
  }
}

/** Shape the stored row + DNS records the user must publish. */
function present(row: {
  domain: string
  fromLocalPart: string
  fromName: string | null
  status: string
  dkimTokens: string[]
  verifiedAt: Date | null
  lastCheckedAt: Date | null
} | null) {
  if (!row) return { configured: false }
  const dkim = row.dkimTokens.map((t) => ({
    type: 'CNAME',
    name: `${t}._domainkey.${row.domain}`,
    value: `${t}.dkim.amazonses.com`,
  }))
  return {
    configured: true,
    domain: row.domain,
    fromLocalPart: row.fromLocalPart,
    fromName: row.fromName,
    fromEmail: `${row.fromLocalPart}@${row.domain}`,
    status: row.status,
    verifiedAt: row.verifiedAt,
    lastCheckedAt: row.lastCheckedAt,
    dnsRecords: [
      ...dkim,
      { type: 'TXT', name: row.domain, value: 'v=spf1 include:amazonses.com ~all' },
      { type: 'TXT', name: `_dmarc.${row.domain}`, value: 'v=DMARC1; p=quarantine;' },
    ],
  }
}

export const GET = route({
  handler: async ({ user }) => {
    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      include: { plan: true },
    })
    const eligible = (org?.plan?.slug ?? '').toLowerCase() === 'enterprise'
    const row = await prisma.orgSendingDomain.findFirst({
      where: { orgId: user.orgId, deletedAt: null },
    })
    return ok({ eligible, ...present(row) })
  },
})

// Register (or re-register) the domain as an SES identity and return DNS records.
export const POST = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, user }) => {
    await assertEnterprise(user.orgId)
    if (!sesConfigured()) throw Errors.businessRule('Email sending is not configured. Contact support.')
    const body = createSchema.parse(await req.json())

    // Register with SES → DKIM tokens. If the identity already exists, read it.
    let dkimTokens: string[] = []
    try {
      const res = await createDomainIdentity(body.domain)
      dkimTokens = res.dkimTokens
    } catch {
      const existing = await getDomainIdentity(body.domain).catch(() => null)
      if (!existing) throw Errors.businessRule('Could not register the domain with the email provider. Check the domain and try again.')
      dkimTokens = existing.dkimTokens
    }

    const row = await prisma.orgSendingDomain.upsert({
      where: { orgId: user.orgId },
      create: {
        orgId: user.orgId,
        domain: body.domain,
        fromLocalPart: body.fromLocalPart,
        fromName: body.fromName ?? null,
        status: 'PENDING',
        dkimTokens,
        createdById: user.id,
      },
      update: {
        domain: body.domain,
        fromLocalPart: body.fromLocalPart,
        fromName: body.fromName ?? null,
        status: 'PENDING',
        dkimTokens,
        verifiedAt: null,
        deletedAt: null,
      },
    })
    return ok(present(row))
  },
})

// Poll SES for verification status.
export const PATCH = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    await assertEnterprise(user.orgId)
    const row = await prisma.orgSendingDomain.findFirst({
      where: { orgId: user.orgId, deletedAt: null },
    })
    if (!row) throw Errors.notFound('Sending domain')

    const check = await getDomainIdentity(row.domain).catch(() => null)
    const verified = !!check?.verified
    const updated = await prisma.orgSendingDomain.update({
      where: { id: row.id },
      data: {
        status: verified ? 'VERIFIED' : 'PENDING',
        verifiedAt: verified ? (row.verifiedAt ?? new Date()) : null,
        lastCheckedAt: new Date(),
        // SES may rotate tokens if re-created — keep them fresh.
        dkimTokens: check?.dkimTokens?.length ? check.dkimTokens : row.dkimTokens,
      },
    })
    return ok({ ...present(updated), dkimStatus: check?.dkimStatus ?? 'UNKNOWN' })
  },
})

export const DELETE = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    await prisma.orgSendingDomain.updateMany({
      where: { orgId: user.orgId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'FAILED' },
    })
    return ok({ success: true })
  },
})
