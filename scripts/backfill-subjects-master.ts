// Backfill the Subject master. Per org: (1) turn every distinct
// TimetableSlot.subject string already in use into a Subject row; (2) for
// school-type orgs that still have no subjects, seed a standard set so the
// timetable dropdown isn't empty. Idempotent — upserts on (orgId, name).
// Usage: npx tsx scripts/backfill-subjects-master.ts [--org <orgId>] [--dry]
import { prisma } from '../src/lib/db/client'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`)

const SEED = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer', 'Art', 'PE']
const SCHOOL_TYPES = ['SCHOOL', 'JUNIOR_COLLEGE']

async function main() {
  const orgFilter = arg('org')
  const dry = hasFlag('dry')

  const orgs = await prisma.organization.findMany({
    where: { ...(orgFilter ? { id: orgFilter } : {}) },
    select: { id: true, name: true, institutionType: true }
  })

  let totalUpserts = 0
  for (const org of orgs) {
    // Distinct subject strings already used in this org's timetable.
    const slotSubjects = await prisma.timetableSlot.findMany({
      where: { orgId: org.id, subject: { not: '' } },
      distinct: ['subject'],
      select: { subject: true }
    })
    const existing = await prisma.subject.findMany({
      where: { orgId: org.id },
      select: { name: true }
    })
    const have = new Set(existing.map(s => s.name.toLowerCase()))

    const names: string[] = []
    for (const s of slotSubjects) {
      const n = (s.subject ?? '').trim()
      if (n && !have.has(n.toLowerCase())) {
        names.push(n)
        have.add(n.toLowerCase())
      }
    }

    // Seed the standard set only for school-type orgs that would otherwise be empty.
    const wouldBeEmpty = existing.length === 0 && names.length === 0
    if (wouldBeEmpty && SCHOOL_TYPES.includes(org.institutionType)) {
      for (const n of SEED) {
        if (!have.has(n.toLowerCase())) {
          names.push(n)
          have.add(n.toLowerCase())
        }
      }
    }

    if (names.length === 0) continue
    console.log(`${org.name} [${org.institutionType}]: +${names.length} → ${names.join(', ')}`)
    if (dry) continue

    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      const seedIdx = SEED.findIndex(s => s.toLowerCase() === name.toLowerCase())
      await prisma.subject.upsert({
        where: { orgId_name: { orgId: org.id, name } },
        create: { orgId: org.id, name, sortOrder: seedIdx >= 0 ? seedIdx : 100 + i },
        update: {}
      })
      totalUpserts++
    }
  }

  console.log(dry ? '\nDry run — nothing written.' : `\nDone. ${totalUpserts} subject rows ensured.`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
