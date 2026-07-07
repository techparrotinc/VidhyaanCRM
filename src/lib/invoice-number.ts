import { prisma } from '@/lib/db/client'
import type { Prisma } from '@prisma/client'

type Db = Pick<typeof prisma, '$queryRaw'> | Prisma.TransactionClient

/**
 * Next sequential invoice number for an org, e.g. INV-2026-00042.
 * Numeric max over strictly-formatted numbers (count()+1 collides after
 * soft deletes against the [orgId, invoiceNumber] unique constraint).
 * `offset` lets batch creation reserve consecutive numbers.
 */
export async function nextInvoiceNumber(db: Db, orgId: string, offset = 0): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  const rows = await (db as any).$queryRaw`
    SELECT MAX(CAST(SUBSTRING(invoice_number FROM ${prefix.length + 1}::int) AS INTEGER)) AS max
    FROM crm.invoices
    WHERE org_id = ${orgId}
      AND invoice_number ~ ${'^' + prefix + '[0-9]+$'}
  ` as { max: number | null }[]

  const lastNum = Number(rows[0]?.max ?? 0)
  return prefix + String(lastNum + 1 + offset).padStart(5, '0')
}
