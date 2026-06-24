import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { OrgStatus, InstitutionType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
    
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const planId = searchParams.get('planId')
    const institutionType = searchParams.get('institutionType')
    
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'

    // Build where clause
    const where: any = { deletedAt: null }
    
    if (status) {
      where.status = status as OrgStatus
    }
    if (planId) {
      where.planId = planId
    }
    if (institutionType) {
      where.institutionType = institutionType as InstitutionType
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const include = {
      plan: {
        select: {
          name: true,
          slug: true,
          monthlyPrice: true
        }
      },
      subscriptions: {
        select: {
          status: true,
          amount: true
        }
      },
      schools: {
        take: 1,
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          users: true,
          leads: true,
          admissions: true
        }
      }
    }

    let total = 0
    let data: any[] = []

    if (sortBy === 'revenue') {
      // Sort in memory to handle relationship field sums properly without Prisma exceptions
      const allOrgs = await prisma.organization.findMany({ where, include })
      allOrgs.sort((a, b) => {
        const revA = a.subscriptions.reduce((sum, s) => sum + Number(s.amount), 0)
        const revB = b.subscriptions.reduce((sum, s) => sum + Number(s.amount), 0)
        return sortOrder === 'asc' ? revA - revB : revB - revA
      })
      
      total = allOrgs.length
      data = allOrgs.slice((page - 1) * limit, page * limit)
    } else {
      let orderBy: any = {}
      if (sortBy === 'leads') {
        orderBy = { leads: { _count: sortOrder } }
      } else if (sortBy === 'admissions') {
        orderBy = { admissions: { _count: sortOrder } }
      } else {
        orderBy = { createdAt: sortOrder }
      }

      const [countResult, findResult] = await Promise.all([
        prisma.organization.count({ where }),
        prisma.organization.findMany({
          where,
          include,
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        })
      ])
      total = countResult
      data = findResult
    }

    // Format response to include first marketplace school details
    const formattedData = data.map((org) => {
      const activeSub = org.subscriptions.find((s: any) => s.status === 'ACTIVE') || org.subscriptions[0]
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        institutionType: org.institutionType,
        email: org.email,
        phone: org.phone,
        status: org.status,
        trialEndsAt: org.trialEndsAt,
        createdAt: org.createdAt,
        plan: org.plan,
        subscription: activeSub ? { status: activeSub.status, amount: activeSub.amount } : null,
        school: org.schools[0] || null,
        _count: org._count
      }
    })

    return NextResponse.json({
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Organizations List API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
