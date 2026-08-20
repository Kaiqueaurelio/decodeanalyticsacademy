# Plan: Content Organization & Security Hardening (v6.6.5)

Address content mixture in "Gestão de Projetos Operacionais", fix "New Page" creation, and implement security features.

## Proposed Changes

### 1. Content Separation & Fixes
- **Apostila "Gestão de Projetos Operacionais"**:
    - Manually split the mixed content (Classes of 19/08 and others) into separate pages.
    - Ensure correct chronological order and titling.
- **"New Page" Button**:
    - Diagnose and fix why `createApostilaPage` might fail or fail to reflect in the UI.
    - Add UI feedback/refresh logic to ensure the new page appears immediately.

### 2. Security Hardening
- **Audit Logs**:
    - Create a `public.audit_logs` table.
    - Record events when students access exercises (`correct_answer`, `explanation`).
- **Auth Hardening**:
    - Implement a `public.auth_attempts` logic (if not already fully active) with server-side validation.
    - Ensure `ra-auth` Edge Function enforces rate limiting and temporary locks.
- **Backend Validation**:
    - Refine RLS or Edge Function logic to strictly check roles/status before returning sensitive exercise data.

### 3. Reporting
- **Student Performance Report**:
    - Create a utility/route to generate a PDF summary of student performance per subject/exercise.

## Technical Details
- **Database**:
    - `audit_logs` table: `id`, `user_id`, `event_type`, `resource_id`, `metadata`, `created_at`.
    - Migration to handle new tables and RLS grants.
- **Frontend**:
    - Update `ApostilaPage` and `AdminApostilaWorkbench` to handle new page creation more robustly.
    - Add "Export PDF Report" button to Student Dashboard.
- **Auth**:
    - Update `supabase/functions/ra-auth/index.ts` to improve lockout persistence.

## User Review Required
- Which PDF library is preferred for student reports? (Defaulting to `jspdf` / `html2canvas` pattern used in the app).
- Should the audit logs be visible to students or only admins? (Assuming admin-only).
