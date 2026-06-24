import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Find all parent enquiries
    const enquiries = await prisma.parentEnquiry.findMany({
      where: { 
        parentId: parent.id,
        deletedAt: null
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            media: {
              orderBy: { sortOrder: 'asc' },
              take: 1
            },
            locations: {
              where: { isPrimary: true },
              take: 1
            },
            affiliations: {
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch related leads and admissions in CRM schema
    const leadIds = enquiries.map((e) => e.leadId).filter((id): id is string => id !== null)
    
    let leadMap = new Map()
    if (leadIds.length > 0) {
      const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        include: {
          admissions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      leadMap = new Map(leads.map((l) => [l.id, l]))
    }

    // Map enquiries and calculate statuses
    const processedEnquiries = enquiries.map((enquiry) => {
      let calculatedStatus = 'PENDING'
      const lead = enquiry.leadId ? leadMap.get(enquiry.leadId) : null
      
      if (lead) {
        const latestAdmission = lead.admissions?.[0]
        if (latestAdmission) {
          if (latestAdmission.status === 'ADMITTED') {
            calculatedStatus = 'ADMITTED'
          } else if (latestAdmission.status === 'REJECTED') {
            calculatedStatus = 'NOT_SELECTED'
          } else if (latestAdmission.status === 'WITHDRAWN') {
            calculatedStatus = 'NOT_SELECTED'
          } else {
            // IN_PROGRESS or WAITLISTED
            calculatedStatus = 'SCHEDULED'
          }
        } else if (lead.status === 'CONVERTED' || lead.status === 'INTERESTED') {
          calculatedStatus = 'SCHEDULED'
        } else if (enquiry.status === 'RESPONDED') {
          calculatedStatus = 'RESPONDED'
        } else if (enquiry.status === 'CLOSED') {
          calculatedStatus = 'NOT_SELECTED'
        }
      } else {
        if (enquiry.status === 'RESPONDED') {
          calculatedStatus = 'RESPONDED'
        } else if (enquiry.status === 'CLOSED') {
          calculatedStatus = 'NOT_SELECTED'
        }
      }

      return {
        id: enquiry.id,
        createdAt: enquiry.createdAt,
        status: calculatedStatus,
        gradeSought: enquiry.gradeSought || 'Not set',
        lastUpdated: enquiry.updatedAt,
        message: enquiry.message
      }
    })

    // Group by school
    const schoolGroups = new Map<string, {
      school: {
        id: string
        name: string
        slug: string
        logo: string | null
        city: string
        board: string
      }
      enquiries: typeof processedEnquiries
      latestStatus: string
    }>()

    for (let i = 0; i < enquiries.length; i++) {
      const enquiry = enquiries[i]
      const processed = processedEnquiries[i]
      const school = enquiry.school

      if (!schoolGroups.has(school.id)) {
        const logo = school.media[0]?.url || null
        const city = school.locations[0]?.city || 'Chennai'
        const board = school.affiliations[0]?.board || 'CBSE'

        schoolGroups.set(school.id, {
          school: {
            id: school.id,
            name: school.name,
            slug: school.slug,
            logo,
            city,
            board
          },
          enquiries: [],
          latestStatus: processed.status
        })
      }

      const group = schoolGroups.get(school.id)!
      group.enquiries.push(processed)
      // The first enquiry in array is the newest due to initial orderBy desc
      if (group.enquiries.length === 1) {
        group.latestStatus = processed.status
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(schoolGroups.values())
    })

  } catch (error: any) {
    console.error('Parent applications GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
