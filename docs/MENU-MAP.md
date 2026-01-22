# Menu to Docs Map

This document maps product menus to code folders and docs.

## Admin Web (apps/admin-web)

| Menu | Route/Page | Code (primary) | Docs |
|------|------------|----------------|------|
| Dashboard | `DashboardPage.tsx` | `apps/admin-web/src/pages/DashboardPage.tsx` | `docs/PROJECT-OVERVIEW.md` |
| Attendance | `AttendancePage.tsx` | `apps/admin-web/src/pages/AttendancePage.tsx` | `docs/CHANGELOG.md`, `docs/PROJECT-OVERVIEW.md` |
| Workers | `WorkersPage.tsx` | `apps/admin-web/src/pages/WorkersPage.tsx` | `docs/features/worker-management.md` |
| Worker Detail | `WorkerDetailPage.tsx` | `apps/admin-web/src/pages/WorkerDetailPage.tsx` | `docs/features/worker-management.md` |
| Risk Assessment (List) | `RiskAssessmentPage.tsx` | `apps/admin-web/src/pages/RiskAssessmentPage.tsx` | `docs/risk-assessment/README.md` |
| Risk Assessment (Create) | `CreateAssessmentPage.tsx` | `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx` | `docs/risk-assessment/README.md` |
| Risk Assessment (Detail) | `RiskAssessmentDetailPage.tsx` | `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx` | `docs/risk-assessment/README.md` |
| Risk Assessment (Approval) | `RiskAssessmentApprovalPage.tsx` | `apps/admin-web/src/pages/risk-assessment/RiskAssessmentApprovalPage.tsx` | `docs/risk-assessment/README.md` |
| Settings | `SettingsPage.tsx` | `apps/admin-web/src/pages/SettingsPage.tsx` | `docs/ARCHITECTURE.md`, `docs/DATABASE.md` |

Related UI blocks:
- Risk assessment form blocks: `apps/admin-web/src/components/risk-assessment/`
- Legacy/backup risk assessment inputs: `apps/admin-web/src/components/risk-assessment-backup/`
- Settings sub-panels: `apps/admin-web/src/components/settings/`

## Worker Mobile (apps/TongPassApp)

| Flow | Screen Group | Code (primary) | Docs |
|------|--------------|----------------|------|
| Auth/Signup | AuthStack screens | `apps/TongPassApp/src/screens/auth/` | `docs/signin/통패스_근로자앱_가입_PRD.md`, `docs/signin/LOGIN-RRD.md`, `docs/figma/screen-structure.md` |
| Login | Login/Reset screens | `apps/TongPassApp/src/screens/auth/` | `docs/figma/screen-specs/A00-auth-entry.md`, `docs/figma/screen-specs/L02-password-reset.md` |
| Personal | Personal area screens | `apps/TongPassApp/src/screens/auth/` | `docs/figma/screen-specs/P04-company-list.md`, `docs/figma/screen-specs/P05-personal-qr.md` |
| Home | Main screens | `apps/TongPassApp/src/screens/main/` | `docs/figma/screen-specs/*` |
| Navigation | Stacks | `apps/TongPassApp/src/navigation/` | `docs/figma/screen-structure.md` |

## Backend (Supabase)

| Area | Code | Docs |
|------|------|------|
| Auth Functions | `backend/supabase/functions/*` | `docs/AUTH-PROCESS.md`, `docs/QA-AUTH-CHECKLIST.md` |
| Migrations/Seed | `backend/supabase/migrations/*`, `backend/supabase/seed/*` | `docs/DATABASE.md` |

---

## Gaps/To Verify
- Confirm admin-web route paths for risk assessment screens.
- Confirm whether `docs/signin/*` fully matches mobile flows in `docs/figma/*`.
