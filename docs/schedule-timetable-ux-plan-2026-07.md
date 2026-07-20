# Scheduling & Timetable UX Overhaul — Plan (2026-07)

Goal: a coherent, student-page-first way to give every student a weekly schedule —
learning-centre (course/batch, incl. per-student 1-on-1) **and** school
(class/section timetable) — and drive attendance sessions from it.

Chosen product direction (confirmed with owner):
- **Model**: a student is **either** in a batch (shared cohort schedule) **or** has an
  **individual per-student schedule** — the two never layer/override each other.
- **Group vs individual sessions**: a batch slot generates **one shared**
  `AttendanceSession` for the whole cohort (as today); an individual schedule
  generates **per-student** sessions.
- **Frequency-driven**: schedule cadence (daily / weekly / bi-weekly / N-per-week) is
  derived from the course's hours, not hand-picked per day.
- **Scope this round**: **learning-centre only**. School side keeps the existing
  `TimetableSlot` builder + parent view **display-only** (period-wise attendance is a
  deferred phase).
- **Entry point**: set the schedule **from the student page** (inline on enrol/edit).

---

## 1. Current state (verified in code)

### Learning centre
- Schedule lives on **`StudentBatch`** (`prisma/schema.prisma:2207`): `daysOfWeek[]`,
  a single `startTime`/`endTime`, `sessionDurationMin`, `startDate`/`endDate`.
- Cron `src/lib/schedule/materialize.ts` rolls each active batch's pattern into
  `CourseSession` + paired `AttendanceSession` rows ~14 days ahead, idempotent on
  `(batchId, startsAt)`. Daily cron `/api/cron/schedule-materialize`.
- **`CourseEnrollment`** (`schema.prisma:3357`) is **billing-only** — `startDate`,
  `nextBillingDate`, `frequency`. No day/time. Enrolling a student in a course
  creates **zero** schedule.
- **`Student.batchId`** is a single FK — a student belongs to **one** batch.
- Batch editor `src/components/settings/BatchesTab.tsx` does **not** expose
  `sessionDurationMin`, `startDate`, `endDate`; one time for all days.

### School
- **`TimetableSlot`** (`schema.prisma:4093`) already models the full weekly
  timetable: `gradeLabel`, `section`/`sectionKey`, `dayOfWeek` (1..7 ISO),
  `startTime`, `endTime`, `subject`, `teacherId`, `room`. Overlap guard in
  `src/lib/timetable.ts` (`assertNoOverlap`).
- Builder UI `/timetable` (`src/app/(crm)/timetable/page.tsx`) + CRUD
  `/api/v1/timetable`. Parent view `/parent/timetable` + `/api/v1/parent/timetable`.
- `src/lib/parent-schedule.ts` **already merges** school timetable + LC batch +
  events + fee-due dates into one parent schedule feed.
- **Gap**: `TimetableSlot` is **display-only** — it does NOT generate
  `AttendanceSession`. School attendance is ad-hoc daily "DAY" marking on
  `AttendanceRecord` (`@@unique([orgId, studentId, date, sessionKey])`,
  `sessionKey='DAY'`).

### Institution type
- `Organization.institutionType` (`schema.prisma:645`), helper `src/lib/institution.ts`
  (`isLearningCentre`, `institutionMode`, `institutionNoun`). UI branches on
  `/api/v1/settings/org-type`.

## 2. Gaps vs the target scenario

Scenario: *LC admin creates a student, assigns a course, schedule = 30 min twice a
week, 6:30–7:30 PM.*

| # | Gap | Cause |
|---|-----|-------|
| 1 | "30 min" not settable | `sessionDurationMin` absent from batch UI |
| 2 | Multi-course student impossible | `Student.batchId` single |
| 3 | Per-day different times impossible | batch has one `startTime` for all days |
| 4 | No per-student (1-on-1) schedule | schedule only on shared cohort batch |
| 5 | Enrol ≠ schedule | `CourseEnrollment` billing-only |
| 6 | School timetable ≠ attendance | `TimetableSlot` display-only |
| 7 | Schedule set away from student | must hop Settings ↔ student |

## 3. Target data model

Reuse `TimetableSlot` (school) and `StudentBatch` (LC cohort) as-is. Add a
per-student LC layer + wire both into session generation.

