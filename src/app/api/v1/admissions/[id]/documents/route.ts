import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, params, user }) => {
    const docs = await db.admissionDocument.findMany({
      where: {
        admissionId: params?.id ?? '',
        orgId: user.orgId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    })
    return ok(docs)
  }
})

const createDocSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  url: z.string().url(),
  sizeBytes: z.number().optional().nullable()
})

export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user, params }) => {
    const body = createDocSchema.parse(await req.json())

    const doc = await db.admissionDocument.create({
      data: {
        orgId: user.orgId,
        admissionId: params?.id ?? '',
        name: body.name,
        type: body.type,
        url: body.url,
        sizeBytes: body.sizeBytes ?? null,
        scanStatus: 'PENDING',
        uploadedById: user.id
      }
    })

    // Log DOCUMENT activity
    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: params?.id ?? '',
        type: 'DOCUMENT',
        summary: `Document uploaded: ${body.name}`,
        performedById: user.id
      }
    })

    return created(doc)
  }
})
