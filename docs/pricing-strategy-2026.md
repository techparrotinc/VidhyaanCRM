# Vidhyaan — Subscription Pricing Strategy & Financial Model
**Version 1.0 · July 2026 · Confidential — Board / Investor Document**

All prices in INR, exclusive of GST (18%, SAC 998314) unless stated. FX assumption: ₹90 / USD. Market rates are Indian SaaS rates as of mid-2026.

---

## 1. Executive Summary

Vidhyaan is a multi-tenant AI-powered CRM for Indian schools, junior colleges, and learning centres. This document defines a **4-plan, 5-slab, student-count-based subscription model** with metered add-ons (WhatsApp, SMS, AI credits), a complete cost model, and revenue projections to 1,000 customers.

**Headline recommendations:**

| Item | Recommendation |
|---|---|
| Pricing metric | Active students (slabbed, not per-student) — predictable for buyers, scales revenue |
| Flagship plan | **Enterprise (all modules + AI)** — ₹1,999–₹11,999/mo by slab |
| Annual incentive | Pay for 10 months (16.7% discount) — drives cash-flow and retention |
| Blended ARPU target | ₹4,300/mo (subscription ₹3,600 + add-ons ₹700) |
| Product gross margin | 82–90% on subscriptions; 40–73% on add-ons; **blended 78–85%** — meets the 70–80% objective |
| Break-even | ~170 paying customers (≈ ₹7.3L MRR), projected month 20–24 |
| LTV : CAC | ~8.7 : 1 (LTV ₹1.31L on 36-month conservative lifetime, CAC ₹15,000) |
| Custom offers | Per-org pricing overrides in the Admin portal (Section 17) — already partially supported by `Subscription.discountPct` |

Why this works: infrastructure is genuinely multi-tenant (Vercel + Neon + Upstash), so marginal cost per institution is ₹150–₹900/month. The pricing floor formula (Section 6) guarantees ≥50% margin on every SKU even after 25% operational overhead, while remaining 30–60% cheaper than Fedena/Entab-class ERPs for comparable slabs and dramatically cheaper than LeadSquared for CRM capability.

---

## 2. Pricing Philosophy

1. **Charge on value metric that grows with the customer** — active students. An institution with 400 students derives more value (more leads, invoices, messages) than one with 40. Slabs (not strict per-student) keep invoices predictable and avoid month-to-month billing disputes.
2. **Slabs, not seats.** Competitors charging per-user (LeadSquared: ₹1,500–₹3,000/user/mo) punish adoption. Vidhyaan includes generous user counts per plan so the whole office uses it — usage drives stickiness.
3. **Modular good-better-best.** Two focused mid-tier plans (Admission CRM; Fee & Student) let price-sensitive institutions start where their pain is; Enterprise bundles everything + AI at a price that makes upgrading obviously rational (~1.6× the mid-tier for 2× the modules + AI).
4. **AI as both differentiator and metered profit line.** Base AI allowances are bundled in Enterprise (drives adoption); heavy usage monetized via credit packs at 60–75% margin.
5. **Land free, expand paid.** The free directory listing is a marketplace acquisition engine (SEO + enquiries), converting via the 7-day full-feature trial.
6. **Never price below the floor:** `Floor = (Direct COGS × 1.25) ÷ 0.5`. Every published price in this document clears it.

---

## 3. Cost Assumptions (2026 Indian market rates)

| Input | Rate | Source basis |
|---|---|---|
| Vercel Pro + usage | $70/mo at 100 orgs | Pro seat $20 + functions/bandwidth overage |
| Neon Postgres (Scale, always-on 2 CU, scale-to-zero off) | $150/mo | Current prod config (ap-southeast-1) |
| Upstash Redis (REST) | $10/mo | Pay-as-you-go |
| S3 + CDN (bucket `vidhyaan`, ap-south-1) | $30/mo | Uploads, receipts, event covers |
| Transactional email (SES/Resend, ~50k/mo) | $20/mo | |
| Hostinger domain/DNS/email | ₹400/mo | |
| Monitoring + logs (Sentry/BetterStack) | $26/mo | |
| SMS (MSG91, DLT transactional) | ₹0.18/SMS (₹0.16 at >25k/mo volume) | |
| WhatsApp (Meta, India) | Utility ₹0.115/conv · Marketing ₹0.78/conv → **blended ₹0.38** (60/40 utility-heavy mix) | Meta conversation pricing |
| AI inference (hosted-OSS, 70B-class) | $0.25 in / $0.75 out per MTok → **₹0.20 per credit** (weighted action, see §11) | |
| Razorpay | 2% + GST on collections | Standard MDR |
| Support agent | ₹30,000/mo | Tier-1, India |
| Customer Success | ₹50,000/mo | |
| Inside sales rep | ₹40,000 + ₹10,000 incentives | |
| Engineer | ₹1,20,000/mo | Mid-senior full-stack |
| Churn | 15%/yr (annual contracts) | Conservative for edtech SaaS |
| CAC | ₹15,000 | Inside sales + digital, edu SMB India |

