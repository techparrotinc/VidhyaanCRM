import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ prisma: {} }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/parent-access', () => ({ activatePendingLinks: vi.fn() }))

import { linkedStudentsWhere } from '@/lib/parent-portal'

const parent = (overrides: Record<string, unknown> = {}) => ({
  id: 'par_1',
  phone: '9876543210',
  email: 'guardian@example.com',
  ...overrides
}) as never

describe('linkedStudentsWhere', () => {
  it('grants access via ACTIVE link or contact match', () => {
    const where = linkedStudentsWhere(parent())
    expect(where.OR).toContainEqual({
      guardianLinks: { some: { parentId: 'par_1', status: 'ACTIVE' } }
    })
    expect(where.OR).toContainEqual({ guardianPhone: '9876543210' })
    expect(where.OR).toContainEqual({ guardianEmail: 'guardian@example.com' })
  })

  it('a REVOKED link blocks access even when the phone matches', () => {
    const where = linkedStudentsWhere(parent())
    expect(where.NOT).toEqual({
      guardianLinks: { some: { parentId: 'par_1', status: 'REVOKED' } }
    })
  })

  it('omits email match when the parent has no email', () => {
    const where = linkedStudentsWhere(parent({ email: null }))
    expect(JSON.stringify(where)).not.toContain('guardianEmail')
  })

  it('always excludes soft-deleted students', () => {
    expect(linkedStudentsWhere(parent()).deletedAt).toBeNull()
  })
})
