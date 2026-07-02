import { PrismaClient } from '@prisma/client'
import { SUPPORTED_CITIES } from '../../src/hooks/useLocation'
import { CITY_AREAS } from '../../src/constants/locationAreas'

const prisma = new PrismaClient()

const CITY_CENTERS: Record<string, { lat: number; lng: number; state: string; zipPrefix: string }> = {
  Chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', zipPrefix: '60000' },
  Bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka', zipPrefix: '56000' },
  Hyderabad: { lat: 17.3850, lng: 78.4867, state: 'Telangana', zipPrefix: '50000' },
  Mumbai: { lat: 19.0760, lng: 72.8777, state: 'Maharashtra', zipPrefix: '40000' },
  'New Delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi', zipPrefix: '11000' },
  Pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra', zipPrefix: '41100' },
  Coimbatore: { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu', zipPrefix: '64100' },
  Madurai: { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu', zipPrefix: '62500' },
  Kochi: { lat: 9.9312, lng: 76.2673, state: 'Kerala', zipPrefix: '68200' },
  Jaipur: { lat: 26.9124, lng: 75.7873, state: 'Rajasthan', zipPrefix: '30200' }
}

const SCHOOL_NAMES = [
  "Brightpath Academy",
  "Greenwood International School",
  "Silver Oak Global School",
  "Summit Public School",
  "Vanguard Convent School",
  "St. Xavier's Secondary School",
  "Apex Collegiate Academy",
  "Oakridge School"
]

const LC_NAMES = [
  "Starlight Dance Studio",
  "Ignite Music Academy",
  "Creative Hands Art Hub",
  "Maestro Guitar Institute",
  "Genius Minds Coaching",
  "Ace Sports Academy",
  "Excel Coding Lab"
]

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'International']
const LC_CATEGORIES = ['MUSIC', 'DANCE', 'ART', 'ABACUS', 'COACHING', 'SPORTS', 'LANGUAGE', 'STEM', 'OTHER']

function slugify(text: string): string {
  const rand = Math.random().toString(36).substring(2, 7)
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
  return `${slug}-${rand}`
}

async function main() {
  console.log('Checking for existing dummy marketplace records...')
  const existingCount = await prisma.school.count({
    where: { isDummy: true }
  })

  if (existingCount > 0) {
    console.warn(`WARNING: Found ${existingCount} existing dummy school records. Skipping seed script to prevent duplicate inserts.`)
    return
  }

  console.log('Starting seed script for dummy marketplace data...')

  let orgsCreated = 0
  let schoolsCreated = 0
  const citySummary: Record<string, { schools: number; lcs: number }> = {}

  for (const city of SUPPORTED_CITIES) {
    citySummary[city] = { schools: 0, lcs: 0 }
    const center = CITY_CENTERS[city] || { lat: 12.0, lng: 80.0, state: 'India', zipPrefix: '10000' }
    const areas = CITY_AREAS[city] || ['Main Town']

    // 1. Create 4 dummy schools
    for (let i = 0; i < 4; i++) {
      const area = areas[i % areas.length]
      const name = `${city} ${SCHOOL_NAMES[i % SCHOOL_NAMES.length]}`
      const slug = slugify(name)
      const email = `contact@${slug}.com`
      const phone = `98765${Math.floor(10000 + Math.random() * 90000)}`

      // Create Organization
      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          institutionType: 'SCHOOL',
          email,
          phone,
          status: 'ACTIVE',
          isDummy: true
        }
      })
      orgsCreated++

      // Create School
      const school = await prisma.school.create({
        data: {
          orgId: org.id,
          name,
          slug,
          institutionType: 'SCHOOL',
          isVerified: true,
          isPublished: true,
          verificationStatus: 'VERIFIED',
          isDummy: true
        }
      })
      schoolsCreated++
      citySummary[city].schools++

      // Create Location
      const latOffset = (Math.random() - 0.5) * 0.04
      const lngOffset = (Math.random() - 0.5) * 0.04
      await prisma.schoolLocation.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          addressLine: `${i + 1}0, ${area} Main Road, ${area}`,
          city,
          state: center.state,
          pincode: `${center.zipPrefix}${i + 1}`,
          latitude: center.lat + latOffset,
          longitude: center.lng + lngOffset,
          isPrimary: true
        }
      })

      // Create Affiliation
      const board = BOARDS[i % BOARDS.length]
      await prisma.schoolAffiliation.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          board
        }
      })
    }

    // 2. Create 3 dummy learning centers
    for (let i = 0; i < 3; i++) {
      const area = areas[(i + 4) % areas.length]
      const name = `${city} ${LC_NAMES[i % LC_NAMES.length]}`
      const slug = slugify(name)
      const email = `info@${slug}.org`
      const phone = `87654${Math.floor(10000 + Math.random() * 90000)}`
      const centerCategory = LC_CATEGORIES[i % LC_CATEGORIES.length]

      // Create Organization
      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          institutionType: 'LEARNING_CENTER',
          email,
          phone,
          status: 'ACTIVE',
          isDummy: true,
          centerCategory
        }
      })
      orgsCreated++

      // Create School
      const school = await prisma.school.create({
        data: {
          orgId: org.id,
          name,
          slug,
          institutionType: 'LEARNING_CENTER',
          isVerified: true,
          isPublished: true,
          verificationStatus: 'VERIFIED',
          isDummy: true,
          centerCategory
        }
      })
      schoolsCreated++
      citySummary[city].lcs++

      // Create Location
      const latOffset = (Math.random() - 0.5) * 0.04
      const lngOffset = (Math.random() - 0.5) * 0.04
      await prisma.schoolLocation.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          addressLine: `Building ${i + 5}, ${area} Sector 2`,
          city,
          state: center.state,
          pincode: `${center.zipPrefix}${i + 5}`,
          latitude: center.lat + latOffset,
          longitude: center.lng + lngOffset,
          isPrimary: true
        }
      })
    }
  }

  console.log('=== SEED COMPLETED SUCCESSFULLY ===')
  console.log(`Total Organizations Created: ${orgsCreated}`)
  console.log(`Total Schools/Centers Created: ${schoolsCreated}`)
  console.log('Breakdown by City and Type:')
  console.table(citySummary)
}

main()
  .catch((e) => {
    console.error('Seed execution failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
