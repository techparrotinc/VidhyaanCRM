import { prisma } from '@/lib/db/client'

// Which module slugs an org currently has enabled. Used to gate the form
// builder's purpose choices via availablePurposes(). Not cached — the
// builder is a low-traffic settings surface.
export async function enabledModuleSlugs(orgId: string): Promise<Set<string>> {
  const rows = await prisma.organizationModule.findMany({
    where: { orgId, enabled: true },
    select: { module: { select: { slug: true } } },
  })
  return new Set(rows.map((r) => r.module.slug))
}
