import type { ReportQuery } from './types'
import { leadFunnel } from './lead-funnel'
import { leadSourceEffectiveness } from './lead-source-effectiveness'
import { counsellorPerformance } from './counsellor-performance'
import { followUpDiscipline } from './follow-up-discipline'
import { admissionPipeline } from './admission-pipeline'
import { feeCollectionSummary } from './fee-collection-summary'
import { defaulterAgeing } from './defaulter-ageing'
import { concessionAudit } from './concession-audit'
import { campaignEffectiveness } from './campaign-effectiveness'
import { enrollmentStrength } from './enrollment-strength'

// Keyed by registry.ts report keys — the generic routes dispatch here.
export const REPORT_QUERIES: Record<string, ReportQuery> = {
  'lead-funnel': leadFunnel,
  'lead-source-effectiveness': leadSourceEffectiveness,
  'counsellor-performance': counsellorPerformance,
  'follow-up-discipline': followUpDiscipline,
  'admission-pipeline': admissionPipeline,
  'fee-collection-summary': feeCollectionSummary,
  'defaulter-ageing': defaulterAgeing,
  'concession-audit': concessionAudit,
  'campaign-effectiveness': campaignEffectiveness,
  'enrollment-strength': enrollmentStrength
}
