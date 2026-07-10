import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { forOrg, OrgScopedClient } from '@/lib/db/tenant'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL) // no test DB -> skip, never touch prod

// Integration tests against the DATABASE_URL database. Seeds two throwaway
// orgs (isDummy) with leads, asserts the tenant-scoped client never reads or
// writes across the boundary, then hard-deletes everything it created.

const RUN = `tenant-test-${Date.now()}`

let orgA: string
let orgB: string
let leadA: string
let leadB: string
let db: OrgScopedClient

async function createOrg(suffix: string) {
  const org = await prisma.organization.create({
    data: {
      name: `${RUN}-${suffix}`,
      slug: `${RUN}-${suffix}`,
      institutionType: 'SCHOOL',
      email: `${suffix}@tenant-test.local`,
      phone: '0000000000',
      isDummy: true
    }
  })
  return org.id
}

beforeAll(async () => {
  orgA = await createOrg('a')
  orgB = await createOrg('b')
  const [la, lb] = await Promise.all([
    prisma.lead.create({
      data: { orgId: orgA, parentName: 'Parent A', phone: '1111111111', leadCode: `${RUN}-A` }
    }),
    prisma.lead.create({
      data: { orgId: orgB, parentName: 'Parent B', phone: '2222222222', leadCode: `${RUN}-B` }
    })
  ])
  leadA = la.id
  leadB = lb.id
  db = forOrg(orgA)
})

afterAll(async () => {
  await prisma.lead.deleteMany({ where: { orgId: { in: [orgA, orgB] } } })
  await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } })
  await prisma.$disconnect()
})

describeDb('reads are org-scoped', () => {
  it('findMany returns only own-org rows', async () => {
    const leads = await db.lead.findMany()
    expect(leads.length).toBeGreaterThan(0)
    expect(leads.every(l => l.orgId === orgA)).toBe(true)
  })

  it('count excludes other orgs', async () => {
    const scoped = await db.lead.count()
    const manual = await prisma.lead.count({ where: { orgId: orgA, deletedAt: null } })
    expect(scoped).toBe(manual)
    const global = await prisma.lead.count()
    expect(global).toBeGreaterThan(scoped)
  })

  it('aggregate excludes other orgs', async () => {
    const agg = await db.lead.aggregate({ _count: { _all: true } })
    const manual = await prisma.lead.count({ where: { orgId: orgA, deletedAt: null } })
    expect(agg._count._all).toBe(manual)
  })

  it('groupBy only yields own org', async () => {
    const groups = await db.lead.groupBy({ by: ['orgId'], _count: true })
    expect(groups.length).toBe(1)
    expect(groups[0].orgId).toBe(orgA)
  })

  it('findUnique blocks cross-org id', async () => {
    expect(await db.lead.findUnique({ where: { id: leadB } })).toBeNull()
    expect(await db.lead.findUnique({ where: { id: leadA } })).not.toBeNull()
  })

  it('findFirst blocks cross-org id', async () => {
    expect(await db.lead.findFirst({ where: { id: leadB } })).toBeNull()
  })

  it('findFirstOrThrow / findUniqueOrThrow reject cross-org id', async () => {
    await expect(db.lead.findFirstOrThrow({ where: { id: leadB } })).rejects.toThrow()
    await expect(db.lead.findUniqueOrThrow({ where: { id: leadB } })).rejects.toThrow()
  })
})

describeDb('writes are org-scoped', () => {
  it('create injects orgId', async () => {
    const lead = await db.lead.create({
      data: { parentName: 'Created', phone: '3333333333', leadCode: `${RUN}-C` } as any
    })
    expect(lead.orgId).toBe(orgA)
  })

  it('update blocks cross-org id', async () => {
    await expect(
      db.lead.update({ where: { id: leadB }, data: { parentName: 'HACKED' } })
    ).rejects.toThrow()
    const untouched = await prisma.lead.findUnique({ where: { id: leadB } })
    expect(untouched?.parentName).toBe('Parent B')
  })

  it('updateMany blocks cross-org rows', async () => {
    const res = await db.lead.updateMany({
      where: { id: leadB },
      data: { parentName: 'HACKED' }
    })
    expect(res.count).toBe(0)
  })

  it('upsert scopes where and stamps orgId on create', async () => {
    const created = await db.lead.upsert({
      where: { id: leadB }, // other org's id → must not match, falls to create
      create: { parentName: 'Upserted', phone: '4444444444', leadCode: `${RUN}-U` } as any,
      update: { parentName: 'HACKED' }
    })
    expect(created.orgId).toBe(orgA)
    expect(created.id).not.toBe(leadB)
    const untouched = await prisma.lead.findUnique({ where: { id: leadB } })
    expect(untouched?.parentName).toBe('Parent B')
  })
})

describeDb('soft delete', () => {
  it('delete rewrites to deletedAt and hides row from scoped reads', async () => {
    const tmp = await db.lead.create({
      data: { parentName: 'Doomed', phone: '5555555555', leadCode: `${RUN}-D` } as any
    })
    await db.lead.delete({ where: { id: tmp.id } })
    const raw = await prisma.lead.findUnique({ where: { id: tmp.id } })
    expect(raw?.deletedAt).toBeInstanceOf(Date)
    expect(await db.lead.findFirst({ where: { id: tmp.id } })).toBeNull()
  })

  it('delete cannot soft-delete a cross-org row', async () => {
    await expect(db.lead.delete({ where: { id: leadB } })).rejects.toThrow()
    const untouched = await prisma.lead.findUnique({ where: { id: leadB } })
    expect(untouched?.deletedAt).toBeNull()
  })

  it('explicit deletedAt filter is preserved (trash view)', async () => {
    const trashed = await db.lead.findMany({ where: { deletedAt: { not: null } } })
    expect(trashed.every(l => l.orgId === orgA)).toBe(true)
    expect(trashed.length).toBeGreaterThan(0) // the row soft-deleted above
  })
})
