import { prisma } from '@/lib/db/client'

// Shared scoping helpers for dashboard/report queries. Row-level role
// scoping lives here — the single choke point (PRD §7.4).

/** AY filter matching the list routes: legacy null-AY rows show under every
 *  year. Pass the *selected* year (query param), not the active one. */
export function ayScope(academicYearId: string | undefined | null) {
  return academicYearId
    ? { OR: [{ academicYearId }, { academicYearId: null }] }
    : {}
}

/** Branch restriction for BRANCH_ADMIN via UserBranchAccess; other roles see
 *  the whole org. Returns null when unrestricted. */
export async function branchIdsFor(
  userId: string,
  role: string
): Promise<string[] | null> {
  if (role !== 'BRANCH_ADMIN') return null
  const rows = await prisma.userBranchAccess.findMany({
    where: { userId },
    select: { branchId: true }
  })
  return rows.length > 0 ? rows.map(r => r.branchId) : null
}

export function branchScope(branchIds: string[] | null) {
  return branchIds ? { branchId: { in: branchIds } } : {}
}

/**
 * Fold an optional `branch` filter selection into the role-derived branch
 * restriction. ORG_ADMIN (unrestricted) narrows to the chosen branch;
 * BRANCH_ADMIN can only narrow *within* the branches they already hold.
 * Tables are orgId-scoped by the tenant client, so a branchId from another
 * org simply matches no rows — never a leak.
 */
export function effectiveBranchIds(
  roleBranchIds: string[] | null,
  selected: string | undefined
): string[] | null {
  if (!selected) return roleBranchIds
  if (roleBranchIds === null) return [selected]
  return roleBranchIds.includes(selected) ? [selected] : roleBranchIds
}

export function monthWindow(offset = 0): { gte: Date; lt: Date } {
  const now = new Date()
  return {
    gte: new Date(now.getFullYear(), now.getMonth() + offset, 1),
    lt: new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  }
}

export const OPEN_LEAD_STATUSES = [
  'NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING'
] as const

export const OPEN_INVOICE_STATUSES = [
  'UNPAID', 'PARTIALLY_PAID', 'OVERDUE'
] as const