---

## 4. Infrastructure Cost Analysis

Platform-wide monthly infra by customer count (multi-tenant — costs step, not scale linearly):

| Customers | Vercel | Neon | Redis | S3/CDN | Email | Monitor | Misc | **Total/mo** | **Per org** |
|---|---|---|---|---|---|---|---|---|---|
| 10 | ₹2,700 | ₹6,300 | ₹500 | ₹900 | ₹500 | ₹1,000 | ₹500 | **₹12,400** | ₹1,240 |
| 25 | ₹3,600 | ₹7,200 | ₹700 | ₹1,300 | ₹700 | ₹1,500 | ₹500 | **₹15,500** | ₹620 |
| 50 | ₹4,500 | ₹9,000 | ₹900 | ₹1,800 | ₹1,100 | ₹2,000 | ₹700 | **₹20,000** | ₹400 |
| 100 | ₹6,300 | ₹13,500 | ₹900 | ₹2,700 | ₹1,800 | ₹2,340 | ₹960 | **₹28,500** | ₹285 |
| 250 | ₹11,000 | ₹22,000 | ₹1,800 | ₹5,500 | ₹3,600 | ₹3,600 | ₹2,500 | **₹50,000** | ₹200 |
| 500 | ₹18,000 | ₹36,000 | ₹3,000 | ₹9,900 | ₹6,300 | ₹5,400 | ₹4,400 | **₹83,000** | ₹166 |
| 1000 | ₹31,500 | ₹63,000 | ₹5,400 | ₹18,000 | ₹11,700 | ₹9,000 | ₹9,400 | **₹1,48,000** | ₹148 |

**Variable infra COGS per org per month by student slab** (storage, DB rows, function invocations, email scale with students):

| Slab | ≤50 | 51–100 | 101–200 | 201–500 | 500+ |
|---|---|---|---|---|---|
| Infra COGS/org/mo | ₹150 | ₹220 | ₹320 | ₹550 | ₹900 |

---

## 5. Operational Cost Analysis

Team cost by stage (monthly):

| Stage (customers) | Team | Ops cost/mo |
|---|---|---|
| 10 | 2 founders + 1 support (part allocation) | ₹1,50,000 |
| 25 | + 1 sales | ₹2,00,000 |
| 50 | + 1 engineer, +1 support | ₹3,00,000 |
| 100 | 2 eng, 2 support, 1 CS, 2 sales, marketing ₹80k | ₹4,50,000 |
| 250 | 3 eng, 3 support, 2 CS, 3 sales, PM, marketing ₹1.2L | ₹7,50,000 |
| 500 | Scaled ~1.7× | ₹13,00,000 |
| 1000 | Scaled ~1.7× | ₹22,00,000 |

Support + CS allocation per customer at steady state (100+): **≈ ₹1,100/org/mo** — used in the fully-loaded margin check, not in the product gross-margin figure.

---

## 6. Pricing Formula

```
Direct COGS      = Infra(slab) + AI allowance cost + Gateway (2% of price)
Loaded COGS      = Direct COGS × 1.25          (25% operational overhead)
Floor Price      = Loaded COGS ÷ (1 − 0.50)    (50% minimum profit margin)
Published Price  ≥ Floor Price                  (then positioned vs. market)
Gross Margin     = (Price − Direct COGS) ÷ Price
Annual Price     = Monthly × 10                 (2 months free = 16.7% off)
Cost/Student     = Price ÷ slab midpoint
```

Worked example — Enterprise, 101–200 slab (midpoint 150):
```
Direct COGS  = 320 (infra) + 40 (200 AI credits × ₹0.20) + 2%·P
Take P = 4,999 → gateway = 100 → Direct COGS = ₹460
Loaded COGS  = 460 × 1.25 = ₹575
Floor Price  = 575 ÷ 0.5 = ₹1,150  →  published ₹4,999 clears floor 4.3×
Gross Margin = (4,999 − 460) / 4,999 = 90.8%
Fully loaded (incl. ₹1,100 support/CS + ops overhead) ≈ 69% — within the 70–80% glide path
```

