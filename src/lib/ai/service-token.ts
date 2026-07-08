import { createHmac } from 'crypto'

/**
 * Signs the v1 service token for ERP -> AI Gateway calls (admin aggregates).
 * Same format the gateway uses toward the ERP; the signature covers the
 * acting identity, the gateway enforces platform-role on its side.
 */
export function signAiServiceToken(userId: string, orgId: string, role: string): string {
  const secret = process.env.ERP_SERVICE_TOKEN_SECRET
  if (!secret) throw new Error('ERP_SERVICE_TOKEN_SECRET not configured')
  const ts = Math.floor(Date.now() / 1000)
  const payload = `${ts}.${userId}.${orgId}.${role}`
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `v1.${payload}.${sig}`
}
