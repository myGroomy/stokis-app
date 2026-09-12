# UI/UX Effectiveness Audit -- Stokis Project

**Audit Date:** 2026-09-09
**Scope:** Full codebase at `/home/bradley/project/stokis-project`

## Summary

| Severity | Count |
|----------|-------|
| Critical UX | 5 |
| Major | 29 |
| Minor | 17 |
| Suggestion | 4 |
| **Total** | **55** |

---

## CRITICAL UX

### C1. Bottom Nav Links to `/tutorial` -- Page Does Not Exist
**File:** `components/Navbar.tsx:44`

`bottomNavItems` includes `{ name: "Tutor", href: "/tutorial" }` but no `/app/tutorial/` page exists. Clicking it shows 404.

**Fix:** Remove the href or create the page. The tour is triggered via `openTour()`, not navigation.

### C2. Logout Route Is API Endpoint, Not Page
**File:** `components/Navbar.tsx:45`

`{ name: "Keluar", href: "/logout" }` but only `POST /api/auth/logout` exists. Works as button click but href is misleading.

**Fix:** Change href to `#` or remove href property.

### C3. Number Inputs Have 32px Touch Targets -- Below 44px Minimum
**File:** `app/so/input/page.tsx:1261,1276,1191,1210`

`h-8` (32px) inputs for S1, S2, and refill/pakai fields. Painful to tap on mobile with ~130 items. CSS defines `.touch-target { min-height: 44px }` but it's **never applied**.

**Fix:** Change `h-8` to `min-h-[44px]` on all SO form inputs.

### C4. No Back Button or Navigation Cue on SO Input Form
**File:** `app/so/input/page.tsx`

No back button, breadcrumb, or cancel option. No `beforeunload` handler to warn about unsaved data.

**Fix:** Add back navigation and `beforeunload` guard.

### C5. Dead End: No Confirmation Before Discarding Draft
**File:** `app/so/input/page.tsx:499-502`

`handleDiscardDraft` immediately clears without confirmation dialog.

**Fix:** Add confirmation dialog before discarding.

---

## MAJOR

### M1. Desktop Nav Hides Dashboard for Non-Admin
**File:** `components/Navbar.tsx:48-52`

Petugas see only "Input SO" and "Laporan" on desktop. No home/overview link.

### M2. Active State Detection Uses `startsWith` -- False Positives
**File:** `components/Navbar.tsx:78-79`

`/so/input` highlights when on `/so/konfirmasi/...`.

### M3. Branch Selector Truncates Long Names, No Tooltip
**File:** `components/Navbar.tsx:204`

`max-w-[160px]` + `truncate` with no `title` attribute.

### M4. Boolean Select Dropdowns Are 32px -- Hard to Tap
**File:** `app/so/input/page.tsx:1163-1164`

### M5. No Progress Indicator for ~130 Items
**File:** `app/so/input/page.tsx:847`

Shows item count but no visual progress bar showing completion.

### M6. Nav Rail May Overlap Bottom Nav on Mobile
**File:** `app/so/input/page.tsx:1378`

`fixed right-3 top-1/2` -- last button may be obscured by 64px bottom nav.

### M7. Error State on Data Load Failure Has No Retry
**File:** `app/so/input/page.tsx:365-366`

Shows error banner but no retry button. User must navigate away and back.

### M8. Submit Button Shows Indeterminate "Memproses..." for 15-30s
**File:** `app/so/input/page.tsx:1363`

The SOGeneratingOverlay shows steps but the button itself gives no indication of duration.

### M9. Chart Toggles Are Unlabeled Icon-Only Buttons
**Files:** `app/dashboard/harian/page.tsx:259-276`, `app/dashboard/mingguan/page.tsx:338-356`

Three icon buttons with only `title` tooltips. No visible labels.

### M10. Dashboard Chart Shows Only 3 Categories -- Low Information Density
**File:** `app/dashboard/harian/page.tsx:163-168`

No breakdown by item, area, or trend comparison with yesterday.

### M11. Weekly Dashboard Date Picker Fires Refetch Without Debounce
**File:** `app/dashboard/mingguan/page.tsx:316-319`

`onChange` immediately calls `refetchWithDates`. No debounce.

### M12. Confirmation Page Uses Hardcoded Fallback `totalItem || 136`
**Files:** `app/so/konfirmasi/[laporanId]/page.tsx:246`, `app/laporan/page.tsx:459`

### M13. WhatsApp Share Does Not Track Actual Delivery
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:121-131`

`handleWASent` sets `waSent = true` immediately on click, without WA confirmation.

### M14. Regenerate Button Disabled When Link Exists -- No Override
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:326-328`

If XLSX is corrupted or stale, user cannot regenerate.

### M15. No Virtual Keyboard Optimization for Number Inputs
**File:** `app/so/input/page.tsx:1254-1255`

Uses `type="number"` but `inputMode="numeric"` is more reliable for numeric keypad on iOS.

### M16. Floating Action Bar May Be Hidden on Devices with Tall Safe Areas
**File:** `app/so/input/page.tsx:1347`

### M17. Floating Nav Rail Overlaps Content on Narrow Screens
**File:** `app/so/input/page.tsx:1378`

