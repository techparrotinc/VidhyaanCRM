import { describe, it, expect } from 'vitest'
import { suggestEmail } from '@/lib/email/validate'

describe('suggestEmail (domain typo correction)', () => {
  it('fixes classic gmail typos', () => {
    expect(suggestEmail('parent@gamil.com')).toBe('parent@gmail.com')
    expect(suggestEmail('parent@gmial.com')).toBe('parent@gmail.com')
    expect(suggestEmail('parent@gmall.com')).toBe('parent@gmail.com')
  })

  it('fixes TLD typos', () => {
    expect(suggestEmail('a@gmail.con')).toBe('a@gmail.com')
    expect(suggestEmail('a@gmail.cmo')).toBe('a@gmail.com')
    expect(suggestEmail('a@yahoo.co')).toBe('a@yahoo.com')
  })

  it('fixes yahoo/hotmail typos', () => {
    expect(suggestEmail('a@yahooo.com')).toBe('a@yahoo.com')
    expect(suggestEmail('a@hotmial.com')).toBe('a@hotmail.com')
  })

  it('leaves correct major domains alone', () => {
    expect(suggestEmail('a@gmail.com')).toBeNull()
    expect(suggestEmail('a@yahoo.co.in')).toBeNull()
    expect(suggestEmail('a@outlook.com')).toBeNull()
  })

  it('does not touch unrelated custom domains', () => {
    expect(suggestEmail('admin@dpsschool.edu.in')).toBeNull()
    expect(suggestEmail('office@stjosephs.org')).toBeNull()
    expect(suggestEmail('x@acme.co')).toBeNull() // legit .co, far from any known domain
  })

  it('handles garbage without crashing', () => {
    expect(suggestEmail('no-at-sign')).toBeNull()
    expect(suggestEmail('@nodomainlocal')).toBeNull()
  })
})