The gap between floor and published price is deliberate: it funds CAC, R&D, and the Admin-portal discretionary discounts (Section 17) without ever breaching the 50% floor.

---

## 7. Subscription Plans

### Plan 1 — List Your Institution (FREE)
Marketplace acquisition tier. Public profile on Vidhyaan directory: logo, contact, address, courses, website link, basic enquiry form.

**Recommended limits:** 2 users · 25 student records · 25 enquiries/month · no AI, no WhatsApp, no SMS · Vidhyaan branding on profile + emails · community support. Every signup gets a **7-day full-Enterprise trial** (all modules, 25 bundled AI credits, no card required); on expiry the org drops to Free automatically (maps to `SubscriptionStatus.TRIALING` → downgrade job).

### Plan 2 — Admission CRM (Lead, Admission & Campaign Management)
Lead management, admission pipeline (list/grid/kanban), enquiry management, counsellor management, follow-ups, tasks, campaigns, events, dashboard, reports (core), roles & users. **10 users included.**

### Plan 3 — Fee & Student Management
Student management (incl. promotion wizard), fee structures, invoices, Razorpay collection, receipts, dues, payment reports, financial dashboard. **10 users included.** Priced above Plan 2 — fee collection is the highest-willingness-to-pay module (it touches money).

### Plan 4 — Enterprise ⭐ (flagship)
Everything: Plans 2+3, parent portal, AI assistant / AI reports / AI analytics / AI search / AI insights, advanced reports (all 14 + 3 dashboards), events + announce, communication, integrations, all settings, future premium features. **Unlimited users. Bundled AI credits/month by slab: 100 / 150 / 200 / 300 / 500.** Priority support.

---

## 8. Student Slab Pricing Tables

Monthly price (₹, excl. GST) · Annual = 10 × monthly. GM = product gross margin per §6 (infra + AI allowance + 2% gateway).

**v1.1 adjustments (aggressive-SMB strategy):** the ≤50 slab of every paid plan carries a **higher list price with a launch offer** (anchor high, invoice low — e.g. Enterprise ≤50 lists at ₹2,499, invoices at ₹1,999). The 500+ slab is **"starting at"** pricing covering up to 1,000 students, plus per-student overage beyond 500 (Admission CRM ₹5, Fee & Student ₹7, Enterprise ₹10 per student/mo); above 1,000 students → custom quote via admin override. Implementation-ready catalog: `src/lib/pricing/catalog.ts`.

### Plan 2 — Admission CRM

| Slab | Monthly | Annual | Annual saving | Cost/student/mo* | Gross margin |
|---|---|---|---|---|---|
| ≤ 50 | ₹999 | ₹9,990 | ₹1,998 (16.7%) | ₹29 | 83% |
| 51–100 | ₹1,499 | ₹14,990 | ₹2,998 | ₹20 | 83% |
| 101–200 | ₹2,499 | ₹24,990 | ₹4,998 | ₹17 | 85% |
| 201–500 | ₹3,999 | ₹39,990 | ₹7,998 | ₹11 | 84% |
| 500+ | ₹5,999 | ₹59,990 | ₹11,998 | ₹8† | 83% |

### Plan 3 — Fee & Student Management

| Slab | Monthly | Annual | Annual saving | Cost/student/mo* | Gross margin |
|---|---|---|---|---|---|
| ≤ 50 | ₹1,199 | ₹11,990 | ₹2,398 | ₹34 | 85% |
| 51–100 | ₹1,799 | ₹17,990 | ₹3,598 | ₹24 | 86% |
| 101–200 | ₹2,999 | ₹29,990 | ₹5,998 | ₹20 | 87% |
| 201–500 | ₹4,999 | ₹49,990 | ₹9,998 | ₹14 | 87% |
| 500+ | ₹7,499 | ₹74,990 | ₹14,998 | ₹10† | 86% |

### Plan 4 — Enterprise ⭐