`right-3` on 320px screens puts buttons over form content.

### M18. Near-Zero ARIA Usage Across Entire App
Only 13 `aria-*` attributes total. Missing: `aria-label` on search, `aria-current="page"` on nav, `aria-describedby` on errors.

### M19. No Skip-to-Content Link
**File:** `app/layout.tsx`

Keyboard users must tab through entire navbar to reach main content.

### M20. Focus-Visible Outline May Be Overridden by DaisyUI
**File:** `app/globals.css:157-160`

Custom `:focus-visible` may conflict with `btn:focus` styles.

### M21. Mixed Hardcoded Colors vs Theme Variables
**File:** `app/dashboard/harian/page.tsx:165-167`

Chart colors use hex `#ef4444` etc. instead of theme tokens.

### M22. Many Elements Use `text-[10px]`-`text-[11px]`
WCAG minimum readable font is 12px. Creates dense, hard-to-read interface.

### M23. QuantumLoader Is Generic Spinner -- No Progress Indication
**File:** `components/ui/QuantumLoader.tsx`

No perceived progress or estimated time during 15-30s operations.

### M24. PageTransition Component Exists But Not Used
**File:** `components/PageTransition.tsx` -- defined. `app/layout.tsx:40-42` -- renders `{children}` directly without wrapping.

### M25. Tour Navigates to `/dashboard/harian` -- Petugas Cannot Access
**File:** `lib/tour.ts:177`

Tour breaks for non-admin users at step 14/16.

### M26. Tour Does Not Account for `selectedCabang` Requirement
**File:** `lib/tour.ts:86`

If no branch selected, form shows warning instead of the element tour highlights.

### M27. No Confirmation Before Discarding Draft
(See C5 above)

### M28. After Submit, No Edit/Amend Flow
**File:** `app/so/input/page.tsx:730`

Data written to DB immediately. No way to edit submitted session.

### M29. Confirmation Page Does Not Show Actual Items Entered
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:183-396`

Shows summary stats but user must open XLSX to verify item-level data.

---

## MINOR

### m1. "Lainnya" Bottom Nav Maps to Admin-Only `/cabang`
**File:** `components/Navbar.tsx:43`

### m2. Inconsistent Naming: "Laporan" in Nav vs "Riwayat Laporan" on Page

### m3. Draft Restore Banner Does Not Show Which Items Were Filled
**File:** `app/so/input/page.tsx:797`

### m4. Previous SO Reference Selector Shows Cryptic Labels
**File:** `app/so/input/page.tsx:946-949`

### m5. Modal Backdrop onClick May Interfere with Scrolling
**File:** `app/so/input/page.tsx:1459`

### m6. Console.log Statements in Production Code
**Files:** `app/dashboard/harian/page.tsx:138,140`, `app/dashboard/mingguan/page.tsx:173,176,208`

### m7. Harian/Mingguan Toggle Uses `<span>` vs `<Link>` Inconsistently
**File:** `app/dashboard/harian/page.tsx:237-239`

### m8. Receipt Shows "MOCHIKIN" as Fallback Branch Name
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:203`

### m9. Receipt Footer "LAPORAN STRUK RESMI MOCHIKIN" Is Hardcoded
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:285`

### m10. `text-base-content/60` Used 100+ Times -- "Washed Out" Feel

### m11. Inconsistent Card Border Radius (`rounded-2xl`, `rounded-xl`, `rounded-lg`)

### m12. Stagger Animations on ~130 Items May Cause Performance Issues
**File:** `app/so/input/page.tsx:1072-1076`

`staggerChildren: 0.06` x 130 items = 8 seconds of cascading animation.

### m13. Tour Dots Are 6px Tall -- Below 44px Touch Target
**File:** `components/OnboardingTour.tsx:192`

### m14. Panduan Page Not Linked from Any Navigation
**File:** `app/panduan/page.tsx` -- comprehensive but undiscoverable.

### m15. Two Separate Documentation Systems (`/docs` and `/panduan`)
Overlapping content creates confusion about authoritative source.

### m16. Home Page "Lihat Semua" Link Does Not Preserve Filter Context
**File:** `app/page.tsx:858`

### m17. Inconsistent Naming Between Nav Items and Page Titles

---

## SUGGESTIONS

### S1. Use `<PageTransition>` Wrapper in Layout
The component exists but is unused. Wrapping `{children}` would add smooth page transitions.

### S2. Add Progress Bar for SO Form
Visual indicator of X/130 items completed. Critical for a long form.

### S3. Unify Docs and Panduan
Two overlapping systems. Merge into one.

### S4. Debounced Date Pickers on Dashboard
Prevent immediate refetch on every keystroke.

---

## TOP 5 PRIORITY FIXES

1. Fix `/tutorial` dead link and `/logout` misleading href in Navbar
2. Increase input height from `h-8` to `min-h-[44px]` on all SO form inputs
3. Add `aria-label` attributes to form controls and `aria-current="page"` to nav
4. Add skip-to-content link and wrap children in `<PageTransition>`
5. Guard onboarding tour against missing branch selection and non-admin dashboard access
