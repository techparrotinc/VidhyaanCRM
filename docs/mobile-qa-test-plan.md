# Vidhyaan Mobile App — QA Test Plan & Regression Kit

Scope: Expo app in `apps/mobile` (Android preview APK, arm64). Personas: Auth flow, Org Staff (`(org)`), Parent (`(parent)`), Platform Admin (`(admin)`).
QA environment: org `vidhyaan-mobile-qa` (+ LC org `vidhyaan-mobile-qa-lc`), seed script `scripts/seed-mobile-role-test-data.ts --apply`.

**QA logins** (all PIN `2580`, OTP `123456`):

| Phone | Role |
|---|---|
| 9999955001 | PARENT |
| 9999955002 | ORG_ADMIN (2 workspaces → picker; School org is **second** in list) |
| 9999955003 | COUNSELLOR |
| 9999955004 | TEACHER (Grade 5-A, 3-B, 4) |
| 9999955005 | ACCOUNTANT |
| 9999955006 | RECEPTIONIST |

**Probe conventions**: label created records `E2E-PROBE`; clean up via API DELETE by exact id only — never bulk search-and-delete. QA org has Razorpay TEST gateway; use Razorpay test cards only.

---

## 1. Test Cases

Convention: **P** = positive, **N** = negative. Every case states precondition → action → expected.

### 1.1 Authentication & Session

| ID | Type | Case | Expected |
|---|---|---|---|
| AUTH-P1 | P | `/auth/check` with registered phone having PIN | `exists:true, hasPin:true` → PIN screen |
| AUTH-P2 | P | Registered phone without PIN | OTP screen; OTP `123456` (QA) logs in |
| AUTH-P3 | P | Correct PIN (2580) single-workspace user (…03) | Straight to role home, access+refresh tokens issued |
| AUTH-P4 | P | Multi-workspace user (…02) | Workspace picker shows both orgs with names; selecting School org lands School home |
| AUTH-P5 | P | OTP resend after 30s cooldown | New OTP sent; button disabled during cooldown |
| AUTH-P6 | P | 2FA-enrolled user login | Challenge screen; valid TOTP passes; SMS fallback via `/auth/2fa/sms` works |
| AUTH-P7 | P | App backgrounded > lock timeout | Lock screen; login PIN unlocks; no-PIN account auto-unlocks |
| AUTH-P8 | P | Access token expiry mid-session | Silent refresh via `/auth/refresh`; no logout, no visible error |
| AUTH-P9 | P | Set PIN from More (`/auth/pin/set`, Bearer) | Next login offers PIN path |
| AUTH-N1 | N | Unregistered phone | `NO_ACCOUNT` message, no OTP dispatched |
| AUTH-N2 | N | Wrong PIN ×N | `attemptsLeft` decrements; lockout with `retryAfter`; rate limiter (10/15min per phone) returns 429 |
| AUTH-N3 | N | Malformed payloads (PIN "12", phone "abc", missing deviceId) | 422 `Invalid request`, no stack trace leaked |
| AUTH-N4 | N | Expired/replayed `selectionToken` on `/auth/select` | 401; cannot pick workspace with stale token |
| AUTH-N5 | N | Token from workspace A used after re-login to workspace B | Old token rejected (revocation) |
| AUTH-N6 | N | OTP wrong 5× | Rate-limited, generic error, no oracle on whether phone exists |
| AUTH-N7 | N | Logout → back button | No cached protected screen; returns to login |
| AUTH-N8 | N | Bearer token on cookie-only web routes (e.g. `/api/v1/school-profile`) | 401 — confirms by-design boundary, app must not call these |

### 1.2 Org Staff — Home & Navigation

| ID | Type | Case | Expected |
|---|---|---|---|
| HOME-P1 | P | ORG_ADMIN home (School org) | KPI tiles + "Classes marked X/Y"; unread badge matches `/staff/notifications` |
| HOME-P2 | P | LC org home | LC tile variant (courses/batches), `institutionType` driven |
| HOME-P3 | P | TEACHER home | Only assigned-scope data (Grade 5-A/3-B/4); attendance tile routes to own register |
| HOME-P4 | P | ACCOUNTANT / RECEPTIONIST homes | Role-specific tiles render (fees/collections vs front-desk) |
| HOME-N1 | N | Org with `lead_management` module off | Leads tab + More entry hidden entirely (Prince Matriculation case) |
| HOME-N2 | N | Role without permission deep-links to gated screen (manual route) | Blocked/redirected, not blank crash |

