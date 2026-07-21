# Campaign Platform Enhancement — Solution Design Plan (2026-07)

Status: **DRAFT — awaiting approval. Do not implement until signed off.**

Covers marketing/campaign email + SMS + WhatsApp for all Schools and Learning Centres, post go-live.

---

## 0. Current state (grounding)

| Area | Today |
|------|-------|
| Models | `crm.Campaign`, `crm.CampaignRecipient` (channel, status funnel PENDING→SENT→DELIVERED→READ→FAILED) |
| Send | `/api/v1/campaigns/[id]/send` — batches of 50, plan quota (email) / credit metering (SMS+WA) |
| Email transport | ZeptoMail (`api.zeptomail.in`) primary, SES (`ap-south-1`) failover; single shared domain |
| From-address | Transactional `noreply@vidhyaan.com`; Campaign `campaigns@vidhyaan.com` (platform-config `zeptoCampaignEmail`) |
| Limits | **Monthly** email quota by plan (free 0 / starter 500 / growth 5000 / ent ∞). No **daily** cap. SMS/WA credit-metered, no daily safety cap |
| Bounce | Zepto hard-bounce webhook → platform suppression list only. **Not attributed to campaign.** No bounce rate |
| Open/Click | `stats.openRate`/`clickRate` fields exist but never populated |
| Preview | None. No image in campaign body. No test-send |
| Custom domain | Not supported — every org sends from `campaigns@vidhyaan.com`. Org `fromEmailAddress` field exists but unused by campaigns |

---

## 1. Daily send limits (recommended defaults)

**Why daily, not just monthly:** all orgs currently share ONE sending domain/IP reputation. A spike from any org degrades OTP + fee-reminder deliverability for everyone. Daily caps + a platform aggregate ceiling protect shared reputation and cap runaway spend.

### Per-org daily defaults

**Channel governance differs — email is part of the base plan; SMS + WhatsApp are ADD-ONS (credit-metered) available on any plan.** So only email scales by plan tier. SMS/WA daily caps are a flat anti-spike safety valve, not a monetization lever — the credit wallet is the real limit.

**Email** scales by plan tier. **SMS + WhatsApp** are **paid add-ons purchasable on any plan** — their cap is purchase-gated, NOT plan-gated (plan tier irrelevant).

| Channel | Gate | Daily cap |
|---------|------|-----------|
| **Email** | base plan quota | Free 0 · Starter 50 · Growth 100 · Enterprise 500 (soft, admin-raisable) |
| **SMS** | paid add-on (any plan) + wallet | flat **1,000/day** if add-on purchased, else 0 — wallet balance is the real limit |
| **WhatsApp** | paid add-on (any plan) + wallet | flat **1,000/day** if add-on purchased, else 0 — + Meta per-WABA tier; wallet is the real limit |

Notes:
- **Plans (real):** 4 slugs `free / starter / growth / enterprise`; display names differ (Starter=CRM Package, Growth=Fee Management). Pricing scales by **student slab** (S50→S500+), not a flat per-plan number.
- **Email** daily cap sits **alongside** the existing monthly quota (whichever is hit first blocks). **Decision: option (b)** — monthly quota (starter 500, growth 5000, enterprise ∞) stays the real ceiling; the low daily cap (50/100/500) is a pure anti-spike valve to protect shared-domain reputation. Daily never overshoots monthly.
- ⚠️ **Bug to fix:** quota + send routes have no `enterprise` branch → enterprise silently gets the 500/mo default. Fix regardless.
- **SMS/WhatsApp** are credit-metered (spend controls cost); the flat daily cap only guards against fat-finger blasts, India DLT abuse flags, and wallet drain — independent of plan tier. Add-on not purchased → 0.
- WhatsApp real ceiling is Meta's per-WABA messaging tier (1K→10K→100K unique/24h). On the **shared** Vidhyaan WABA the flat cap keeps any one org inside the shared budget; BYO-WABA orgs use their own Meta tier.
- **School vs LC:** no institution-type differentiation — email by plan, SMS/WA flat. LCs skew smaller so slabs already fit. Single config table, per-org override for enterprise/custom quotes.

### Implementation shape
- Store defaults in a `campaign_limits` config (platform settings or a small table keyed by plan slug + channel), never hard-coded like the current quota `if` ladder.
- Per-org override column (mirrors existing per-org discount cap pattern).
- Enforce in `send` route: `daily_used = campaignRecipient.count(sentAt >= startOfDayIST)` per channel, block/queue overflow.

---

## 2. Dedicated campaign sub-domain (reputation isolation)

**Yes — use a dedicated subdomain for campaigns.** Marketing complaints/bounces must not poison the transactional domain that carries OTP, 2FA, fee links.

**Decision: `send.vidhyaan.com`.**
- Transactional (keep): `vidhyaan.com` / `noreply@vidhyaan.com`
- Campaigns (new): **`send.vidhyaan.com`** → `campaigns@send.vidhyaan.com`

Steps:
1. Add subdomain as a **separate verified identity** in both ZeptoMail (Mail Agent) and SES — own DKIM keys, SPF, DMARC (`p=quarantine` → tighten to `reject`).
2. Point platform-config `zeptoCampaignEmail` at the new subdomain address. Transactional untouched — zero risk to OTP path.
3. Warm up: campaign daily caps (§1) double as warmup throttle for the fresh subdomain reputation.

