import { describe, it, expect } from 'vitest'
import { effectiveBranchIds, branchScope } from '@/lib/reports/queries/scope'

// effectiveBranchIds folds the optional `branch` selector into the
// role-derived restriction — the security-sensitive part of branch filtering.
describe('effectiveBranchIds', () => {
  it('ORG_ADMIN (unrestricted) narrows to the chosen branch', () => {
    expect(effectiveBranchIds(null, 'b1')).toEqual(['b1'])
  })

  it('ORG_ADMIN with no selection stays unrestricted', () => {
    expect(effectiveBranchIds(null, undefined)).toBeNull()
  })

  it('BRANCH_ADMIN can narrow within their own branches', () => {
    expect(effectiveBranchIds(['b1', 'b2'], 'b1')).toEqual(['b1'])
  })

  it('BRANCH_ADMIN cannot escape their branches via a foreign id', () => {
    // selecting a branch they do not hold falls back to their full set —
    // never widens, never leaks another branch
    expect(effectiveBranchIds(['b1', 'b2'], 'b9')).toEqual(['b1', 'b2'])
  })
})

describe('branchScope', () => {
  it('null → no restriction', () => {
    expect(branchScope(null)).toEqual({})
  })
  it('ids → branchId IN filter', () => {
    expect(branchScope(['b1', 'b2'])).toEqual({ branchId: { in: ['b1', 'b2'] } })
  })
})