### 1.3 Leads (staff)

| ID | Type | Case | Expected |
|---|---|---|---|
| LEAD-P1 | P | List loads, pull-to-refresh, pagination | Matches web list for same AY; no duplicate rows on page 2 |
| LEAD-P2 | P | Lead detail `leads/[id]` + log follow-up | Follow-up persists; visible on web drawer immediately |
| LEAD-P3 | P | Create lead (E2E-PROBE) | Lead code generated from numeric max (no collision under double-tap) |
| LEAD-N1 | N | Double-tap submit on create | Exactly one lead (server `$transaction` + advisory lock) |
| LEAD-N2 | N | Duplicate phone matching hard-dedup rule | Blocked; `force:true` must NOT override hard match |
| LEAD-N3 | N | COUNSELLOR attempts lead DELETE | 403 — ORG_ADMIN only |
| LEAD-N4 | N | Open `leads/[id]` for other-org id | 404, not data leak (tenant isolation) |

### 1.4 Students & Enroll Wizard

| ID | Type | Case | Expected |
|---|---|---|---|
| STU-P1 | P | Students list + detail | Section/class from master dropdowns; photo renders |
| STU-P2 | P | Enroll wizard end-to-end | Student POST + enrollment POST; **first invoice auto-created** with number from `nextInvoiceNumber` |
| STU-N1 | N | Enroll with missing mandatory fields | Per-field validation, wizard doesn't advance |
| STU-N2 | N | Kill app mid-wizard, reopen | No orphan half-record (student without enrollment) — verify server state |
| STU-N3 | N | Keyboard open on wizard inputs | Submit button reachable (FormScrollView) — Android edge-to-edge ignores adjustResize |

### 1.5 Fees & Collections

| ID | Type | Case | Expected |
|---|---|---|---|
| FEE-P1 | P | Staff fees list, overdue filter | Overdue rows non-zero when invoices past due (status-flip fix regression) |
| FEE-P2 | P | Collections M/Q/FY toggles | Totals match report `payment register` for same period; prev-period comparison correct |
| FEE-P3 | P | Record payment against invoice | Ledger + invoice status update; receipt reachable |
| FEE-N1 | N | Payment amount > outstanding / negative / 0 | Rejected with clear message |
| FEE-N2 | N | Concurrent payment on same invoice (two devices) | No double-settle; second gets conflict/fresh state |

### 1.6 Attendance / Schedule / Session

| ID | Type | Case | Expected |
|---|---|---|---|
| ATT-P1 | P | TEACHER marks register for assigned section | `sessionKey` idempotent — re-mark updates, not duplicates |
| ATT-P2 | P | Schedule day + week views; session reschedule | Reschedule persists; session GET refreshes state |
| ATT-N1 | N | Reschedule into clashing slot | 409 surfaced as friendly message |
| ATT-N2 | N | TEACHER opens unassigned section register | Denied (TeacherAssignment targetKey scope) |
| ATT-N3 | N | Mark attendance for future date | Blocked or explicitly allowed per spec — assert current behavior |

### 1.7 Notifications / Search / Scan / Wallet / WhatsApp

| ID | Type | Case | Expected |
|---|---|---|---|
| NOTIF-P1 | P | Bell badge count = list unread; PATCH mark-read clears | Badge updates without app restart |
| SRCH-P1 | P | Search students/leads/invoices ≥2 chars | Mixed-type results, org-scoped only |
| SRCH-N1 | N | Query with SQL/regex metacharacters (`' OR 1=1`, `%`) | Safe empty/normal results |
| SCAN-P1 | P | Scan capture → AI extract | Graceful fallback message until gateway vision endpoint ships (known pending) |
| WALT-P1 | P | Wallet balance = Settings → Add-ons web value | Same ledger |
| WA-P1 | P | WhatsApp inbox loads; sent log read stats | Matches web inbox |
| BCAST-N1 | N | Broadcast with 0 recipients selected | Blocked client-side with count preview |

### 1.8 Parent App

