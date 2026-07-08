import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { forOrg, OrgScopedClient } from '@/lib/db/tenant'

// Integration tests against the DATABASE_URL database. Seeds one throwaway
// org (isDummy) with two branches + leads per branch + one legacy null-branch
// lead, asserts the branch-scoped client clamps reads/writes/creates to the
// branch context, then hard-deletes everything it created.

const RUN = `branch-test-${Date.now()}`

let orgId: string
let branchA: string
let branchB: string
let leadA: string
let leadB: string
let leadNull: string
let dbA: OrgScopedClient // scoped to branch A
let dbAll: OrgScopedClient // no branch context — legacy behaviour

beforeAll(async () => {
  const org = await prisma.organization.create({
    data: {
      name: RUN,
      slug: RUN,
      institutionType: 'SCHOOL',
      email: `admin@${RUN}.local`,
      phone: '0000000000',
      isDummy: true
    }
  })
  orgId = org.id

  const [a, b] = await Promise.all([
    prisma.branch.create({ data: { orgId, name: `${RUN}-A`, isDefault: true } }),
    prisma.branch.create({ data: { orgId, name: `${RUN}-B` } })
  ])
  branchA = a.id
  branchB = b.id

  const [la, lb, ln] = await Promise.all([
    prisma.lead.create({
      data: { orgId, branchId: branchA, parentName: 'Branch A Parent', phone: '1111111111', leadCode: `${RUN}-A` }
    }),
    prisma.lead.create({
      data: { orgId, branchId: branchB, parentName: 'Branch B Parent', phone: '2222222222', leadCode: `${RUN}-B` }
    }),
    prisma.lead.create({
      data: { orgId, parentName: 'Legacy Parent', phone: '3333333333', leadCode: `${RUN}-N` }
    })
  ])
  leadA = la.id
  leadB = lb.id
  leadNull = ln.id

  dbA = forOrg(orgId, { branchIds: [branchA], activeBranchId: branchA })
  dbAll = forOrg(orgId)
})

afterAll(async () => {
  // orgId guard: undefined in a where clause drops the filter — deleteMany
  // would wipe the whole table if beforeAll died before assignment.
  if (orgId) {
    await prisma.lead.deleteMany({ where: { orgId } })
    await prisma.branch.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

describe('branch-scoped reads', () => {
  it('findMany excludes the sibling branch but includes legacy null rows', async () => {
    const leads = await dbA.lead.findMany()
    const ids = leads.map(l => l.id)
    expect(ids).toContain(leadA)
    expect(ids).toContain(leadNull)
    expect(ids).not.toContain(leadB)
  })

  it('findUnique blocks a cross-branch id', async () => {
    const lead = await dbA.lead.findUnique({ where: { id: leadB } })
    expect(lead).toBeNull()
  })

  it('count matches the branch view', async () => {
    const n = await dbA.lead.count()
    expect(n).toBe(2) // branch A + legacy
  })

  it('branch filter survives a caller-supplied OR (merged via AND)', async () => {
    const leads = await dbA.lead.findMany({
      where: { OR: [{ phone: '1111111111' }, { phone: '2222222222' }] }
    })
    expect(leads.map(l => l.id)).toEqual([leadA])
  })

  it('empty grant set fails closed to legacy rows only', async () => {
    const dbNone = forOrg(orgId, { branchIds: [], activeBranchId: null })
    const leads = await dbNone.lead.findMany()
    expect(leads.map(l => l.id)).toEqual([leadNull])
  })
})

describe('branch-scoped writes', () => {
  it('create stamps the active branch', async () => {
    const lead = await dbA.lead.create({
      data: { orgId, parentName: 'Stamped', phone: '4444444444', leadCode: `${RUN}-S` }
    })
    expect(lead.branchId).toBe(branchA)
    await prisma.lead.delete({ where: { id: lead.id } })
  })

  it('create respects an explicit caller branchId', async () => {
    const lead = await dbA.lead.create({
      data: { orgId, parentName: 'Explicit', phone: '5555555555', leadCode: `${RUN}-E`, branchId: branchB }
    })
    expect(lead.branchId).toBe(branchB)
    await prisma.lead.delete({ where: { id: lead.id } })
  })

  it('update cannot touch a sibling-branch row', async () => {
    await expect(
      dbA.lead.update({ where: { id: leadB }, data: { parentName: 'Hacked' } })
    ).rejects.toThrow()
    const untouched = await prisma.lead.findUnique({ where: { id: leadB } })
    expect(untouched?.parentName).toBe('Branch B Parent')
  })

  it('updateMany only reaches own-branch + legacy rows', async () => {
    const res = await dbA.lead.updateMany({ data: { kidName: 'touched' } })
    expect(res.count).toBe(2)
    const b = await prisma.lead.findUnique({ where: { id: leadB } })
    expect(b?.kidName).toBeNull()
    await prisma.lead.updateMany({ where: { orgId }, data: { kidName: null } })
  })
})

describe('no branch context — legacy behaviour unchanged', () => {
  it('sees every branch and legacy rows', async () => {
    const leads = await dbAll.lead.findMany()
    expect(leads.map(l => l.id).sort()).toEqual([leadA, leadB, leadNull].sort())
  })

  it('create does not stamp a branch', async () => {
    const lead = await dbAll.lead.create({
      data: { orgId, parentName: 'Unstamped', phone: '6666666666', leadCode: `${RUN}-U` }
    })
    expect(lead.branchId).toBeNull()
    await prisma.lead.delete({ where: { id: lead.id } })
  })
})