Low effort (config + DNS), high payoff. **Do this before opening campaigns to all orgs at go-live.**

---

## 3. Rich email body — image + live preview

- Add optional **hero image** to campaign email (channels.ts already renders `imageUrl` for the event-announce path; wire the same into the campaign path).
  - Store `heroImageUrl` on `Campaign` (new nullable column) — upload via existing S3 `uploads/{orgId}/campaign/`.
- **Live preview pane** in the compose builder: render the exact `renderEmailHtml` output client-side as the user types (subject, body, `{name}`/`{{link}}` tokens shown with sample values).
- Keep body plain-text-with-tokens for v1 (already supported). A block/drag builder is Phase 2 — not required for launch.

---

## 4. Test-send (preview real render)

- "Send test" button in compose → sends ONE message to the logged-in user's email (or a typed address) through the **transactional** pipeline.
- Bypasses quota + credit debit; watermark subject `[TEST]`.
- Uses identical render path as real send so WYSIWYG holds.
- SMS/WhatsApp test-send: same idea, send to the composer's own phone (WA needs an approved template — send with sample params).

---

## 5. Bounce / delivery tracking per campaign

Today bounces only hit the global suppression list. Add per-campaign attribution + rates.

### Schema
- Extend `CampaignSendStatus`: add `BOUNCED`, `COMPLAINED` (email), keep FAILED for send-time errors.
- Add `providerMessageId` capture for **email** (Zepto/SES message id) and **SMS** (MSG91 request id) — WhatsApp already stores `wamid`.

### Wiring
- **Email:** extend Zepto bounce webhook + SES notification webhook to, in addition to suppressing, match the recipient (by message id, else by email + most-recent SENDING/COMPLETED campaign within N hours) and set `BOUNCED`/`COMPLAINED` + `deliveredAt` on delivered events. Capture opens/clicks if Zepto open-tracking webhook is enabled → populate `stats.openRate`/`clickRate` (fields already there).
- **SMS:** wire MSG91 DLR (delivery report) webhook → update recipient DELIVERED/FAILED by request id.
- **WhatsApp:** already updates by `wamid` via Meta webhook — add categorized failure reasons.

### Analytics
- Add `bounceRate`, `complaintRate` to `/campaigns/[id]/analytics` and the Campaign Effectiveness report.
- Surface a **domain-health** guardrail: if a campaign's bounce rate > 5% or complaint > 0.1%, auto-pause the org's campaigns + alert admin (protects shared subdomain).

---

## 6. Per-org custom sending domain (BYO email domain)

Mirror the existing **BYO MSG91** pattern for email.

### Design
- New `crm.OrgSendingDomain` (or fields on org settings): `domain`, `fromLocalPart`, `fromName`, `status` (PENDING/VERIFIED/FAILED), `dkimTokens`, verification timestamps.
- Settings → Add-ons (or School Profile) UI: user enters domain → app shows **DNS records to add** (DKIM CNAMEs, SPF include, DMARC) → "Verify" polls provider until verified.
- **Provider:** use **SES verified identities** — one SES account holds many verified domains, DKIM per identity, already integrated (`src/lib/integrations/ses.ts`). Cleanest fit; no new vendor. (ZeptoMail Mail-Agent-per-domain is possible but heavier to automate.)
- On send: if org domain `VERIFIED` → `from = org address` via SES; else fall back to shared `campaigns@send.vidhyaan.com`.
- Suppression + bounce tracking must be **per-domain aware** so one org's own-domain bounces don't suppress addresses globally for others (scope suppression to org when a custom domain is used).

### Rollout
- **Decision: Enterprise plan only** (deliverability + white-label = flagship selling point).
- All other orgs (free/starter/growth) stay on shared `send.vidhyaan.com` (§2) — zero setup.

---

## 7. A/B testing — recommendation: **defer to Phase 2**

Not needed for launch. Adds real complexity (variant model, split assignment, winner logic, stats significance) for a base that doesn't yet have open/click tracking (§5 is the prerequisite).

When built (Phase 2): email-only, 2 variants (subject and/or body), send to a % sample, pick winner by open/click after a window, auto-send winner to remainder. Requires §5 open/click first.

---

## Phasing

**Phase 1 — Launch-critical (do before opening campaigns to all orgs)**
1. Dedicated campaign subdomain + DNS/DKIM (§2) — reputation isolation.
2. Daily send caps per plan + per-org override (§1).
3. Test-send + live preview (§4, §3-preview).
4. Hero image in campaign email (§3).

**Phase 2 — Deliverability & insight**
5. Per-campaign bounce/delivery/open tracking + auto-pause guardrail (§5).
6. BYO custom sending domain via SES (§6).

**Phase 3 — Optimization**
7. A/B testing (§7).
8. Block/drag email builder.

---

## Decisions — RESOLVED
1. ✅ Subdomain: **`send.vidhyaan.com`**.
2. ✅ Email daily caps: Free 0 / Starter 50 / Growth 100 / Enterprise 500; monthly quota stays real ceiling (option b).
3. ✅ SMS + WhatsApp: paid add-on (any plan), flat 1,000/day if purchased else 0, wallet is real limit.
4. ✅ BYO custom sending domain: **Enterprise plan only**.
5. ✅ A/B testing + BYO domain deferred (P3/P2); Phase 1 = launch bar.

Plan fully specified — ready to implement on approval.