| ID | Type | Case | Expected |
|---|---|---|---|
| PAR-P1 | P | Parent home (…01) via `/api/mobile/v1/parent/home` BFF | Kids, dues, next event render |
| PAR-P2 | P | Fee detail → pay (Razorpay TEST) → receipt | Payment reflects in staff collections; receipt PDF shareable |
| PAR-P3 | P | Event detail + RSVP toggle | RSVP visible on web announce stats |
| PAR-P4 | P | Kid attendance view | Matches teacher-marked register |
| PAR-P5 | P | Delete account flow | Uses shared `src/lib/parent-account-delete.ts`; login afterwards = `NO_ACCOUNT` |
| PAR-N1 | N | Razorpay payment abandoned/failed | Invoice unchanged; `payment.failed` webhook must NOT overwrite `gatewayRef`; retry works |
| PAR-N2 | N | Parent token calls staff BFF (`/staff/home`) | 401/403 |
| PAR-N3 | N | Parent web-only routes (dashboard/kids/profile/timetable) with Bearer | 401/307 — by design; app must use BFF subset only |

### 1.9 Platform Admin

| ID | Type | Case | Expected |
|---|---|---|---|
| ADM-P1 | P | Pulse, approvals, billing-alerts, review-flags, templates load | Platform-scope data; org approval action reflects on web `/admin` |
| ADM-N1 | N | ORG_ADMIN token on admin screens/APIs | Denied |

### 1.10 Cross-cutting

| ID | Type | Case | Expected |
|---|---|---|---|
| X-P1 | P | Academic-year switch (where exposed) | Lists rescope; legacy null-AY rows visible every year |
| X-N1 | N | Airplane mode on each list screen | Friendly offline state, retry works, no red-screen crash |
| X-N2 | N | Slow network (300ms+ RTT throttle) | Spinners not infinite; no duplicate submits from impatient taps |
| X-N3 | N | App upgrade over old install (token schema) | Session survives or clean re-login — never crash loop |
| X-N4 | N | Push notification tap (when enabled) | Deep-links to correct screen — **currently untested E2E, known gap** |

---

## 2. Regression Testing Prompt — Gemini Flash

Paste this as the system/instruction prompt for a Gemini Flash session driving regression (screenshots or emulator-agent). One feature area per session; Flash's context is best kept narrow.

```text
ROLE
You are a senior mobile QA automation engineer regression-testing the Vidhyaan
mobile app (Expo/React Native, Android). You are precise, skeptical, and you
never mark PASS without stated evidence.

APP CONTEXT
- Personas: Org Staff (admin/counsellor/teacher/accountant/receptionist),
  Parent, Platform Admin. Login: phone → PIN or OTP; multi-workspace users get
  a workspace picker.
- QA logins: phones 9999955001..06 (01 parent, 02 org-admin w/ 2 workspaces,
  03 counsellor, 04 teacher, 05 accountant, 06 receptionist). PIN 2580,
  OTP 123456. Org-admin picker: "Vidhyaan Mobile QA School" is the SECOND
  entry — do not select the first (learning-center) by default.
- Any record you create must be named/labelled "E2E-PROBE". Delete only the
  exact records you created, by id. Never bulk-delete.
- Payments use Razorpay TEST mode only.

INPUT
I will give you one of: (a) a numbered test case with steps, (b) screenshots
of before/after states, (c) an API request/response pair. Execute or evaluate
exactly what is given. Do not invent steps that were not provided.

RULES OF EVIDENCE
1. PASS requires: the expected result text, and the observed evidence
   (screenshot description, response code+body excerpt, or UI state).
2. FAIL requires: exact reproduction steps, expected vs actual, and severity
   (S1 crash/data-loss, S2 feature broken, S3 degraded, S4 cosmetic).
3. If evidence is insufficient to decide, output BLOCKED with what is missing.
   Never guess. Never mark PASS "because it probably works".
4. Negative cases: an error is the EXPECTED outcome. Verify the error is
   user-friendly (no stack traces, no "Internal Server Error" text on screen).
5. Cross-check data consistency where stated (e.g. mobile collections total
   vs web payment register). A rendering success with wrong numbers is FAIL.
6. Watch for these known-sensitive areas and flag anything odd even if the
   test passes: double-submit creating duplicates, keyboard covering the
   submit button on form screens, badge counts not refreshing, module-gated
   tabs appearing for orgs without the module, cross-org data appearing in
   any list.

OUTPUT FORMAT (strict)
For each case:
| ID | Verdict (PASS/FAIL/BLOCKED) | Evidence | Defect (if FAIL: severity + repro) |
End with: summary counts, list of S1/S2 defects, and any observation outside
the scripted cases worth a new test case.
```

