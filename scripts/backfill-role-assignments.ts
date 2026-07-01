import { prisma } from '@/lib/db/client'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`Starting UserRoleAssignment backfill (dryRun = ${dryRun})...`)

  const users = await prisma.user.findMany()

  let totalProcessed = 0
  let totalCreated = 0
  let skipNoRole = 0
  let skipOrphanedOrg = 0
  let skipAlreadyExists = 0

  for (const user of users) {
    try {
      totalProcessed++

      // a) Skip if no role
      if (!user.role) {
        console.log(`SKIP [userId=${user.id}, phone=${user.phone}]: no role set`)
        skipNoRole++
        continue
      }

      // b) Skip if orphaned orgId
      if (user.orgId) {
        const org = await prisma.organization.findUnique({
          where: { id: user.orgId }
        })
        if (!org) {
          console.log(`SKIP [userId=${user.id}, phone=${user.phone}]: orgId ${user.orgId} does not exist`)
          skipOrphanedOrg++
          continue
        }
      }

      // c) Check if assignment already exists
      const existingAssignment = await prisma.userRoleAssignment.findFirst({
        where: {
          userId: user.id,
          role: user.role,
          orgId: user.orgId ?? null
        }
      })

      if (existingAssignment) {
        console.log(`SKIP [userId=${user.id}, phone=${user.phone}]: assignment already exists`)
        skipAlreadyExists++
        continue
      }

      // Eligible for backfill - create or log dry-run action
      if (dryRun) {
        console.log(`CREATE [userId=${user.id}, phone=${user.phone}]: role=${user.role} orgId=${user.orgId ?? 'null'} (DRY RUN)`)
      } else {
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            role: user.role,
            orgId: user.orgId ?? null,
            status: 'ACTIVE',
            isDefault: true,
            lastUsedAt: null
          }
        })
        console.log(`CREATE [userId=${user.id}, phone=${user.phone}]: role=${user.role} orgId=${user.orgId ?? 'null'}`)
      }
      totalCreated++

    } catch (error: any) {
      console.error(`ERROR processing user [userId=${user.id}, phone=${user.phone || 'null'}]:`, error.message || error)
    }
  }

  console.log('\n=== BACKFILL SUMMARY ===')
  console.log(`Total users processed: ${totalProcessed}`)
  console.log(`Total created (${dryRun ? 'dry-run' : 'actual'}): ${totalCreated}`)
  console.log(`Total skipped: ${skipNoRole + skipOrphanedOrg + skipAlreadyExists}`)
  console.log(`  - No role: ${skipNoRole}`)
  console.log(`  - Orphaned orgId: ${skipOrphanedOrg}`)
  console.log(`  - Already exists: ${skipAlreadyExists}`)
}

main()
  .catch((e) => {
    console.error('Fatal backfill script error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
