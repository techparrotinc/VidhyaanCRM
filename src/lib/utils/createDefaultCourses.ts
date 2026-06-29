import { prisma } from '@/lib/db/client'
import { DEFAULT_COURSES_BY_CATEGORY } from '@/constants/defaultCourses'
import { CenterCategory } from '@prisma/client'

export async function createDefaultCourses(
  orgId: string,
  centerCategory: string,
  createdBy: string
): Promise<void> {
  const courses = DEFAULT_COURSES_BY_CATEGORY[centerCategory]
  if (!courses || courses.length === 0) return

  await prisma.course.createMany({
    data: courses.map(c => ({
      orgId,
      name: c.name,
      frequency: c.frequency,
      amount: c.amount,
      billingDay: c.billingDay,
      isActive: c.isActive,
      category: centerCategory as CenterCategory
    })),
    skipDuplicates: true,
  })
}
