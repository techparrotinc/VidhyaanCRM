import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const DELETE = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR
  ],
  handler: async ({ db, params, user }) => {
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

    await db.admissionDocument.update({
      where: { id: doc.id },
      data: { deletedAt: new Date() }
    })

    // Log SYSTEM activity for deletion
    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: params?.id ?? '',
        type: 'SYSTEM',
        summary: `Document deleted: ${doc.name}`,
        performedById: user.id
      }
    })

    return ok({ success: true })
  }
})