Feed it test cases from §1 in batches of 5–8 per message. For screenshot-based checks, add: "Compare against wireframes at `public/wireframes.html` section S[key]".

---

## 3. Known Gaps (verified 2026-07-19)

**Feature gaps — confirmed pending**
1. **iOS build never produced** — Android-only preview APK. No TestFlight track.
2. **Push notifications untested end-to-end** — Firebase wired (`@react-native-firebase/app`), device delivery + tap deep-link unverified (X-N4).
3. **AI gateway vision endpoint pending** — scan screen ships with graceful fallback; extract does nothing real yet.
4. **No offline/queued writes** — `expo-sqlite` is a dependency but lists are network-only; attendance marking in a no-signal classroom is a real field risk. Decide: read-cache only vs queued mutations.
5. **No deep-link / notification routing map** — `expo-linking` present, no documented URL scheme for entities (lead/invoice/event).
6. **Parent app has no admissions/application tracking screen** — web parent portal has it; mobile parent tabs stop at fees/events/attendance/notifications.
7. **No in-app update prompt** (expo-updates OTA policy undecided) — old APKs in the field will drift from API.
8. **Crash reporting present (Crashlytics) but no release-tagging/sourcemap upload step documented** in build recipe.

**Test-infra gaps**
9. No automated mobile E2E layer (Maestro/Detox). Everything above is manual/agent-driven. Recommendation: Maestro YAML flows for AUTH-P3/P4, LEAD-P3, STU-P2, PAR-P2 as smoke pack — they cover token flow, dedup, invoice creation, payment.
10. Mobile app excluded from repo lint (by design, standalone toolchain) but has no CI of its own — `npm run typecheck` in `apps/mobile` should run in CI at minimum.

---

## 4. Performance Testing

**Budgets (Android mid-tier, e.g. Redmi Note class)**

| Metric | Budget | How to measure |
|---|---|---|
| Cold start → login screen | < 2.5s | `adb shell am start -W` (TotalTime) |
| Login → home (warm API) | < 1.5s | timestamp log around navigation |
| List screens first paint (leads/students, 25 rows) | < 1s after tap | React Query devtools / log |
| BFF endpoint p95 (sin1 ↔ device in India) | < 400ms | see k6 below |
| APK size | ≤ 35MB (current 33MB — treat as ceiling) | build output |
| JS bundle main | track per release | `npx expo export --platform android` + size diff |
| Scroll jank on 500-row student list | 0 dropped-frame bursts > 300ms | Perf monitor overlay; lists must use FlatList/virtualization |
| Memory after 10min navigation soak | no monotonic growth | Android Studio profiler |

**API load (k6 sketch)** — against a preview deploy, never prod; QA org Bearer token:

```js
import http from 'k6/http';
import { check } from 'k6';
export const options = { stages: [
  { duration: '1m', target: 20 }, { duration: '3m', target: 50 }, { duration: '1m', target: 0 } ] };
const H = { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } };
export default function () {
  const r = http.get(`${__ENV.BASE}/api/mobile/v1/staff/home`, H);
  check(r, { 'home 200': (x) => x.status === 200, 'home <400ms': (x) => x.timings.duration < 400 });
  http.get(`${__ENV.BASE}/api/v1/leads?limit=25`, H);
  http.get(`${__ENV.BASE}/api/mobile/v1/staff/collections`, H);
}
```

Watch: Neon connection behavior under 50 VUs (pool exhaustion → 500s), rate limiters falsely tripping on shared egress IP, and p95 inflation when Redis (Upstash REST) is on the hot path.

**Perf regression triggers** — rerun the budget table when: Expo SDK bump, React Query config change, any list rewritten, proguard/R8 rule change, new fonts/assets.

---

## 5. Mobile Responsive / Device-Matrix Testing

**Device matrix (minimum)**

| Class | Example | Why |
|---|---|---|
| Small phone 5.0–5.5" 720p | Galaxy A03 | Tile grid wrap, text truncation |
| Standard 6.1–6.7" 1080p | Pixel 7 / Redmi Note 12 | Baseline |
| Large/tall 20:9+ | Galaxy S23 Ultra | Edge-to-edge insets, notch |
| Android Go / low RAM (2GB) | Any Go device | Cold start, list memory |
| Tablet (stretch) | Any 10" | Should not break; single-column acceptable |