### New: `EnrollmentScheduleSlot` (crm)
Per-student, per-course weekly slot. Supports 1-on-1, multi-course, per-day times,
explicit duration.
```
id, orgId, enrollmentId (→CourseEnrollment), studentId, courseId,
dayOfWeek Int(1..7 ISO), startTime HH:mm, endTime HH:mm, durationMin Int?,
teacherId String?, room String?, startDate?, endDate?, isActive, batchId String?
```
- `batchId` present ⇒ slot was inherited/derived from a batch (override tracking).
- Multiple slots per enrollment ⇒ "twice a week" = 2 rows (per-day times differ).

### `CourseSession` / `AttendanceSession` — make polymorphic
Today `CourseSession.batchId` is **non-null** (`schema.prisma:3876`,
`@@unique([batchId, startsAt])`). Change:
- `batchId` → **nullable**; add `studentId String?`, `enrollmentId String?`,
  `scheduleSlotId String?`, `timetableSlotId String?`, `subject String?`.
- Replace unique with source-specific partial uniques (batch slot vs per-student
  slot vs timetable slot) so idempotency still holds per source.

### Batch XOR individual (no layering)
A student is **either** cohort-scheduled (`Student.batchId` set → inherits the
batch's shared sessions) **or** individually scheduled (`EnrollmentScheduleSlot`
rows → own per-student sessions). Never both for the same student. The student-page
builder offers a single choice: **"Join a batch"** vs **"Custom schedule"**.

### Frequency-driven cadence (from hours)
Course gains optional `hoursPerWeek` and/or `totalHours`. The individual-schedule
builder takes: session **duration** (e.g. 30/45/60), **frequency**
(DAILY | WEEKLY | BIWEEKLY | N_PER_WEEK), preferred **days** + **time window**, and
lays out slots automatically — capped by `totalHours` (stop generating once the
booked hours reach the package) or by `endDate`. Admin can fine-tune the proposed
slots before saving.

## 4. Session-generation refactor
`materialize.ts` gains a second source reader, feeding one upsert path:
1. **Batch cohort** (existing) — one **shared** session per batch slot per day.
2. **Per-student enrollment** — one **individual** session per
   `EnrollmentScheduleSlot` per day, carrying `studentId`+`enrollmentId`, bounded by
   the slot's `startDate`/`endDate` (and, if set, the course `totalHours` cap).
Idempotency preserved: existence check per source key (`(batchId, startsAt)` for
cohort, `(scheduleSlotId, startsAt)` for individual) before create.
School `TimetableSlot` is **not** materialized this round (display-only).

## 5. UX — student-page-first (LC)
On the student create/edit page, "Course Enrolment" → after picking a course, one
schedule choice:
- **Join a batch** — pick an existing cohort batch; student inherits its shared
  sessions (sets `Student.batchId`). No individual rows.
- **Custom schedule** — set duration (30/45/60/custom) + frequency
  (daily / weekly / bi-weekly / N-per-week) + preferred days + time window; builder
  proposes the weekly slots (capped by course `totalHours` if set); admin tweaks and
  saves → `EnrollmentScheduleSlot[]`. Writes billing `CourseEnrollment` + schedule
  together in one action.

Also: batch editor exposes `sessionDurationMin`, `startDate`/`endDate`. Branded
time inputs (never `datetime-local`); app `ConfirmDialog` for destructive edits.
School students: unchanged this round (existing `/timetable` view applies).

## 6. Phasing
- **Phase A — LC per-student scheduling** (this round, core pain):
  `EnrollmentScheduleSlot` model; `Course.hoursPerWeek`/`totalHours`; polymorphic
  `CourseSession`/`AttendanceSession` (nullable `batchId` + `studentId`/
  `enrollmentId`/`scheduleSlotId`); `materialize` individual reader with frequency
  layout + hours cap; student-page **"Join batch vs Custom schedule"** builder; batch
  editor gains `sessionDurationMin`/`startDate`/`endDate`. Ships the target scenario.
- **Phase B — Polish**: multiple individual courses per student, conflict detection
  across a student's slots, per-student session reschedule/cancel in the schedule
  drawer, parent feed extended to show individual sessions.
- **Phase C (deferred) — School timetable → attendance**: opt-in period-wise
  attendance from `TimetableSlot`; ClassSection-master binding; student-page
  timetable surface.
- **Phase D (deferred) — Unified staff schedule calendar** across all sources.

## 7. Migration safety
Local `.env.local` DB **is the shared prod Neon DB** (see memory
`vidhyaan-shared-db-env-parity`). Never run `prisma migrate dev` against it.
- Develop/verify migrations on the disposable branch `TEST_DATABASE_URL`.
- Apply to prod only via `npx prisma migrate deploy` (DIRECT_URL) with explicit
  go-ahead. All new columns nullable / additive ⇒ backward-compatible; existing
  batch sessions keep working unchanged.
