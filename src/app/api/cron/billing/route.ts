import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { createNotification } from '@/lib/services/notifications'
import { applyPendingPlanChange, reconcilePendingSubscriptions } from '@/lib/billing/reconcile'
import { downgradeOrgToFree, SLAB_CAPACITY } from '@/lib/billing/lifecycle'
import { ensureRenewalInvoice } from '@/lib/billing/renewal'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const GRACE_DAYS = 7
const REMINDER_BUCKETS = [7, 3, 1]

const appUrl = () => process.env.NEXTAUTH_URL || 'https://vidhyaan.com'

function simpleEmail(title: string, bodyHtml: string, ctaLabel: string, ctaHref: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background:#fff;">
      <div style="background:#1565D8; padding:18px; border-radius:8px 8px 0 0; text-align:center;">
        <h1 style="color:#fff; margin:0; font-size:20px;">${title}</h1>
      </div>
      <div style="padding:22px; color:#334155; line-height:1.6; font-size:14px;">
        ${bodyHtml}
        <div style="text-align:center; margin:26px 0 6px;">
          <a href="${ctaHref}" style="display:inline-block; background:#1565D8; color:#fff; padding:11px 26px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">${ctaLabel}</a>
        </div>
      </div>
    </div>`
}

async function notifyOrgAdmin(orgId: string, orgEmail: string | null, subject: string, html: string, inApp: { title: string; body: string }) {
  if (orgEmail) {
    await sendTransactionalEmail({
      to: orgEmail,
      subject,
      htmlBody: html,
      textBody: inApp.body
    }).catch((e) => console.error(`billing cron email failed for ${orgId}:`, e))
  }
  const admin = await prisma.user.findFirst({
    where: {
      orgId,
      deletedAt: null,
      roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }
    },
    select: { id: true }
  })
  if (admin) {
    await createNotification({
      orgId,
      recipientType: 'USER',
      recipientId: admin.id,
      type: 'BILLING',
      title: inApp.title,
      body: inApp.body,
      data: { href: '/settings/billing' }
    }).catch((e) => console.error(`billing cron notification failed for ${orgId}:`, e))
  }
}

/**
 * Daily billing lifecycle (schedule: 03:00 UTC ≈ 08:30 IST):
 *  1. Apply scheduled (downgrade) plan changes whose effective date passed.
 *  2. Renewal reminders at T−7 / T−3 / T−1 days (deduped per period).
 *  3. Period ended: cancelAtPeriodEnd → downgrade to free; else enter
 *     7-day grace (status GRACE_PERIOD, graceEndsAt set, email sent).
 *  4. Grace ended without payment → EXPIRED + downgrade to free.
 *  5. Slab overflow: active students exceed the paid slab → warn (weekly).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const stats = { reconciled: 0, scheduledChanges: 0, reminders: 0, graceEntered: 0, expired: 0, cancelled: 0, slabWarnings: 0 }
  const errors: string[] = []

  // ---- 0. Reconcile paid-but-unactivated orders ---------------------------
  // A school that pays and never revisits its billing page would otherwise
  // stay unactivated (page-load reconcile never runs for them).
  try {
    const pendingOrgs = await prisma.transaction.findMany({
      where: {
        type: 'SUBSCRIPTION',
        status: { in: ['PENDING', 'FAILED'] }, // FAILED: retry may have captured on the same order
        gatewayRef: { startsWith: 'order_' },
        createdAt: { gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } // covers T−7 renewal links
      },
      select: { orgId: true },
      distinct: ['orgId']
    })
    for (const row of pendingOrgs) {
      const n = await reconcilePendingSubscriptions(row.orgId).catch((e) => {
        errors.push(`reconcile ${row.orgId}: ${e.message}`)
        return 0
      })
      stats.reconciled += n
    }
  } catch (e: any) {
    errors.push(`reconcile sweep: ${e.message}`)
  }

  // ---- 1. Scheduled plan changes -----------------------------------------
  try {
    const orgs = await prisma.organization.findMany({
      where: { deletedAt: null, isDummy: false },
      select: { id: true, settings: true }
    })
    for (const org of orgs) {
      if ((org.settings as any)?.pendingPlanChange) {
        const applied = await applyPendingPlanChange(org.id).catch((e) => {
          errors.push(`pendingChange ${org.id}: ${e.message}`)
          return false
        })
        if (applied) stats.scheduledChanges++
      }
    }
  } catch (e: any) {
    errors.push(`scheduledChanges: ${e.message}`)
  }

  // ---- 2–4. Subscription lifecycle ----------------------------------------
  const subs = await prisma.subscription.findMany({
    where: { deletedAt: null, status: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
    include: {
      plan: { select: { name: true } },
      organization: { select: { id: true, name: true, email: true, settings: true, isDummy: true } }
    }
  })

  for (const sub of subs) {
    const org = sub.organization
    if (!org || org.isDummy) continue
    const billingUrl = `${appUrl()}/settings/billing`

    try {
      // 4. Grace over → expire + downgrade
      if (sub.status === 'GRACE_PERIOD') {
        if (sub.graceEndsAt && sub.graceEndsAt < now) {
          await downgradeOrgToFree(org.id, 'grace period ended without renewal')
          await notifyOrgAdmin(
            org.id,
            org.email,
            'Your Vidhyaan subscription has expired',
            simpleEmail(
              'Subscription Expired',
              `<p>Hi ${org.name},</p><p>Your <strong>${sub.plan.name}</strong> subscription has expired and premium modules are now locked. Your data is safe — renew any time to pick up right where you left off.</p>`,
              'Renew Now',
              billingUrl
            ),
            { title: 'Subscription expired', body: 'Premium modules are locked. Renew to restore access — your data is intact.' }
          )
          stats.expired++
        }
        continue
      }

      // ACTIVE from here
      if (!sub.currentPeriodEnd) continue

      // 3. Period ended
      if (sub.currentPeriodEnd < now) {
        if (sub.cancelAtPeriodEnd) {
          await downgradeOrgToFree(org.id, 'cancelled at period end')
          await notifyOrgAdmin(
            org.id,
            org.email,
            'Your Vidhyaan subscription has ended',
            simpleEmail(
              'Subscription Ended',
              `<p>Hi ${org.name},</p><p>As requested, your <strong>${sub.plan.name}</strong> subscription ended on ${sub.currentPeriodEnd.toLocaleDateString('en-IN')}. Your data is retained — resubscribe any time.</p>`,
              'View Plans',
              `${appUrl()}/settings/billing/upgrade`
            ),
            { title: 'Subscription ended', body: 'Your cancellation took effect. Resubscribe any time — your data is intact.' }
          )
          stats.cancelled++
        } else {
          const graceEndsAt = new Date(sub.currentPeriodEnd.getTime() + GRACE_DAYS * 86400000)
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'GRACE_PERIOD', graceEndsAt }
          })
          await notifyOrgAdmin(
            org.id,
            org.email,
            `Payment due — ${GRACE_DAYS}-day grace period started`,
            simpleEmail(
              'Renewal Payment Due',
              `<p>Hi ${org.name},</p><p>Your <strong>${sub.plan.name}</strong> subscription period ended on ${sub.currentPeriodEnd.toLocaleDateString('en-IN')}. You have full access during a ${GRACE_DAYS}-day grace period ending <strong>${graceEndsAt.toLocaleDateString('en-IN')}</strong> — renew before then to avoid interruption.</p>`,
              'Renew Now',
              billingUrl
            ),
            { title: 'Renewal payment due', body: `Grace period active until ${graceEndsAt.toLocaleDateString('en-IN')}. Renew to avoid losing access.` }
          )
          stats.graceEntered++
        }
        continue
      }

      // 2. Renewal reminders (T−7/3/1), deduped in org.settings JSON
      const daysLeft = Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000)
      const bucket = REMINDER_BUCKETS.find((b) => daysLeft <= b) // smallest applicable
      if (bucket !== undefined && daysLeft >= 0) {
        const settings = (org.settings as any) || {}
        const periodKey = sub.currentPeriodEnd.toISOString()
        const sent: number[] = settings.renewalReminders?.[periodKey] || []
        if (!sent.includes(bucket)) {
          // Auto-renew v1: hosted payment link — pay the renewal in one click,
          // no login. Period extends from the current period end.
          const payLink = await ensureRenewalInvoice(sub.id).catch((e) => {
            errors.push(`renewalInvoice ${sub.id}: ${e.message}`)
            return null
          })
          await notifyOrgAdmin(
            org.id,
            org.email,
            `Your Vidhyaan subscription renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            simpleEmail(
              'Renewal Reminder',
              `<p>Hi ${org.name},</p><p>Your <strong>${sub.plan.name}</strong> subscription (₹${Number(sub.amount).toLocaleString('en-IN')}/${sub.billingCycle.toLowerCase()}) is due for renewal on <strong>${sub.currentPeriodEnd.toLocaleDateString('en-IN')}</strong>.${payLink ? ' Pay securely with the link below — your new period starts right where the current one ends.' : ' Renew from your billing page to keep uninterrupted access.'}</p>`,
              payLink ? 'Pay Renewal Now' : 'Renew Now',
              payLink || billingUrl
            ),
            { title: `Renewal in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`, body: `${sub.plan.name} renews on ${sub.currentPeriodEnd.toLocaleDateString('en-IN')}.` }
          )
          // Re-read settings: ensureRenewalInvoice may have just written
          // renewalInvoices into them — a stale spread would drop it.
          const freshOrg = await prisma.organization.findUnique({
            where: { id: org.id },
            select: { settings: true }
          })
          const freshSettings = (freshOrg?.settings as any) || {}
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              settings: {
                ...freshSettings,
                renewalReminders: {
                  ...(freshSettings.renewalReminders || {}),
                  [periodKey]: [...sent, bucket]
                }
              }
            }
          })
          stats.reminders++
        }
      }

      // 5. Slab overflow warning (weekly)
      const lastPaidTx = await prisma.transaction.findFirst({
        where: { orgId: org.id, type: 'SUBSCRIPTION', status: 'SUCCESS' },
        orderBy: { paidAt: 'desc' },
        select: { metadata: true }
      })
      const paidSlab = (lastPaidTx?.metadata as any)?.slab as string | undefined
      if (paidSlab && SLAB_CAPACITY[paidSlab]) {
        const studentCount = await prisma.student.count({ where: { orgId: org.id, deletedAt: null } })

        // 1,000+ students on the 500+ slab → custom-quote territory: alert
        // ops (sales opportunity), weekly dedupe
        if (paidSlab === 'S500_PLUS' && studentCount > 1000) {
          const settings = (org.settings as any) || {}
          const lastAlert = settings.customQuoteAlertedAt ? new Date(settings.customQuoteAlertedAt) : null
          if (!lastAlert || now.getTime() - lastAlert.getTime() > 7 * 86400000) {
            const platform = await prisma.platformSettings.findUnique({ where: { id: 'default' } })
            if (platform?.opsAlertEmail) {
              await sendTransactionalEmail({
                to: platform.opsAlertEmail,
                subject: `💰 Custom-quote opportunity: ${org.name} crossed 1,000 students`,
                htmlBody: `<p><strong>${org.name}</strong> now has <strong>${studentCount.toLocaleString('en-IN')}</strong> active students on the 500+ slab (₹${Number(sub.amount).toLocaleString('en-IN')}/${sub.billingCycle.toLowerCase()}). Per pricing policy, 1,000+ students move to custom enterprise pricing — reach out to negotiate.</p>`,
                textBody: `${org.name} crossed 1,000 students — custom-quote opportunity.`
              }).catch((e) => console.error('custom-quote ops alert failed:', e))
            }
            await prisma.organization.update({
              where: { id: org.id },
              data: { settings: { ...settings, customQuoteAlertedAt: now.toISOString() } }
            })
          }
        }

        if (studentCount > SLAB_CAPACITY[paidSlab]) {
          const settings = (org.settings as any) || {}
          const lastWarned = settings.slabOverflowWarnedAt ? new Date(settings.slabOverflowWarnedAt) : null
          if (!lastWarned || now.getTime() - lastWarned.getTime() > 7 * 86400000) {
            await notifyOrgAdmin(
              org.id,
              org.email,
              'Student count has outgrown your plan capacity',
              simpleEmail(
                'Plan Capacity Exceeded',
                `<p>Hi ${org.name},</p><p>You now have <strong>${studentCount.toLocaleString('en-IN')}</strong> active students — above your plan capacity of ${SLAB_CAPACITY[paidSlab].toLocaleString('en-IN')}. Please upgrade your capacity slab to stay compliant; pricing adjusts automatically at checkout.</p>`,
                'Upgrade Capacity',
                `${appUrl()}/settings/billing/upgrade`
              ),
              { title: 'Plan capacity exceeded', body: `${studentCount} students vs ${SLAB_CAPACITY[paidSlab]} capacity — upgrade your slab.` }
            )
            await prisma.organization.update({
              where: { id: org.id },
              data: { settings: { ...settings, slabOverflowWarnedAt: now.toISOString() } }
            })
            stats.slabWarnings++
          }
        }
      }
    } catch (e: any) {
      errors.push(`sub ${sub.id}: ${e.message}`)
    }
  }

  return NextResponse.json({ ok: true, ...stats, errors: errors.slice(0, 20) })
}
