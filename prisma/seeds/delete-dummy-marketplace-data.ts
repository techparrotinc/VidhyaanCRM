import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding all dummy school records to purge...')
  
  const dummySchools = await prisma.school.findMany({
    where: { isDummy: true },
    select: { id: true, orgId: true }
  })

  if (dummySchools.length === 0) {
    console.log('No dummy school records found. Nothing to delete.')
    return
  }

  const schoolIds = dummySchools.map((s) => s.id)
  const orgIds = dummySchools.map((s) => s.orgId).filter(Boolean) as string[]

  console.log(`Found ${schoolIds.length} dummy schools. Starting deletion process...`)

  const [
    locationsDeleted,
    affiliationsDeleted,
    facilitiesDeleted,
    contactsDeleted,
    mediaDeleted,
    feeRangesDeleted,
    accreditationsDeleted,
    hoursDeleted,
    viewsDeleted,
    reviewsDeleted
  ] = await prisma.$transaction([
    prisma.schoolLocation.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolAffiliation.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolFacility.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolContact.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolMedia.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolFeeRange.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolAccreditation.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolHours.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolView.deleteMany({ where: { schoolId: { in: schoolIds } } }),
    prisma.schoolReview.deleteMany({ where: { schoolId: { in: schoolIds } } })
  ])

  const schoolsDeletedCount = await prisma.school.deleteMany({
    where: { id: { in: schoolIds } }
  })

  const orgsDeletedCount = await prisma.organization.deleteMany({
    where: { id: { in: orgIds } }
  })

  console.log('=== CLEANUP COMPLETED SUCCESSFULLY ===')
  console.log(`Deleted Locations: ${locationsDeleted.count}`)
  console.log(`Deleted Affiliations: ${affiliationsDeleted.count}`)
  console.log(`Deleted Facilities: ${facilitiesDeleted.count}`)
  console.log(`Deleted Contacts: ${contactsDeleted.count}`)
  console.log(`Deleted Media: ${mediaDeleted.count}`)
  console.log(`Deleted Fee Ranges: ${feeRangesDeleted.count}`)
  console.log(`Deleted Accreditations: ${accreditationsDeleted.count}`)
  console.log(`Deleted Hours: ${hoursDeleted.count}`)
  console.log(`Deleted Views: ${viewsDeleted.count}`)
  console.log(`Deleted Reviews: ${reviewsDeleted.count}`)
  console.log(`Total Schools Purged: ${schoolsDeletedCount.count}`)
  console.log(`Total Organizations Purged: ${orgsDeletedCount.count}`)
}

main()
  .catch((e) => {
    console.error('Cleanup execution failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