**Checks per screen class**
- **Edge-to-edge + keyboard (top risk, known gotcha)**: Android ignores `adjustResize` — every input screen must use `FormScrollView` (`src/components/ui.tsx`). Verify on: login, PIN, OTP, set-pin, enroll wizard, lead create/follow-up, event-create, broadcast, support. Submit button must be reachable with keyboard open.
- **Safe-area insets**: tab bar and header avatar menu clear of gesture bar / punch-hole on 20:9 devices; lock screen full-bleed correct.
- **Font scaling**: OS font size at 130% and 200% — KPI tiles, badges, table-ish rows must wrap or ellipsize, never overlap. Decide and enforce `maxFontSizeMultiplier` where layout breaks.
- **Display size (density) at "Large"**: RegisterGrid attendance cells still tappable ≥44dp.
- **Orientation**: app is portrait-first — assert rotation either locked or non-broken on every screen (pick one, enforce in `app.json`).
- **Dark mode**: OS dark theme must not produce black-on-black (NativeWind classes are mostly explicit colors — verify status bar + Razorpay sheet transitions).
- **RTL**: not supported — assert `supportsRTL` false so pseudo-RTL devices don't mirror.
- **Slow render devices**: OTP auto-advance and PIN dots must not drop input on low-end (input debounce check).
- **Interruptions**: incoming call during Razorpay payment; process-death on payment return (`PAR-N1` overlap) — state must recover from server truth.

**Web responsive spot-check (companion)**: marketplace + parent web pages at 360×640, 390×844, 768×1024 — horizontal scroll = defect; this suite is separate from the native app but shares the release gate.

---

## 6. Run Log

### 2026-07-19 — Antigravity (Gemini) API regression, Batches 1–7
Environment: workspace agent, **no emulator/device** — every UI half BLOCKED; API halves executed against local dev server with QA-org Bearer tokens.

- **Totals**: API 52 PASS / 0 FAIL; UI 53 BLOCKED; 1 N/A (X-G2 — both QA orgs have lead_management enabled, gate untriggered).
- **S2 found & fixed**: FEE-N2 concurrent double-settle on `/api/v1/fees/invoices/[id]/payments` (balance check outside transaction). Fixed in 99bd4d3 (advisory xact lock `invoice-pay:{id}`, check-then-write inside tx; same lock in `applyGatewayPayment`). Retested: one 201, second request clean 422. Regression: `tests/fees-payment-race.test.ts`.
- **S3 reported, accepted by design**: access JWT survives logout until its 15-min expiry. Logout revokes the refresh session (rotation + reuse-detection revokes device and user Redis auth); stateless access tokens are the documented tradeoff. No change.
- **Verified invariants**: teacher attendance scoping (options + register 403 outside assignment), register upsert idempotency, future-date attendance blocked, schedule clash 409 with conflicting-session payload, teacher cannot reschedule others' sessions, parent sees only own kids' invoices (foreign invoice 404, zero leak), checkout balance/partial rules, RSVP double-tap idempotent, refresh-token rotation with replay 401, cross-persona consistency (teacher's mark → parent attendance view, mobile collections = payment-register report), 422 sweep + injection-input search all clean.
- **Probes left in QA org**: 4 payment rows from the pre-fix double-settle test (no payment DELETE route — includes the ₹7,000 pair inflating QA collections), RSVP `cmrrcvui1006fekmjikn8glem`, 2 auto-expiring Razorpay TEST orders.
- **Agent caution**: twice reached for raw DB access (cleanup via DB transaction; module check via DB read) despite instructions. Environment shares the prod Neon DB — supervise cleanup steps, or run future agent sessions against an isolated branch DB.
- **Handover to device testing**: all UI halves of §1, push token register/unregister, Razorpay widget + webhook signature path, payment capture callback.

## 7. Suggested Execution Order (per release)

1. Smoke (15 min): AUTH-P3/P4/N2, HOME-P1/P3, LEAD-P1, FEE-P1, PAR-P1/P2, NOTIF-P1.
2. Full functional pass (§1) — Gemini Flash driven, batches of 5–8.
3. Perf budget table (§4) on one mid-tier device.
4. Device matrix pass (§5) on small + large + Go device, keyboard/E2E checks only.
5. Log defects with severity; S1/S2 block release; update this doc's gap list.
