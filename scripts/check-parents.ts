import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const parents = await prisma.parent.findMany({
    include: {
      user: {
        include: {
          roleAssignments: true
        }
      },
      enquiries: true,
      applications: true
    }
  })

  console.log(`Found ${parents.length} parents in DB.`)

  // Find Prince Matriculation School
  const school = await prisma.school.findFirst({
    where: { slug: 'prince-matriculation-school' }
  })
  if (!school) {
    console.log('Prince Matriculation School not found!')
    return
  }
  console.log(`Found school: ${school.name} (id: ${school.id})`)

  // 1. Prepare Priya Raman (9884100001) - parent who has an enquiry for Prince Matriculation School
  const priya = parents.find(p => p.phone === '9884100001')
  if (priya) {
    // Check/create User
    let user = await prisma.user.findFirst({ where: { phone: '9884100001' } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: '9884100001',
          name: 'Priya Raman',
          email: 'priya@example.com',
          status: 'ACTIVE'
        }
      })
    }
    await prisma.parent.update({
      where: { id: priya.id },
      data: { userId: user.id }
    })

    // Check/create RoleAssignment
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id, role: UserRole.PARENT, orgId: null }
    })
    if (!assignment) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.PARENT,
          status: 'ACTIVE',
          isDefault: true
        }
      })
    }
    console.log('Verified user & assignment for Priya Raman.')

    // Ensure Priya has an enquiry or application for Prince Matriculation School
    const existingEnquiry = await prisma.parentEnquiry.findFirst({
      where: { parentId: priya.id, schoolId: school.id }
    })
    if (!existingEnquiry) {
      // Create a student/child for Priya first
      let kid = await prisma.kidProfile.findFirst({ where: { parentId: priya.id } })
      if (!kid) {
        kid = await prisma.kidProfile.create({
          data: {
            parentId: priya.id,
            name: 'Priya Child',
            gradeSought: 'Grade 1'
          }
        })
      }
      await prisma.parentEnquiry.create({
        data: {
          parentId: priya.id,
          schoolId: school.id,
          orgId: school.orgId,
          kidName: kid.name,
          gradeSought: kid.gradeSought ?? 'Grade 1',
          status: 'NEW'
        }
      })
      console.log('Created enquiry for Priya Raman.')
    }
  }

  // 2. Prepare Suresh Kumar (9884100002) - parent who has NO enquiries/applications for Prince Matriculation School
  const suresh = parents.find(p => p.phone === '9884100002')
  if (suresh) {
    let user = await prisma.user.findFirst({ where: { phone: '9884100002' } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: '9884100002',
          name: 'Suresh Kumar',
          email: 'suresh@example.com',
          status: 'ACTIVE'
        }
      })
    }
    await prisma.parent.update({
      where: { id: suresh.id },
      data: { userId: user.id }
    })

    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id, role: UserRole.PARENT, orgId: null }
    })
    if (!assignment) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.PARENT,
          status: 'ACTIVE',
          isDefault: true
        }
      })
    }
    console.log('Verified user & assignment for Suresh Kumar.')

    // Ensure Suresh has NO enquiries or applications for Prince Matriculation School
    await prisma.parentEnquiry.deleteMany({
      where: { parentId: suresh.id, schoolId: school.id }
    })
    await prisma.parentApplication.deleteMany({
      where: { parentId: suresh.id, schoolId: school.id }
    })
    console.log('Cleared enquiries/applications for Suresh Kumar.')
  }

  // 3. Prepare Lakshmi Narayan (9884100005) - verified parent with ADMITTED application for Prince Matriculation School
  const lakshmi = parents.find(p => p.phone === '9884100005')
  if (lakshmi) {
    let user = await prisma.user.findFirst({ where: { phone: '9884100005' } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: '9884100005',
          name: 'Lakshmi Narayan',
          email: 'lakshmi@example.com',
          status: 'ACTIVE'
        }
      })
    }
    await prisma.parent.update({
      where: { id: lakshmi.id },
      data: { userId: user.id }
    })

    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id, role: UserRole.PARENT, orgId: null }
    })
    if (!assignment) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.PARENT,
          status: 'ACTIVE',
          isDefault: true
        }
      })
    }
    console.log('Verified user & assignment for Lakshmi Narayan.')

    // Ensure Lakshmi has an ADMITTED application for Prince Matriculation School
    const existingApp = await prisma.parentApplication.findFirst({
      where: { parentId: lakshmi.id, schoolId: school.id }
    })
    if (!existingApp) {
      let kid = await prisma.kidProfile.findFirst({ where: { parentId: lakshmi.id } })
      if (!kid) {
        kid = await prisma.kidProfile.create({
          data: {
            parentId: lakshmi.id,
            name: 'Lakshmi Child',
            gradeSought: 'Grade 2'
          }
        })
      }
      await prisma.parentApplication.create({
        data: {
          parentId: lakshmi.id,
          schoolId: school.id,
          orgId: school.orgId,
          kidName: kid.name,
          gradeSought: kid.gradeSought ?? 'Grade 2',
          status: 'ADMITTED'
        }
      })
      console.log('Created ADMITTED application for Lakshmi Narayan.')
    } else {
      await prisma.parentApplication.updateMany({
        where: { parentId: lakshmi.id, schoolId: school.id },
        data: { status: 'ADMITTED' }
      })
      console.log('Updated application status to ADMITTED for Lakshmi Narayan.')
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
