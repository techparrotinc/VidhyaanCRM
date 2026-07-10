// One-off: seed clearly-marked TEST reviews for a learning centre so the
// profile page pagination/histogram/sort can be exercised with volume.
// Creates fake parents (phones 99998010xx, names "Test Parent NN") + reviews.
// Cleanup: npx tsx scripts/seed-test-reviews.ts --cleanup
// Usage:   npx tsx scripts/seed-test-reviews.ts [--slug seven-notes-1] [--count 25]

import { prisma } from '../src/lib/db/client'

const PHONE_BASE = 9999801000 // fake range, clearly outside real numbers

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

// LEARNING_CENTER registry slugs
const LC_SLUGS = ['teaching', 'personalAttention', 'results', 'studyMaterial', 'feeValue']

const TITLES: [number, string, string][] = [
  // [rating, title, body]
  [5, 'Excellent tutors and personal care', 'TEST REVIEW — My child improved a lot within 3 months. Tutors give individual attention and share progress every week.'],
  [5, 'Best music classes in the area', 'TEST REVIEW — Structured curriculum and very patient teachers. Worth every rupee.'],
  [5, 'Great results in a short time', 'TEST REVIEW — Cleared grade exam with distinction. The practice material is really good.'],
  [4, 'Good teaching, slightly crowded batches', 'TEST REVIEW — Teaching quality is very good but weekend batches can get crowded.'],
  [4, 'Happy with the progress', 'TEST REVIEW — Regular feedback and good study material. Parking is a hassle though.'],
  [4, 'Solid institute, professional staff', 'TEST REVIEW — Well organised classes and timely communication. Fee is on the higher side.'],
  [3, 'Average experience so far', 'TEST REVIEW — Teaching is decent but classes get rescheduled often. Expected more personal attention.'],
  [3, 'Okay for beginners', 'TEST REVIEW — Good for basics; advanced students may need something more rigorous.'],
  [2, 'Communication needs improvement', 'TEST REVIEW — Hard to reach the coordinator, schedule changes announced late.'],
  [1, 'Disappointed with batch management', 'TEST REVIEW — Frequent teacher changes disrupted my child’s progress.'],
]

const PROS_POOL = [['Great tutors'], ['Flexible timings'], ['Good study material'], ['Individual attention'], [], ['Clean facility']]
const CONS_POOL = [['Limited parking'], ['Crowded weekend batches'], [], ['Fee slightly high'], ['Schedule changes']]

async function main() {
  const slug = arg('slug') ?? 'seven-notes-1'
  const count = Math.min(30, Math.max(1, parseInt(arg('count') ?? '25')))
  const cleanup = process.argv.includes('--cleanup')

  const school = await prisma.school.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { id: true, orgId: true, slug: true },
  })
  if (!school) throw new Error(`School not found: ${slug}`)

  if (cleanup) {
    const parents = await prisma.parent.findMany({
      where: { name: { startsWith: 'Test Parent ' }, phone: { startsWith: '99998010' } },
      select: { id: true },
    })
    const ids = parents.map((p) => p.id)
    const del = await prisma.schoolReview.deleteMany({
      where: { schoolId: school.id, parentId: { in: ids } },
    })
    // remove seeded parents only if they have no other data
    await prisma.parent.deleteMany({
      where: {
        id: { in: ids },
        enquiries: { none: {} },
        applications: { none: {} },
        reviews: { none: {} },
      },
    })
    console.log(`Cleanup: removed ${del.count} test reviews for ${school.slug}`)
  } else {
    let created = 0
    for (let i = 1; i <= count; i++) {
      const phone = String(PHONE_BASE + i)
      const t = TITLES[i % TITLES.length]
      const rating = t[0]

      const parent = await prisma.parent.upsert({
        where: { phone },
        update: {},
        create: { phone, name: `Test Parent ${String(i).padStart(2, '0')}`, city: 'Chennai' },
      })

      const exists = await prisma.schoolReview.findFirst({
        where: { parentId: parent.id, schoolId: school.id },
        select: { id: true },
      })
      if (exists) continue

      // sub-ratings hover around the overall rating, clamped 1..5
      const subRatings: Record<string, number> = {}
      LC_SLUGS.forEach((s, idx) => {
        const jitter = ((i + idx) % 3) - 1 // -1..1
        subRatings[s] = Math.min(5, Math.max(1, rating + jitter))
      })

      const daysAgo = (i * 7) % 180 // spread over ~6 months
      await prisma.schoolReview.create({
        data: {
          schoolId: school.id,
          orgId: school.orgId,
          parentId: parent.id,
          rating,
          subRatings,
          title: t[1],
          body: t[2],
          pros: PROS_POOL[i % PROS_POOL.length],
          cons: CONS_POOL[i % CONS_POOL.length],
          isVerifiedAdmission: i % 4 === 0, // sprinkle some verified badges
          status: 'PUBLISHED',
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        },
      })
      created++
    }
    console.log(`Seeded ${created} test reviews on ${school.slug}`)
  }

  // recompute denormalized aggregate either way
  const agg = await prisma.schoolReview.aggregate({
    where: { schoolId: school.id, status: 'PUBLISHED', deletedAt: null },
    _avg: { rating: true },
    _count: { _all: true },
  })
  await prisma.school.update({
    where: { id: school.id },
    data: {
      avgRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count._all,
    },
  })
  console.log(`School aggregate: avg=${Math.round((agg._avg.rating ?? 0) * 10) / 10} count=${agg._count._all}`)
}

main().finally(() => prisma.$disconnect())
