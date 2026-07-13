# Vidhyaan Mobile App — Feature, Architecture & Implementation Plan

*Drafted 2026-07-12. Status: proposal.*

Goal: hybrid mobile app (Android + iOS) with a **simple, action-first UI** for three
audiences — **Org staff** (schools, learning centres, colleges, coaching centres),
**Parents**, and the **Vidhyaan platform admin team**. The web app stays the
full-featured console; mobile is for the top daily actions and monitoring.

---

## 1. Guiding principles

1. **Mobile = act + monitor. Web = configure.** No builders, pricing setup, template
   editors, or settings screens on mobile. Anything needing a big form stays on web
   with a deep link.
2. **Top-5 actions per role.** Every persona gets a home screen answering "what needs
   me today" and one-tap paths to their most frequent actions.
3. **Reuse the server.** The existing `/api/v1` layer (route composer: auth → role →
   org cache → module license → read-only guard → tenant DB) is the single backend.
   No second backend, no logic duplication. Prices, fee math, credit metering stay
   server-side (existing invariants).
4. **Push notifications are the killer feature.** Most of the WhatsApp/email emitter
   events become push events for the right user.

---

## 2. Stack decision

### Recommended: **Expo (React Native) + TypeScript**

| Option | Verdict |
|---|---|
| **Expo / React Native** ✅ | Native feel, push, camera, biometrics, offline, Razorpay RN SDK, OTA updates via EAS Update. Team already lives in React + Tailwind (NativeWind keeps the styling model). |
| Capacitor (wrap existing web) | Fastest to ship, but wraps the **dense desktop CRM UI** — defeats the "simple UI" goal. Every screen would need a mobile redesign anyway, so the reuse advantage evaporates. Poor offline/push ergonomics. |
| Flutter | New language (Dart), zero reuse of React knowledge, zod schemas, or component patterns. |

Core libraries:

