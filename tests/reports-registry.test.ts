import { describe, it, expect } from 'vitest'
import { REPORTS, getReport, reportsForRole, isValidReportKey } from '@/lib/reports/registry'

const KNOWN_ROLES = [
  'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'ORG_ADMIN',
  'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT', 'TEACHER', 'PARENT'
]

describe('report registry', () => {
  it('has 18 reports with unique keys', () => {
    expect(REPORTS).toHaveLength(18)
    expect(new Set(REPORTS.map(r => r.key)).size).toBe(18)
  })

  it('every report names only real roles and at least one', () => {
    for (const r of REPORTS) {
      expect(r.allowedRoles.length).toBeGreaterThan(0)
      for (const role of r.allowedRoles) {
        expect(KNOWN_ROLES).toContain(role)
      }
    }
  })

  it('filter keys are unique within each report', () => {
    for (const r of REPORTS) {
      const keys = r.filters.map(f => f.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('enum filters carry options; entity filters carry an options source', () => {
    for (const r of REPORTS) {
      for (const f of r.filters) {
        if (f.type === 'enum') expect(f.options?.length).toBeGreaterThan(0)
        if (f.type === 'entity') expect(f.optionsSource).toBeTruthy()
      }
    }
  })

  it('every report offers at least CSV export', () => {
    for (const r of REPORTS) {
      expect(r.exports).toContain('csv')
    }
  })

  it('lookups behave', () => {
    expect(getReport('lead-funnel')?.title).toBe('Lead Funnel & Conversion')
    expect(isValidReportKey('nope')).toBe(false)
    const counsellor = reportsForRole('COUNSELLOR').map(r => r.key)
    expect(counsellor).toContain('follow-up-discipline')
    expect(counsellor).not.toContain('defaulter-ageing')
  })
})