| Slab | Monthly | Annual | Annual saving | Cost/student/mo* | Bundled AI | Gross margin |
|---|---|---|---|---|---|---|
| ≤ 50 | ₹1,999 | ₹19,990 | ₹3,998 | ₹57 | 100 cr | 89% |
| 51–100 | ₹2,999 | ₹29,990 | ₹5,998 | ₹40 | 150 cr | 90% |
| 101–200 | ₹4,999 | ₹49,990 | ₹9,998 | ₹33 | 200 cr | 91% |
| 201–500 | ₹7,999 | ₹79,990 | ₹15,998 | ₹23 | 300 cr | 90% |
| 500+ | ₹11,999 | ₹1,19,990 | ₹23,998 | ₹16† | 500 cr | 89% |

\* at slab midpoint (35 / 75 / 150 / 350 / 750). † 500+ priced to 1,000 students; above 1,000 → custom quote (₹10–₹14/student/mo, Admin-portal override).

Positioning check: Enterprise at 101–200 students = ₹33/student/mo ≈ **₹400/student/yr** — a school recovers this from ONE saved admission (avg first-year fee ₹25,000+). That is the core sales narrative.

---

## 9. Feature Comparison Matrix

| Capability | Free | Admission CRM | Fee & Student | Enterprise ⭐ |
|---|---|---|---|---|
| Directory listing + enquiry form | ✓ | ✓ | ✓ | ✓ (branding removed) |
| Users | 2 | 10 | 10 | Unlimited |
| Student records | 25 | Slab limit | Slab limit | Slab limit |
| Lead & pipeline management | — | ✓ | — | ✓ |
| Admission CRM + documents | — | ✓ | — | ✓ |
| Campaigns & events | — | ✓ | — | ✓ |
| Student management + promotion | — | Profile only | ✓ | ✓ |
| Fee, invoices, Razorpay collection | — | — | ✓ | ✓ |
| Parent portal | — | — | — | ✓ |
| AI assistant / reports / analytics / search / insights | — | — | — | ✓ (+ bundled credits) |
| Advanced reports (14) + role dashboards | — | Core | Core | ✓ |
| WhatsApp / SMS add-ons purchasable | — | ✓ | ✓ | ✓ |
| Email templates customization | — | ✓ | ✓ | ✓ |
| Support | Community | Email | Email | Priority (chat + phone) |

---

## 10. Add-On Pricing — WhatsApp & SMS

### WhatsApp conversation packs
Meta blended cost ₹0.38/conversation (60% utility ₹0.115 / 40% marketing ₹0.78).

| Pack | Price | Per conv | Meta cost | Vidhyaan margin |
|---|---|---|---|---|
| 500 | ₹399 | ₹0.80 | ₹190 | ₹209 (52%) |
| 1,000 | ₹749 | ₹0.75 | ₹380 | ₹369 (49%) |
| 2,500 | ₹1,749 | ₹0.70 | ₹950 | ₹799 (46%) |
| 5,000 | ₹3,249 | ₹0.65 | ₹1,900 | ₹1,349 (42%) |
| Enterprise unlimited | ₹8,999/mo (20k fair-use) | ₹0.45 | ₹7,600 | 16% + lock-in |

> **Action:** current catalog in `src/lib/credits/constants.ts` (wa_500 = ₹350) is below the 50%-floor for marketing-heavy senders — update to the table above. BYO MSG91 credentials continue to bypass credit deduction (existing `metered-send.ts` behavior); BYO orgs pay ₹0 per message but forgo bundled support for delivery issues.

### SMS packs
Gateway ₹0.18/SMS (₹0.16 above 25k/mo).

| Pack | Price | Per SMS | Gateway cost | Margin |
|---|---|---|---|---|
| 1,000 | ₹349 | ₹0.35 | ₹180 | 48% |
| 5,000 | ₹1,499 | ₹0.30 | ₹900 | 40% |
| 10,000 | ₹2,699 | ₹0.27 | ₹1,800 | 33% |
| 25,000 | ₹5,999 | ₹0.24 | ₹4,000 | 33% |

> **Action:** current sms_500 pack (₹100 = ₹0.20/SMS) is at cost — retire it. Communication add-ons are strategic (retention + habit), so 33–50% margin is acceptable; blended add-on margin stays >40% and blended company margin >78% because subscriptions dominate revenue.

---

## 11. AI Credit Pricing

**1 credit = 1 AI action.** Token/cost model (hosted-OSS 70B-class, $0.25/$0.75 per MTok):

