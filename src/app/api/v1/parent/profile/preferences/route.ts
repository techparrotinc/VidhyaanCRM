import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

/**
 * Parent marketplace notification + privacy consent toggles. Persisted on the
 * Parent row (not localStorage) so choices survive across devices and can be
 * honoured by send paths that resolve a recipient to this parent. All fields
 * optional — the client PATCHes a single toggle at a time.
 */
const prefsSchema = z
  .object({
    notifyEmail: z.boolean(),
    notifySms: z.boolean(),
    notifyWhatsapp: z.boolean(),
    allowSchoolContact: z.boolean(),
    showProfileToSchools: z.boolean()
  })
  .partial()

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PARENT') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Parent role required.' },
      { status: 401 }
    )
  }

  const parsed = prefsSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ success: false, error: 'No preference supplied' }, { status: 400 })
  }

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Parent record not found' }, { status: 404 })
  }

  const updated = await prisma.parent.update({
    where: { id: parent.id },
    data: parsed.data,
    select: {
      notifyEmail: true,
      notifySms: true,
      notifyWhatsapp: true,
      allowSchoolContact: true,
      showProfileToSchools: true
    }
  })

  return NextResponse.json({ success: true, data: updated })
}
