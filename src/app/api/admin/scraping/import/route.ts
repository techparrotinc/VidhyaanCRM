import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ScrapingStatus } from '@prisma/client'

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

    const body = await req.json()
    const { fileName, rows } = body

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid rows payload' }, { status: 400 })
    }

    const totalRows = rows.length
    let validRows = 0

    // Perform database operations transactionally or sequentially
    // Sequential loop with try/catch ensures we import as many as possible without failing the whole process
    for (const row of rows) {
      if (!row.school_name || !row.city) {
        continue
      }

      try {
        const baseSlug = slugify(row.school_name || 'school')
        const uniqueSuffix = Math.random().toString(36).substring(2, 8)
        const slug = `${baseSlug}-${uniqueSuffix}`

        await prisma.$transaction(async (tx) => {
          const school = await tx.school.create({
            data: {
              name: row.school_name,
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
              city: row.city,
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
