import { describe, it, expect } from 'vitest'
import {
  buildTemplateParameters,
  previewTemplateBody
} from '@/lib/campaign/templateParams'

const values = {
  parentName: 'Priya',
  kidName: 'Aarav',
  schoolName: 'Prince Matric',
  date: '7 Jul 2026',
  amount: '12000'
}

describe('buildTemplateParameters', () => {
  it('maps ordered tokens to positional values', () => {
    expect(buildTemplateParameters(['parentName', 'amount'], values)).toEqual([
      'Priya',
      '12000'
    ])
  })

  it('unknown tokens become empty strings, order preserved', () => {
    expect(buildTemplateParameters(['parentName', 'nope', 'date'], values)).toEqual([
      'Priya',
      '',
      '7 Jul 2026'
    ])
  })

  it('null/non-array tokens → null (legacy single-blob mode)', () => {
    expect(buildTemplateParameters(null, values)).toBeNull()
    expect(buildTemplateParameters(undefined, values)).toBeNull()
    expect(buildTemplateParameters('parentName', values)).toBeNull()
  })

  it('empty token array → empty parameters (template with no variables)', () => {
    expect(buildTemplateParameters([], values)).toEqual([])
  })

  it('non-string entries in the array become empty strings', () => {
    expect(buildTemplateParameters(['parentName', 42], values)).toEqual(['Priya', ''])
  })
})

describe('previewTemplateBody', () => {
  it('substitutes {{n}} with token names when no values given', () => {
    expect(
      previewTemplateBody('Hi {{1}}, fees {{2}} due.', ['parentName', 'amount'])
    ).toBe('Hi {{parentName}}, fees {{amount}} due.')
  })

  it('substitutes with actual values when provided', () => {
    expect(
      previewTemplateBody('Hi {{1}}, pay {{2}}.', ['parentName', 'amount'], values)
    ).toBe('Hi Priya, pay 12000.')
  })

  it('leaves unmapped positions untouched', () => {
    expect(previewTemplateBody('Hi {{1}} and {{3}}.', ['parentName'])).toBe(
      'Hi {{parentName}} and {{3}}.'
    )
  })

  it('non-array tokens → body unchanged', () => {
    expect(previewTemplateBody('Hi {{1}}', null)).toBe('Hi {{1}}')
  })
})
