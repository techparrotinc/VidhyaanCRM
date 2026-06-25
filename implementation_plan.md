# Implementation Plan - Lead saved popup, Datepicker redesign, Phone Validation, Qualification Fields & Quick Actions Move

This plan outlines the steps to resolve the UI centering of the lead success toast, integrate our custom premium DateSelector component, implement front-end mobile number validation, ensure all lead qualification fields are saved/loaded correctly, and reposition the Quick Actions card in the Edit/Details page.

## User Review Required

> [!IMPORTANT]
> - **Database Schema sync**: Since outbound PostgreSQL port 5432 is blocked inside the agent sandbox, we will need the user to run `npx prisma db push` locally to sync the database schema changes (adding `childAge`, `currentSchool`, `expectedJoinDate`, `siblingInSchool`, `course`, `batch`, `studentAge`, `startDate` to `Lead` model) to Neon Postgres, after which the API endpoints will successfully save these fields to the database.

## Proposed Changes

### 1. Add Lead Page Datepicker Redesign & Phone Validation

#### [MODIFY] [page.tsx](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/(crm)/lead-management/add-lead/page.tsx)
* **Import DateSelector**: Import `@/components/ui/DateSelector` at the top of the file.
* **Replace Native Date Inputs**: Replace the native `<input type="date" />` for `expectedJoinDate`, `startDate`, and `followUpDate` with the premium `<DateSelector />` component to redesign the datepicker fields.
* **Validation Check**: Ensure that validation fails and shows an inline error if the phone number does not start with 6-9 or is not exactly 10 digits (already set, we will verify its correct styling).

---

### 2. Lead Details/Edit Page Qualification Fields, Validation & Datepicker

#### [MODIFY] [page.tsx](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/(crm)/lead-management/[id]/page.tsx)
* **Declare States for Missing Fields**: Add states for `expectedJoinDate`, `siblingInSchool`, `course`, `batch`, `studentAge`, `startDate`, `institutionType` (defaulting to 'school'), and `academicYearsList` (dynamic list from settings API).
* **Fetch Metadata on Mount**:
  - Fetch user's school profile from `/api/v1/school-profile` and store its `institutionType`.
  - Fetch active academic years from `/api/v1/settings/academic-year` and store them in `academicYearsList`.
* **Initialize State on Load**: In `useEffect` mapping the `lead` prop, set all missing fields (`course`, `batch`, `studentAge`, `siblingInSchool`, `expectedJoinDate`, `startDate`, `academicYearId`).
* **Update Edit/Rollback State**: Update `startEditing()` and `cancelEditing()` to save and restore drafts of all new fields.
* **Save/Update Payload**:
  - In `saveEditing()`, add UI validation for the mobile number. Check if `phone` matches `/^[6-9]\d{9}$/`. If it doesn't, show a toast error and abort the save.
  - Include all missing fields in the PUT API payload (`academicYearId`, `childAge`, `currentSchool`, `expectedJoinDate`, `siblingInSchool`, `course`, `batch`, `studentAge`, `startDate`).
* **Integrate Custom DateSelector**:
  - For `expectedJoinDate` and `startDate` inputs, use the custom `<DateSelector />` component instead of native date inputs.
* **Update UI Rendering**:
  - Render either school qualification fields (Applying Grade, Child Age, Current School, Expected Join Date, Sibling) or learning center qualification fields (Course, Batch, Student Age, Preferred Start Date) depending on whether the loaded `institutionType` is school or learning center.
* **Reposition Quick Actions**:
  - Move `{QuickActionsCard()}` to the top of the sidebar block (before `{ApplicantCard()}`) in the desktop snapshot column.
  - Move `{QuickActionsCard()}` to the top of the profile info tab content (before `{ApplicantCard()}`) in the mobile viewport navigation.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type safety and successful TypeScript compilation.

### Manual Verification
- Load the Edit Lead page and verify:
  - Quick Actions are displayed at the very top of the sidebar and profile tab.
  - The datepicker uses the custom calendar selector.
  - Updating a phone number to `29303` shows a validation toast error and blocks saving.
  - Saving all qualification fields (e.g. current school, child age, expected join date, sibling status) persists correctly and displays on refresh.