| Action | Tokens in/out | Cost/action | Credits |
|---|---|---|---|
| AI Chat message | 3k / 1k | ₹0.13 | 1 |
| AI Search query | 2k / 0.5k | ₹0.08 | 1 |
| Smart recommendation | 4k / 1k | ₹0.16 | 1 |
| AI Report generation | 12k / 3k | ₹0.47 | 3 |
| AI Insights digest | 10k / 2k | ₹0.38 | 2 |
| Parent Assistant reply | 2k / 0.5k | ₹0.08 | 1 |

Weighted average cost per credit ≈ **₹0.20** (usage mix: 55% chat/search, 25% recommendations, 20% reports/insights).

| Pack | Credits | Price | Per credit | AI cost | Margin |
|---|---|---|---|---|---|
| Starter | 100 | ₹75 | ₹0.75 | ₹20 | 73% |
| Growth | 500 | ₹250 | ₹0.50 | ₹100 | 60% |
| Professional | 1,000 | ₹500 | ₹0.50 | ₹200 | 60% |
| Enterprise | 5,000 | ₹1,999 | ₹0.40 | ₹1,000 | 50% |

Starter/Growth/Professional **match the already-shipped catalog** (`ai_100/₹75, ai_500/₹250, ai_1000/₹500`) — validated against cost; ship as-is. Add the 5,000 pack. Credits expire 12 months after purchase; bundled Enterprise-plan credits reset monthly (no rollover).

---

## 12. Revenue Projection

Assumptions: blended ARPU ₹4,300/mo (₹3,600 subscription — mix 20% Plan 2, 30% Plan 3, 50% Enterprise, mostly 51–200 slabs — plus ₹700 add-ons). COGS = infra (§4) + add-on COGS + gateway ≈ 13–15% of revenue. Ops from §5.

| Customers | MRR | ARR | Infra/mo | Total COGS/mo | Ops/mo | Gross profit/mo | Net profit/mo | Net margin |
|---|---|---|---|---|---|---|---|---|
| 10 | ₹43,000 | ₹5.16L | ₹12,400 | ₹13,500 | ₹1,50,000 | ₹29,500 | −₹1,20,500 | −280% |
| 25 | ₹1,07,500 | ₹12.9L | ₹15,500 | ₹22,000 | ₹2,00,000 | ₹85,500 | −₹1,14,500 | −107% |
| 50 | ₹2,15,000 | ₹25.8L | ₹20,000 | ₹38,000 | ₹3,00,000 | ₹1,77,000 | −₹1,23,000 | −57% |
| 100 | ₹4,30,000 | ₹51.6L | ₹28,500 | ₹65,000 | ₹4,50,000 | ₹3,65,000 | −₹85,000 | −20% |
| **170 (break-even)** | **₹7,31,000** | **₹87.7L** | ₹40,000 | ₹1,05,000 | ₹6,25,000 | ₹6,26,000 | **≈ ₹0** | 0% |
| 250 | ₹10,75,000 | ₹1.29Cr | ₹50,000 | ₹1,55,000 | ₹7,50,000 | ₹9,20,000 | ₹1,70,000 | 16% |
| 500 | ₹21,50,000 | ₹2.58Cr | ₹83,000 | ₹2,95,000 | ₹13,00,000 | ₹18,55,000 | ₹5,55,000 | 26% |
| 1000 | ₹43,00,000 | ₹5.16Cr | ₹1,48,000 | ₹5,70,000 | ₹22,00,000 | ₹37,30,000 | ₹15,30,000 | 36% |

**Gross margin trajectory:** 69% at 10 customers → 85% at 250 → 87% at 1,000. Objective (70–80%+) achieved from ~50 customers onward.

### Unit economics
```
LTV  = ARPU × Gross margin × Lifetime = 4,300 × 0.85 × 36 mo = ₹1,31,580
CAC  = ₹15,000 (inside sales + digital, edu SMB)
LTV : CAC = 8.8 : 1        CAC payback = 15,000 ÷ (4,300 × 0.85) = 4.1 months
```
(Lifetime held at a conservative 36 months although 15% annual churn implies ~6.7 years.)

---

## 13. Break-even Analysis

```
Contribution per customer/mo = ARPU − variable COGS = 4,300 − 620 ≈ ₹3,680
Fixed cost at scale-stage    ≈ ₹6,25,000/mo (ops, ~170-customer team)
Break-even customers         = 6,25,000 ÷ 3,680 ≈ 170
```
At 15 net-new customers/month from month 6, break-even lands **month 20–24**. Sensitivity: ARPU −10% → break-even 190 customers; ops +20% → 205 customers. Both survivable within the same funding envelope (~₹35–45L cumulative burn to break-even).

