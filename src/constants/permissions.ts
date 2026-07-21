import { ROLES } from './roles'

/**
 * Role → entity → action permission matrix. Single source of truth for who may
 * perform destructive/critical operations on core CRM records. The API `route()`
 * composer still enforces its own `roles` list per handler; this matrix keeps
 * those lists consistent and drives the delete/archive/void guards.
 *
 * Design principles (see settings → Activity Log):
 *  - `delete` = hard/soft-delete of the whole record. Kept tight.
 *  - `archive` = reversible hide-from-active-views. Wider than delete.
 *  - `void`   = money records (invoice/payment) are never hard-deleted; they are
 *               reversed/voided (auditable), not removed.
 *  - Front-desk roles create/update but do not delete — they archive instead.
 *  - Cross-entity or money-bearing deletes escalate to ORG_ADMIN.
 */

export type CrmEntity =
  | 'LEAD'
  | 'ADMISSION'
  | 'STUDENT'
  | 'INVOICE'
  | 'PAYMENT'
  | 'ENROLLMENT'

export type CrmAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'void'
  | 'export'

type Role = (typeof ROLES)[keyof typeof ROLES]

type EntityMatrix = Partial<Record<CrmAction, readonly Role[]>>

const A = ROLES.ORG_ADMIN
const B = ROLES.BRANCH_ADMIN
const C = ROLES.COUNSELLOR
const R = ROLES.RECEPTIONIST
const AC = ROLES.ACCOUNTANT

export const PERMISSIONS: Record<CrmEntity, EntityMatrix> = {
  LEAD: {
    create: [A, B, C, R],
    update: [A, B, C],
    // Delete kept to admins only (org + branch).
    delete: [A, B],
    archive: [A, B, C, R],
    export: [A, B, C],
  },
  ADMISSION: {
    create: [A, B, C, R],
    update: [A, B, C],
    delete: [A, B],
    archive: [A, B, C, R],
    export: [A, B, C],
  },
  STUDENT: {
    create: [A, B, R],
    update: [A, B],
    // Money-bearing record with fee/attendance history — org admin only.
    delete: [A],
    archive: [A, B],
    export: [A, B, AC],
  },
  INVOICE: {
    create: [A, B, AC],
    update: [A, B, AC],
    // Hard delete reserved for admins; accountants void instead (see `void`).
    delete: [A, B],
    void: [A, B, AC],
    export: [A, B, AC],
  },
  PAYMENT: {
    create: [A, B, AC],
    update: [A, B, AC],
    delete: [A],
    void: [A, B, AC],
    export: [A, B, AC],
  },
  ENROLLMENT: {
    create: [A, B, R],
    update: [A, B],
    delete: [A, B],
    archive: [A, B],
  },
}

/** True when `role` may perform `action` on `entity`. */
export function can(role: string, entity: CrmEntity, action: CrmAction): boolean {
  const allowed = PERMISSIONS[entity]?.[action]
  return Array.isArray(allowed) && (allowed as readonly string[]).includes(role)
}

/**
 * Roles allowed for an entity/action, shaped for `route({ roles })`. Use this
 * instead of hand-listing roles on destructive handlers so the matrix stays the
 * single source of truth.
 */
export function rolesFor(entity: CrmEntity, action: CrmAction): string[] {
  return [...(PERMISSIONS[entity]?.[action] ?? [])]
}
