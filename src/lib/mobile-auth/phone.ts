import { prisma } from '@/lib/db/client'

/**
 * The users table stores phones as entered at creation (mostly bare 10-digit
 * Indian numbers); the app sends +91XXXXXXXXXX. Match on the sensible
 * candidates and return the user with their CANONICAL stored phone — that
 * stored value is the OTP identifier, so send + verify always agree.
 */
export async function findUserByPhone(input: string) {
  const digits = input.replace(/\D/g, '')
  const candidates = new Set<string>([digits])
  if (digits.length > 10) candidates.add(digits.slice(-10))
  if (digits.length === 10) candidates.add(`91${digits}`)
  candidates.add(`+${digits}`)

  return prisma.user.findFirst({
    where: { phone: { in: [...candidates] }, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, orgId: true, phone: true }
  })
}