---

## 14. Profitability Analysis

- **Subscriptions (≈84% of revenue):** 83–91% gross margin — the profit engine.
- **AI credits:** 50–73% margin, near-zero support burden; margin improves as hosted-OSS token prices fall (every price cut flows to margin at fixed credit prices).
- **WhatsApp/SMS:** 33–52% margin — lowest-margin lines but highest habit-forming value; treat as retention infrastructure, cap at fair-use to avoid margin inversion.
- **Razorpay pass-through on fee collection:** school-fee MDR is charged to the school/parent, not absorbed by Vidhyaan — Vidhyaan's 2% cost applies only to its own subscription collections.
- Margin risk to watch: Neon compute at always-on 2 CU is the largest fixed infra line; revisit autoscaling bands at 250+ customers.

---

## 15. Competitive Benchmark

| Product | Indicative pricing (2026) | CRM | Admission | Fees | AI | Parent portal | Analytics | Scalability | Support |
|---|---|---|---|---|---|---|---|---|---|
| **Vidhyaan** | ₹999–₹11,999/mo slab (₹8–₹57/student/mo) | ●●● | ●●● | ●●● | ●●● native | ●●● | ●●● (14 reports, 3 dashboards) | Multi-tenant cloud | Priority chat/phone |
| LeadSquared | ₹1,500–₹3,000/user/mo (₹15–30k/mo for 10 users) | ●●● | ●● (generic) | — | ●● | — | ●●● | High | Enterprise |
| Teachmint | ₹25–₹60/student/yr | ● | ●● | ●● | ● | ●● | ●● | High | Standard |
| Fedena | ₹40–₹75/student/yr (self-host/cloud ERP) | ● | ●● | ●●● | — | ●● | ●● | Medium | Ticket |
| MyClassCampus | ₹35–₹60/student/yr | ●● | ●● | ●●● | ● | ●●● | ●● | Medium | Standard |
| Entab | ₹1–2L+/yr, large schools | ● | ●● | ●●● | — | ●● | ●● | On-prem/cloud | Managed |
| OpenEduCat | Free OSS + ₹50k–1.5L/yr hosting/impl. | ● | ●● | ●● | — | ● | ● | Self-managed | Community/paid |
| Classter | $2–4/student/yr (₹180–360) | ●● | ●●● | ●●● | ●● | ●●● | ●●● | High | Intl. hours |

**Why Vidhyaan wins on price:** LeadSquared costs 3–6× more for CRM alone with zero fee management. ERP players (Fedena/Entab/MyClassCampus) have fee modules but weak-to-no lead/admission CRM and no native AI — Vidhyaan Enterprise at ₹400/student/yr sits inside their price band while covering both funnels (acquisition + operations) plus AI. Classter is priced for international schools and lacks India-specific rails (Razorpay, DLT SMS, WhatsApp BSP, GST invoicing). Vidhyaan is the only product in the set with metered AI monetization built in.

---

## 16. Subscription Module Design (in-product)

Builds on existing `billing` schema (Plan, PlanModule, Subscription, SubscriptionItem, Transaction) and `src/lib/credits/` wallets.

| Concern | Design |
|---|---|
| Plans & slabs | `Plan` (4 rows) × `PlanPrice` (new — per slab per cycle); slab auto-detected from active student count, re-evaluated nightly |
| Free trial | Signup → Enterprise `TRIALING`, `trialEndsAt = +7d`; cron downgrades to Free on expiry; one trial per org (guard on org creation) |
| Upgrade | Immediate; prorated charge = (new − old) × remaining days ÷ period days; modules unlock instantly via org-cache bust |
| Downgrade | Scheduled at period end (`cancelAtPeriodEnd` pattern generalized to `pendingPlanId`); data retained read-only for locked modules |
| Slab overflow | Soft warning at 90% of slab, hard prompt at 100%+30 days; auto-suggest next slab (never silent auto-charge) |
| Renewal / auto-renew | Razorpay subscription (`gatewaySubId`) for cards/UPI-autopay; else 15/7/3/1-day email+WhatsApp reminders; webhook-driven, fail-closed |
| Grace period | 7 days (`graceEndsAt`): full access + banner → then read-only 30 days → then suspended (data retained 90 days) |
| Coupons | `Coupon` (percent/flat, max redemptions, expiry, plan/slab scope) + `CouponRedemption`; stacks with annual discount up to floor-price guard |
| Referral | Both sides get 1 month free on referee's first paid invoice; tracked as 100% one-period coupon |
| GST | 18%, SAC 998314 on all invoices (already in `Transaction` design); GSTIN captured in org billing profile; e-invoice ready |
| Invoices & history | Auto-generated PDF per transaction; billing history page lists subscription charges + add-on purchases + credit-pack buys |
| Usage metering | `UsageSnapshot` daily (students, users, messages sent, AI credits burned) — powers slab detection, in-app meters, and admin analytics |
| Wallets | Existing SMS/WhatsApp/AI `CreditWallet` + ledger; low-balance alerts at 20%/5%; auto-top-up opt-in |
| Notifications | Trial D5/D6/D7, renewal reminders, payment failed, grace entered, slab overflow, wallet low — via email + WhatsApp utility |
| Admin controls | Platform admin: change org plan/slab, custom price override, extend trial, apply coupon, comp credits, pause/suspend (Section 17) |
| School vs Learning Centre | Same engine; LC orgs see "learners" terminology, course/batch widgets, and trial-class-conversion reports (already institution-aware); slab counts enrolled learners in active batches |

