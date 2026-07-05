import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ScrapingStatus } from '@prisma/client'

const importSchema = z.object({
  fileName: z.string().max(300).optional().nullable(),
  rows: z.array(
    z.object({
      school_name: z.string().max(200).optional().nullable(),
      city: z.string().max(100).optional().nullable(),
      address: z.string().max(500).optional().nullable(),
      state: z.string().max(100).optional().nullable(),
      phone: z.string().max(30).optional().nullable(),
      email: z.string().max(200).optional().nullable(),
      website: z.string().max(300).optional().nullable(),
      board: z.string().max(50).optional().nullable()
    })
  ).max(5000)
})

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, '') // Trim - from end
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = importSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid rows payload' }, { status: 400 })
    }
    const { fileName, rows } = parsed.data

    const totalRows = rows.length
    let validRows = 0

    // Perform database operations transactionally or sequentially
    // Sequential loop with try/catch ensures we import as many as possible without failing the whole process
    for (const row of rows) {
      const schoolName = row.school_name
      const city = row.city
      if (!schoolName || !city) {
        continue
      }

      try {
        const baseSlug = slugify(schoolName)
        const uniqueSuffix = Math.random().toString(36).substring(2, 8)
        const slug = `${baseSlug}-${uniqueSuffix}`

        await prisma.$transaction(async (tx) => {
          const school = await tx.school.create({
            data: {
              name: schoolName,
              slug,
              institutionType: 'SCHOOL',
              verificationStatus: 'UNCLAIMED',
              isVerified: false,
              dataSource: 'IMPORTED'
            }
          })

          await tx.schoolLocation.create({
            data: {
              schoolId: school.id,
              addressLine: row.address || null,
              city,
              state: row.state || null,
              isPrimary: true
            }
          })

          if (row.phone) {
            await tx.schoolContact.create({
              data: {
                schoolId: school.id,
                type: 'phone',
                value: row.phone,
                isPrimary: true
              }
            })
          }

          if (row.email) {
            await tx.schoolContact.create({
              data: {
                schoolId: school.id,
                type: 'email',
                value: row.email,
                isPrimary: true
              }
            })
          }

          if (row.website) {
            await tx.schoolContact.create({
              data: {
                schoolId: school.id,
                type: 'website',
                value: row.website,
                isPrimary: true
              }
            })
          }

          if (row.board) {
            await tx.schoolAffiliation.create({
              data: {
                schoolId: school.id,
                board: row.board
              }
            })
          }
        })

        validRows++
      } catch (err) {
        console.error(`Failed to import school row: ${row.school_name}`, err)
      }
    }

    // Create a ScrapingLog entry for this CSV import
    const log = await prisma.scrapingLog.create({
      data: {
        source: 'CSV_IMPORT',
        targetUrl: null,
        schoolId: null,
        status: validRows === totalRows ? ScrapingStatus.SUCCESS : validRows > 0 ? ScrapingStatus.PARTIAL : ScrapingStatus.FAILED,
        recordsIn: totalRows,
        recordsOut: validRows,
        payload: {
          fileName: fileName || 'manual_import.csv',
          totalCount: totalRows,
          importedCount: validRows,
          failedCount: totalRows - validRows
        }
      }
    })

    return NextResponse.json({
      success: true,
      log,
      importedCount: validRows,
      totalCount: totalRows
    })

  } catch (error: any) {
    console.error('Import CSV API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
