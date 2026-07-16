import { z } from 'zod'

/**
 * Wire contract for /api/mobile/v1/auth — single source for the app and the
 * server routes. Server-side validation in src/app/api/mobile/v1 mirrors
 * these today; consolidate imports there in Phase 1.
 */

export const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number')

export const otpRequestSchema = z.object({ phone: phoneSchema })

export const checkResponseSchema = z.object({
  success: z.literal(true),
  exists: z.boolean(),
  hasPin: z.boolean(),
  name: z.string().nullable().optional()
})

export const pinRequestSchema = z.object({
  phone: phoneSchema,
  pin: z.string().regex(/^\d{4}$/),
  deviceId: z.string().min(8).max(128),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().max(120).optional()
})

export const verifyRequestSchema = z.object({
  phone: phoneSchema,
  code: z.string().min(4).max(8),
  deviceId: z.string().min(8).max(128),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().max(120).optional()
})

export const workspaceSchema = z.object({
  assignmentId: z.string(),
  role: z.string(),
  orgId: z.string().nullable(),
  orgName: z.string().nullable()
})

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.string(),
  orgId: z.string().nullable(),
  assignmentId: z.string()
})

export const tokensResponseSchema = z.object({
  success: z.literal(true),
  accessToken: z.string(),
  accessExpiresIn: z.number(),
  refreshToken: z.string(),
  user: authUserSchema
})

export const selectionResponseSchema = z.object({
  success: z.literal(true),
  selectionRequired: z.literal(true),
  selectionToken: z.string(),
  workspaces: z.array(workspaceSchema)
})

export const twoFactorResponseSchema = z.object({
  success: z.literal(true),
  twoFactorRequired: z.literal(true),
  challengeToken: z.string(),
  method: z.string().optional(),
  maskedPhone: z.string().optional()
})

export const verifyResponseSchema = z.union([
  tokensResponseSchema,
  selectionResponseSchema,
  twoFactorResponseSchema
])

export const refreshResponseSchema = z.object({
  success: z.literal(true),
  accessToken: z.string(),
  accessExpiresIn: z.number(),
  refreshToken: z.string()
})

export type CheckResponse = z.infer<typeof checkResponseSchema>
export type Workspace = z.infer<typeof workspaceSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type TokensResponse = z.infer<typeof tokensResponseSchema>
export type VerifyResponse = z.infer<typeof verifyResponseSchema>
