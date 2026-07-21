import { prisma } from '@/lib/db/client'

// Resolve an org's verified BYO sending domain into a campaign From address.
// Returns undefined when the org has no verified custom domain — callers then
// fall back to the shared send.vidhyaan.com campaign address.
export async function resolveOrgCampaignFrom(
  orgId: string
): Promise<{ email: string; name: string } | undefined> {
  const d = await prisma.orgSendingDomain.findFirst({
    where: { orgId, status: 'VERIFIED', deletedAt: null },
    select: { domain: true, fromLocalPart: true, fromName: true },
  })
  if (!d) return undefined
  return {
    email: `${d.fromLocalPart}@${d.domain}`,
    name: d.fromName ?? '',
  }
}
