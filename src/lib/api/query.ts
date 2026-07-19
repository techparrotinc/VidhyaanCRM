import { z } from 'zod'
import { Errors } from './errors'

// Reusable query-param schemas. Pagination is forgiving (bad input falls
// back to defaults); enum filters are strict (bad input → 422) so callers
// hear about typos instead of silently getting an unfiltered list.

export const pageParam = z.coerce.number().int().min(1).catch(1)

export const limitParam = z.coerce.number().int().min(1).max(100).catch(25)

export const paginationShape = {
  page: pageParam,
  limit: limitParam
}

/** Optional enum filter: absent/empty → undefined, invalid → ZodError. */
export function enumParam<T extends Record<string, string>>(enumObj: T) {
  return z
    .nativeEnum(enumObj)
    .optional()
    .or(z.literal('').transform(() => undefined))
}

/** Optional free-text filter: empty string → undefined. */
export const textParam = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform(v => (v === '' ? undefined : v))

/** Optional YYYY-MM-DD filter (invalid → 422, empty → undefined). */
export const dateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal('').transform(() => undefined))

/**
 * createdAt/paidAt-style window from optional YYYY-MM-DD bounds, resolved as
 * IST business days (orgs operate in IST; a bare UTC parse would shift the
 * window by 5.5h and drop early-morning records).
 */
export function istRange(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00+05:30`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999+05:30`) } : {})
  }
}

/** Runtime enum check for values from bodies/stored JSON. Invalid → 422. */
export function asEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string,
  field = 'value'
): T[keyof T] {
  if ((Object.values(enumObj) as string[]).includes(value)) {
    return value as T[keyof T]
  }
  throw Errors.validation({ [field]: [`Invalid value "${value}"`] })
}

/**
 * Validate a request's query string against a zod shape.
 * Throws AppError(422) with field-level issues on invalid input.
 */
export function parseQuery<T extends z.ZodRawShape>(
  url: string,
  shape: T
): z.infer<z.ZodObject<T>> {
  const { searchParams } = new URL(url)
  const raw: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    raw[key] = value
  })
  const result = z.object(shape).safeParse(raw)
  if (!result.success) {
    throw Errors.validation(result.error.flatten().fieldErrors)
  }
  return result.data
}