---

## 17. Admin Portal — Per-Customer Custom Pricing (requested feature)

New page: **`/admin/orgs/[id]/subscription`** (SUPER_ADMIN + billing role).

- **Overview**: current plan, slab, cycle, MRR, wallet balances, usage meters, payment health.
- **Custom offer builder**: override monthly/annual price OR set `discountPct` (existing field) with validity window; floor-price guard blocks offers below `(COGS×1.25)÷0.5` unless SUPER_ADMIN confirms with reason (audit-logged).
- **Actions**: switch plan/slab, extend trial, grant complimentary AI/SMS/WA credits, apply coupon, schedule downgrade, pause subscription.
- **Offer letter**: generates a shareable quote (PDF/link) the school admin sees on their billing page as a claimable offer with expiry.
- Schema addition: `OrgPlanOverride` (see §18) rather than mutating `Plan` rows — public catalog stays clean, negotiated deals stay per-org and auditable.

---

## 18. Database Schema (delta on existing `billing` schema)

Existing and kept: `Plan`, `PlanModule`, `Subscription`, `SubscriptionItem`, `Transaction`, `CreditWallet`/`CreditLedger` (SMS/WHATSAPP/AI), `PaymentGatewayConfig`.

New entities:

```prisma
model PlanPrice {            // slab pricing per plan
  id            String  @id @default(cuid())
  planId        String
  slab          StudentSlab   // S50 | S100 | S200 | S500 | S500_PLUS
  monthlyPrice  Decimal @db.Decimal(12,2)
  annualPrice   Decimal @db.Decimal(12,2)
  bundledAiCredits Int  @default(0)
  @@unique([planId, slab])
}

model OrgPlanOverride {      // admin-negotiated custom pricing (§17)
  id          String   @id @default(cuid())
  orgId       String   @unique
  planId      String
  slab        StudentSlab?
  monthlyPrice Decimal? @db.Decimal(12,2)
  annualPrice  Decimal? @db.Decimal(12,2)
  discountPct  Int?
  reason      String
  createdBy   String        // platform admin user id
  validFrom   DateTime
  validUntil  DateTime?
  @@index([orgId])
}

model Coupon {
  id          String   @id @default(cuid())
  code        String   @unique
  type        CouponType   // PERCENT | FLAT
  value       Decimal  @db.Decimal(12,2)
  planScope   String?      // optional plan slug
  maxRedemptions Int?
  expiresAt   DateTime?
  isReferral  Boolean  @default(false)
  redemptions CouponRedemption[]
}

model CouponRedemption {
  id        String @id @default(cuid())
  couponId  String
  orgId     String
  transactionId String?
  @@unique([couponId, orgId])
  @@index([orgId])
}

model UsageSnapshot {        // daily metering (IST days, same pattern as reporting rollups)
  id          String @id @default(cuid())
  orgId       String
  day         DateTime @db.Date
  activeStudents Int
  activeUsers    Int
  smsSent Int; waSent Int; aiCreditsUsed Int
  storageMb   Int
  @@unique([orgId, day])
  @@index([day])
}
```

Relationships: `Plan 1—n PlanPrice`; `Organization 1—0..1 OrgPlanOverride`; `Organization 1—n UsageSnapshot`; `Coupon 1—n CouponRedemption n—1 Organization`; renewals reuse `Subscription` + `Transaction` (one transaction per period). All tables tenant-guarded via existing fail-closed `forOrg` client where org-scoped; platform-admin access via platform client. Indexes as annotated; all money `Decimal(12,2)`; soft-delete columns per house style.