- **UI**: NativeWind v4 (Tailwind syntax) + custom component kit matching the Vidhyaan
  design system (#1565D8 primary, CircularXXWeb/Poppins).
- **Data**: TanStack Query (server cache) + Zustand (client state — mirrors
  `academic-year.store.ts` pattern).
- **Navigation**: Expo Router (file-based, same mental model as Next.js App Router).
- **Storage**: MMKV (tokens, prefs) + SQLite/expo-sqlite (offline queues).
- **Push**: Expo Notifications (FCM + APNs under the hood).
- **Payments**: `react-native-razorpay` (order created server-side, existing
  signature-verified webhook unchanged).
- **Crash/analytics**: Sentry.
- **Build/release**: EAS Build + EAS Submit + EAS Update (OTA for JS-only fixes).

### One app (decided 2026-07-12)

**Single "Vidhyaan" app, one store listing, three role-based journeys.** Login is the
fork: phone OTP → server returns the user's role memberships → app routes into the
matching shell (Parent / Organization / Vidhyaan Admin). Multi-role users get the same
workspace picker as web unified login; switcher lives in the profile menu.

- Same pattern as web: unified login already resolves parent/org/platform roles.
- Expo Router route groups: `app/(parent)/`, `app/(org)/`, `app/(admin)/` — separate
  tab bars, navigation stacks, and home screens per journey; zero cross-journey bleed.
- Admin journey is invisible unless the account holds a platform role.
- Trade-off accepted: one store listing serves parents and staff; screenshots lead with
  the parent journey.

---

## 3. Feature plan (per persona)

Legend: **P1** = MVP, **P2** = fast-follow, **P3** = later.

### 3.1 Parent app ("Vidhyaan")

| Feature | Phase | Simplification vs web |
|---|---|---|
| OTP login (+ biometric unlock) | P1 | Same OTP flow, tokenized for mobile |
| Home: per-kid cards (attendance today, next fee due, next event) | P1 | New aggregate endpoint, one screen |
| Fees: open invoices, **pay via Razorpay**, receipts (PDF share) | P1 | Pay + view only; no disputes/edits |
| Attendance: kid's calendar view + absence push alert | P1 | Read-only month grid |
| Events: list + RSVP | P1 | Same as portal, native list |
| Notifications centre + push | P1 | Unified feed of existing portal notifications |
| Applications tracking (admission pipeline status) | P2 | Status timeline only |
| Kids CRUD + document upload (camera → S3) | P2 | Camera capture, simple list |
| School search / marketplace + enquiry | P3 | Search + profile + enquire; no reviews-writing at first |
| Reviews (write, after eligibility gate) | P3 | Reuse eligibility rules |
| AI assistant (parent-scoped) | P3 | Only if gateway adds parent persona |

### 3.2 Org staff app ("Vidhyaan Partner") — role-gated tabs

Roles reuse web roles; each role sees only its tabs.

| Feature | Phase | Who | Simplification vs web |
|---|---|---|---|
| Home dashboard: today's KPIs (new leads, follow-ups due, fees collected today, attendance %) | P1 | all | 4–6 stat tiles + "needs attention" list, powered by one BFF endpoint |
| **Learning-centre home variant**: collections lead the screen — monthly / quarterly / previous-FY vs current-FY comparison (data from existing report rollups) | P1 | LC-type orgs | Institution type + role decide tile set, same BFF endpoint |
| Staff notification centre: bell + badge on home → role-routed alert feed (lead assigned, payment received, unmarked class, low credits, follow-up due), category filters | P1 | all | Rows deep-link to objects; push taps land direct |
| **Today's schedule / timetable**: class-course + subject + time for the day (org admin, teacher, counsellor views). **Not in web — needs new Timetable model server-side.** Parked 2026-07-12. | **P2 (parked)** | admin, teacher, counsellor | Mobile-first feature; web reuses same API later |
| Leads: list/search, quick-add (name+phone+class), one-tap **call / WhatsApp**, log follow-up, snooze | P1 | counsellor, admin | No inline table edit, no bulk ops; capture + act |
| Follow-up push reminders | P1 | counsellor | From existing follow-up data |
| **Attendance marking**: class/section picker → tap grid (present default) → submit; works offline, syncs later | P1 | teacher | Reuses `sessionKey` idempotency for safe re-sync |
| Fees: defaulter list, record offline payment (cash/UPI ref), **send payment link** (WhatsApp), receipt share | P1 | accountant, admin | No invoice creation/editing; collect + remind only |
| Students: directory, profile, call/WhatsApp guardian | P1 | all | Read-only + contact actions |
| Push events: lead assigned, payment received, form submitted, low credits | P1 | role-routed | Mirrors existing emitters |
| Admissions: simplified pipeline list, move stage, **camera document capture** | P2 | counsellor | No kanban drag; stage picker + doc camera |
| WhatsApp inbox: read + reply to inbound messages | P2 | admin, counsellor | Reuses inbox API; push on inbound |
| Events: create (title/date/cover) + publish + announce | P2 | admin | Reduced announce options (portal+WhatsApp) |
| Reports: 4 mobile cards (collection this month, funnel, ageing summary, attendance trend) | P2 | principal/exec | Registry-driven summaries only; full reports deep-link to web |
| AI assistant chat (existing gateway, citations + action cards) | P2 | licensed orgs | Reuse `useAiChat` logic ported to RN |
| Credits wallet balance + low-credit alert (buy → web deep link) | P2 | admin | View only; purchase stays web (avoids store IAP ambiguity) |
| Digital form submissions review | P3 | counsellor | Approve/convert only |
| Announcements/broadcast composer | P3 | admin | Template picker + audience count |

### 3.3 Vidhyaan admin team (tab set inside Partner app, platform-role gated)

| Feature | Phase |
|---|---|
| Org approvals queue (approve/reject with note) | P2 |
| Platform stats: signups, active orgs, MRR tiles, uptime | P2 |
| Billing alerts: failed renewals, grace/expiry list | P2 |
| WhatsApp template moderation queue | P3 |
| Review moderation (flags queue) | P3 |
| Announcements publish | P3 |

Impersonation stays **web-only** (too sensitive for a mobile surface).

### Explicitly NOT on mobile

Settings of any kind, form builder, email/WhatsApp template editing, pricing/plans,
promotion wizard, bulk imports, PDF-heavy report exports, platform flags. All deep-link
to web when touched.

---

## 4. Architecture plan

### 4.1 Repo layout (monorepo)

```
VidhyaanCRM/
  src/                     # existing Next.js app (unchanged)
  apps/
    mobile/                # Expo app (Expo Router)
      app/(parent)/...     # parent shell
      app/(staff)/...      # staff shell
      app/(admin)/...      # platform admin shell
  packages/
    api-client/            # typed fetch client + zod response schemas
    shared/                # shared zod schemas, constants (MODULES, roles), fee display helpers
    ui-native/             # NativeWind component kit (tokens from design system)
```

Turborepo optional; start with npm workspaces. Web app untouched — zero risk to prod.

### 4.2 Mobile auth (new, additive)

Cookie sessions don't fit RN. Add token endpoints beside NextAuth:

- `POST /api/mobile/v1/auth/otp` → send OTP (reuse existing OTP infra + rate limiter).
- `POST /api/mobile/v1/auth/verify` → OTP/PIN verify → **access JWT (15 min)** +
  **rotating refresh token (30 d, hashed in DB, device-bound)**. Multi-role users get
  the same workspace-picker payload as web unified login.
- `POST /api/mobile/v1/auth/refresh` → rotation; reuse detection revokes the family.
- Revocation: existing **Upstash Redis revocation store** — same keys, so "log out
  everywhere" and 2FA policy changes hit mobile instantly.
- 2FA: challenge-token step reused verbatim after OTP verify when org policy demands.
- Device table: `platform.mobile_devices` (userId, deviceId, pushToken, platform,
  lastSeen, refreshTokenHash).

Composer change: `route()` gains a Bearer-JWT branch in the auth stage — verifies JWT,
loads same session shape, then the rest of the pipeline (role → org cache → license →
tenant DB) runs **unchanged**. One new stage, every existing endpoint becomes
mobile-callable with zero per-route work.

### 4.3 BFF aggregate endpoints (thin, few)

Mobile home screens need one round trip, not six:

- `GET /api/mobile/v1/parent/home` — kids + attendance today + dues + next events.
- `GET /api/mobile/v1/staff/home` — role-aware KPI tiles + attention list.
- Everything else calls existing `/api/v1/*` routes directly (they already speak
  zod-validated JSON). Add `?fields=` slimming only where payloads prove heavy.

### 4.4 Push notifications

- `packages` of the existing emitter layer get a **push channel**: a `sendPush(userIds,
  payload)` helper next to `sendTemplateNotification` — fire-and-forget, never fails
  the workflow (same rule as WhatsApp).
- Fan-out table `notification_deliveries` for the in-app feed (badge counts) — parents
  already have a notifications model; extend to staff.
- Expo push tokens stored per device; pruned on `DeviceNotRegistered` receipts.
- Event → audience routing lives server-side (e.g. `payment.received` → org accountant
  + admin devices; `attendance.absent` → that kid's guardians).

### 4.5 Offline (attendance only, deliberately narrow)

- Teacher marks attendance offline → rows queue in SQLite with the composite
  `sessionKey` → sync job POSTs when back online. Server upsert on `sessionKey` makes
  retries idempotent (design already supports this). Conflict rule: **last write wins,
  server timestamps** — acceptable for attendance.
- Everything else is online-only with TanStack Query cache for stale-while-offline
  reads. Do not build generic offline sync; it is a tarpit.

### 4.6 Payments (parent fee pay)

1. App calls existing order-creation endpoint (server computes amount — never client).
2. `react-native-razorpay` opens native checkout.
3. Existing signature-verified webhook + reconcile sweep confirm — **mobile adds no new
   payment logic**. `payment.failed` / `gatewayRef` invariants untouched.
4. Store policy: school-fee payment for real-world services is **exempt from Apple IAP**
   (physical goods/services rule). Credit packs / subscription upgrades stay web-only
   to avoid any IAP argument.

### 4.7 Files

Camera/document capture → request S3 presigned PUT from server (reuse `storage.ts`
conventions, `uploads/{orgId}/{category}/`) → direct upload. No file bytes through the
API.

### 4.8 Security checklist

- Access JWT 15 min; refresh rotation + reuse detection; tokens in SecureStore/Keychain.
- Tenant isolation: identical — everything flows through the fail-closed `$extends`
  tenant client.
- Rate limits: existing limiter applies (keyed by user, not cookie).
- Biometric app-lock (FaceID/fingerprint) wrapping the stored refresh token.
- Read-only-guard + module-license stages unchanged, so plan lockouts (grace→expiry)
  work on mobile day one.
- No secrets in the app bundle; gateway/AI JWTs minted server-side as today.

---

## 5. Implementation plan

### Phase 0 — Foundations (≈1–1.5 wk, backend-heavy)

- npm workspaces + `apps/mobile` Expo scaffold + `packages/api-client`, `packages/shared`
  (move shared zod schemas/constants — import them from web to guarantee no drift).
- Mobile auth endpoints + Bearer branch in `route()` composer + `mobile_devices` table
  (1 migration). Vitest coverage: token rotation, revocation, tenant isolation via JWT.
- Push plumbing: token registration endpoint, `sendPush` helper, receipts pruning.
- NativeWind theme tokens from the design system; base kit (Button, Card, StatTile,
  ListRow, Sheet, OTP input).
- EAS project, dev builds on both platforms, Sentry.

### Phase 1 — Parent MVP (≈3–4 wk) → TestFlight/internal track

Login (OTP + workspace + biometric lock) → home aggregate → fees list + Razorpay pay +
receipt share → attendance calendar → events + RSVP → notifications feed + push
(absence, fee due, event published, announcement). **Ship gate:** one real school's
parents on TestFlight/closed track, payment E2E on live Razorpay.

### Phase 2 — Staff MVP (≈4–5 wk) → Partner app internal release

Staff shell + role-gated tabs → staff home BFF → leads (list/quick-add/call/WhatsApp/
follow-up + push reminders) → **attendance marking with offline queue** → fees
(defaulters, record payment, send link) → student directory → push routing
(lead-assigned, payment-received).

### Phase 3 — Depth (≈3–4 wk)

Admissions stage-move + camera docs; WhatsApp inbox + inbound push; events
create/publish/announce; report cards ×4; AI assistant port; credits balance; parent
applications tracking + kids docs.

### Phase 4 — Admin tab set + store launch (≈2–3 wk)

Org approvals, platform stats, billing alerts (admin routes exist — mostly UI).
Store listings, screenshots, privacy labels, data-safety forms (privacy-policy /
data-deletion pages already live — required for review). Public launch of parent app;
Partner app public or invite-only.

### Ongoing

EAS Update for JS fixes (no store review); native releases ~monthly; crash-free ≥99.5%
gate before widening rollout.

### Rough total: ~13–17 weeks solo · ~8–10 weeks with 2 devs (1 mobile, 1 backend/API).

---

## 5.1 Build & test distribution (Android APK first)

Dev/test happens in the same repo — open the existing VidhyaanCRM workspace, mobile
lives at `apps/mobile`. The mobile app **never touches the database**; it is a pure
consumer of the existing Next.js API (same Vercel deployment), so "sharing the DB"
means nothing more than pointing `EXPO_PUBLIC_API_URL` at the right server.

### Local dev loop

- `npm run dev` (web API on :3000) + `npx expo start` in a second terminal.
- Phone runs Expo Go, `EXPO_PUBLIC_API_URL=http://<mac-LAN-IP>:3000` — live against
  local dev server + shared Neon dev data.
- Once native modules land (Razorpay SDK), switch from Expo Go to a `development`
  dev-client build — install once, keep hot-reloading JS.

### Test APKs via EAS Build

`apps/mobile/eas.json` profiles:

| Profile | Output | Purpose |
|---|---|---|
| `development` | APK w/ dev client | Daily dev after native deps added; hot reload |
| `preview` | Standalone APK, `EXPO_PUBLIC_API_URL` = Vercel prod/staging | **Tester scenario runs** — sideloadable, no Play Store |
| `production` | AAB (app bundle) | Play Store submission only |

Flow: `eas build --profile preview --platform android` → cloud build (~10–15 min,
free tier) → download link + QR → testers install APK directly (unknown-sources
allow). Share link over WhatsApp; no Google account needed.

Key operational points:

- **JS-only changes need no rebuild** — `eas update --channel preview` pushes OTA;
  testers reopen the app and get the new bundle. Rebuild APK only when native
  dependencies change.
- Preview APK talks to the **real Vercel API → shared prod DB**: testers must use a
  dedicated test org (see user-wipe incident 2026-07-08 — never test against live org
  data).
- Local no-cloud builds possible (`eas build --local` / `npx expo run:android`,
  requires Android Studio SDK) — fallback if cloud queue hurts.
- iOS equivalent: TestFlight via `eas submit` (Apple dev account, $99/yr). Android APK
  path has zero account/fee friction — that's why Android tests first.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Apple review friction (payments) | Fee payments = physical services (IAP-exempt); subscriptions/credits web-only; cite precedent apps (school fee apps common) |
| Token auth bugs create tenant leaks | Bearer branch feeds the **same** session shape into the unchanged composer; vitest isolation suite must pass with JWT auth |
| Offline sync scope creep | Offline = attendance queue only, by decree |
| Push fatigue | Per-user notification prefs (reuse staff WhatsApp prefs pattern), sane defaults |
| Two apps double release work | One codebase, two targets; EAS automates; OTA for most fixes |
| Web/mobile schema drift | `packages/shared` zod schemas imported by both sides |

---

## 7. Open decisions (need call before Phase 0)

1. Monorepo in this repo vs separate repo (**recommend: this repo, npm workspaces** —
   shared zod schemas are the whole point).
2. Parent app name/branding for stores ("Vidhyaan" vs "Vidhyaan Parent").
3. Admin tabs in Partner app vs skip entirely for v1 (web admin is fine on mobile
   browser — cheapest correct answer may be "skip").
4. Minimum OS targets (suggest iOS 15+, Android 8+ — covers ~97% of Indian devices).
