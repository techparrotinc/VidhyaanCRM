import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { DocumentReviewStatus } from '@prisma/client'

const updateStatusSchema = z.object({
  scanStatus: z.nativeEnum(DocumentReviewStatus),
  rejectionReason: z.string().optional().nullable()
})

export const PUT = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, params, user }) => {
    const body = updateStatusSchema.parse(await req.json())

    if (body.scanStatus !== 'APPROVED' && body.scanStatus !== 'REJECTED') {
      throw Errors.businessRule('Allowed status values: APPROVED or REJECTED')
    }

    const doc = await db.admissionDocument.findFirst({
      where: {
        id: params?.docId ?? '',
        admissionId: params?.id ?? '',
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!doc) {
      throw Errors.notFound('Document')
    }

    const updated = await db.admissionDocument.update({
      where: { id: doc.id },
      data: {
        scanStatus: body.scanStatus
      }
    })

    // Log activity for approval/rejection
    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: params?.id ?? '',
        type: 'SYSTEM',
        summary: `Document status updated to ${body.scanStatus}: ${doc.name}` + (body.rejectionReason ? ` (Reason: ${body.rejectionReason})` : ''),
        performedById: user.id
      }
    })

    return ok(updated)
  }
})