Effective price resolution order: **OrgPlanOverride → Coupon → PlanPrice(slab, cycle)** — with the floor-price guard evaluated last.

---

## 19. UX Flow

```
Registration → org created (Free) + 7-day Enterprise trial auto-starts
  Trial banner: days left + "Choose plan" CTA · D5/D6/D7 nudges
Plan selection (/settings/billing/plans)
  Slab auto-detected from student count · monthly/annual toggle
  (annual pre-selected, savings badge) · coupon field · GST preview
Payment → Razorpay checkout (UPI/card/netbanking) → webhook activates
  → success screen → modules unlock live (org-cache bust)
Dashboard → subscription widget: plan, slab meter (e.g. 142/200 students),
  wallet balances, renewal date
Upgrade → compare drawer → prorated diff shown → pay → instant unlock
Renewal → auto-renew (UPI autopay) or reminder emails/WA at T−15/7/3/1
Add-on purchase → Settings → Add-ons (existing UI) → pack picker →
  Razorpay → wallet credited + ledger entry
Invoices → billing history table → PDF download (GST invoice)
Expiry → 7-day grace (full access + red banner) → read-only 30 days
  → suspended (data kept 90 days)
Cancellation → survey → cancelAtPeriodEnd → confirm email
Reactivation → any time from read-only/suspended state → pay → restored
  (wallets and data intact)
```

School admin sees fee-centric framing ("collect fees online from day 1"); learning-centre admin sees batch/trial-class framing — same engine, institution-aware copy (pattern already used in reports).

---

## 20. Implementation Roadmap

| Phase | Scope | Effort |
|---|---|---|
| **1 (wk 1–2)** | `PlanPrice` + slab detection + seed 4 plans × 5 slabs; update credit-pack catalog (§10/§11 prices); GST fields on org billing profile | S |
| **2 (wk 3–4)** | Plan-selection + checkout flow (Razorpay one-time), trial downgrade cron, grace/read-only enforcement in `route()` composer license guard | M |
| **3 (wk 5–6)** | Billing history + GST invoice PDFs; renewal reminders (email/WA); `UsageSnapshot` cron + slab-overflow prompts | M |
| **4 (wk 7–8)** | Admin `/admin/orgs/[id]/subscription` custom-offer page + `OrgPlanOverride` + floor-price guard + audit log | M |
| **5 (wk 9–10)** | Coupons + referrals; auto-renew via Razorpay subscriptions/UPI autopay; auto-top-up wallets | M |
| **6 (ongoing)** | Pricing telemetry: plan-mix, slab distribution, add-on attach rate, discount depth — feed quarterly price reviews | S |

---

## 21. Risks & Assumptions

| Risk | Exposure | Mitigation |
|---|---|---|
| WhatsApp/Meta price changes (frequent) | Add-on margin swings | Reprice packs quarterly; per-conversation costs stored in config, not code |
| AI token costs drift | AI margin | Hosted-OSS strategy already hedges; credits abstract the model — swap providers without repricing |
| Slab gaming (understating students) | Revenue leakage | Nightly `UsageSnapshot` slab detection + 30-day overflow enforcement |
| Annual-heavy cash flow, monthly churn signal hidden | Retention blind spot | Track product usage (logins, messages) as leading churn indicator in CS dashboards |
| Discount creep via admin overrides | Margin erosion | Hard floor-price guard + audit log + monthly discount-depth report |
| ARPU mix worse than 50% Enterprise | Break-even slips to ~200 | Trial defaults to Enterprise; AI features are trial's hero moments |
| GST/e-invoicing compliance changes | Billing rework | Razorpay-issued invoices + SAC 998314 already in schema; keep invoice generation server-side and versioned |
| Assumed rates (Meta, MSG91, Neon, FX) shift | All costs | All unit costs centralized in a pricing-config table; §6 formula re-runs automatically |

**Key assumptions:** ₹90/USD; 15% annual churn; 60/40 utility/marketing WhatsApp mix; 36-month LTV lifetime (conservative); customer mix 20/30/50 across Plans 2/3/4; India-only GTM through 1,000 customers.

---

*End of document. Prices in Sections 8, 10, 11 are implementation-ready for `PlanPrice` seed data and `src/lib/credits/constants.ts`.*
