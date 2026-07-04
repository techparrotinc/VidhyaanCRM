import { describe, it, expect } from 'vitest'
import { LeadStatus } from '@prisma/client'
import { parseQuery, paginationShape, enumParam, textParam, asEnum } from '@/lib/api/query'
import { AppError } from '@/lib/api/errors'

const url = (qs: string) => `http://x.local/api/test?${qs}`

describe('parseQuery pagination', () => {
  it('applies defaults', () => {
    const q = parseQuery(url(''), paginationShape)
    expect(q).toEqual({ page: 1, limit: 25 })
  })

  it('falls back on garbage instead of NaN', () => {
    const q = parseQuery(url('page=abc&limit=-5'), paginationShape)
    expect(q.page).toBe(1)
    expect(q.limit).toBe(25)
  })

  it('caps limit at 100', () => {
    expect(parseQuery(url('limit=5000'), paginationShape).limit).toBe(25) // catch → default
    expect(parseQuery(url('limit=100'), paginationShape).limit).toBe(100)
  })
})

describe('enumParam', () => {
  const shape = { status: enumParam(LeadStatus) }

  it('accepts valid enum value', () => {
    expect(parseQuery(url('status=NEW'), shape).status).toBe('NEW')
  })

  it('treats absent/empty as undefined', () => {
    expect(parseQuery(url(''), shape).status).toBeUndefined()
    expect(parseQuery(url('status='), shape).status).toBeUndefined()
  })

  it('throws 422 AppError on invalid value', () => {
    try {
      parseQuery(url('status=BOGUS'), shape)
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).status).toBe(422)
    }
  })
})

describe('textParam', () => {
  it('empty string becomes undefined', () => {
    expect(parseQuery(url('search='), { search: textParam }).search).toBeUndefined()
  })

  it('rejects over-long input', () => {
    expect(() =>
      parseQuery(url(`search=${'a'.repeat(300)}`), { search: textParam })
    ).toThrow(AppError)
  })
})

describe('asEnum', () => {
  it('passes valid value through', () => {
    expect(asEnum(LeadStatus, 'NEW')).toBe('NEW')
  })

  it('throws 422 on invalid value', () => {
    expect(() => asEnum(LeadStatus, 'HACK')).toThrow(AppError)
  })
})
