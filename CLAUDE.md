# CLAUDE.md — Project Context & Working Agreement

This file orients any AI/dev agent working on this repo. Read it fully before making changes.
The product vision and full phase plan live in `ROADMAP.md`; this file tracks **current state, what's done, what's next, conventions, and known issues**.

> **North star:** Ship a multi-tenant SaaS School Management System that is 100% functional (no broken flows, no hangs), secure, and market-ready, following standard production practices (tests, CI, validation, least-privilege auth, error monitoring, billing).

---

## 1. What this project is

A multi-tenant school management platform sold to many schools. One deployment, many schools, isolated by `schoolId`. Three account tiers:

| Tier | Role | Scope |
|---|---|---|
| Product owner (us) | `SuperAdmin` | Creates/manages client schools, global config, billing |
| Client | `SchoolAdmin` (Owner role) | Full control of their own school; creates sub-users |
| Sub-users | Accountant, Teacher, Customer Rep, etc. | Role + module permissions defined by the SchoolAdmin |

**Tenant routing decision (locked):** single login page on the main domain for school users; a separate button/path for the SaaS owner (SuperAdmin) to access the admin area. (Not subdomain-per-school.)

**Permission granularity decision (locked):** action-level (`view`/`create`/`edit`/`delete`) in both schema and UI.

---

## 2. Tech stack

- **Next.js 15** (App Router, server actions) + **React 19**
- **Prisma 5** + **PostgreSQL** (hosted: Vercel/Neon Postgres; use the plain `postgres://` connection string, not the `prisma+postgres://` Accelerate one)
- **iron-session** (cookie sessions) + **bcryptjs** (password hashing)
- **Zod** + **react-hook-form** (validation)
- **shadcn / Radix UI** + Tailwind CSS v4
- **@react-pdf/renderer** (challan/student PDF printing)
- **Vitest** (unit tests)

---

## 3. Repo layout (key paths)

```
src/
  actions/        Server actions (auth, finance, student, teacher, staff, class,
                  academics, timetable, settings, users, teacher-dashboard, ...)
  app/
    admin/        SuperAdmin area
    school/       School-scoped area (admin + role portals)
      users/      Self-serve user management + users/roles permission editor
    portal/       Student / parent portals
    login/        Auth entry
  components/     UI + feature components
  lib/
    env.ts        Zod-validated environment (fail-fast at boot)
    db.ts         Prisma client w/ soft-delete + audit-log extension
    session.ts    iron-session config
    authz.ts      getCurrentUserWithPermissions, requirePermission, hasPermission, userCan
    permissions.ts  Pure resolver (role + per-user overrides) — fully unit-tested
    modules.ts    MODULE REGISTRY — single source of truth for modules & actions
    role-templates.ts  Default seeded roles (Owner, Accountant, etc.)
    seed-roles.ts  Idempotent role seeding for a school
prisma/
  schema.prisma   Models (multi-tenant, soft deletes, audit log)
  seed.ts         Seeds first SuperAdmin + demo school + roles
scripts/
  admin-cli.ts    Gated operator CLI (list admins/users, reset admin password)
.github/workflows/ci.yml   CI: prisma validate, lint, typecheck, test
```

---

## 4. The permissions system (core feature — already built)

This is the heart of the product. **Every new feature must integrate with it.**

- **Module registry** (`src/lib/modules.ts`): static, code-defined list of modules (`students`, `classes`, `teachers`, `staff`, `parents`, `fees`, `payments`, `expenses`, `salaries`, `attendance`, `academics`, `reports`, `users`, `settings`) each with allowed actions. **This is the source of truth — add new modules here.**
- **Role** (DB, school-scoped): `{ name, description, isSystem, isOwner, permissions: Json }`. `permissions` is `{ moduleKey: Action[] }`. The `Owner` role is locked (`isOwner: true`) and resolves to all-access.
- **Per-user override** (`User.permissionOverride: Json`): `{ grant?, revoke? }` merged over the role.
- **Resolver** (`src/lib/permissions.ts`): pure `resolvePermissions(role, override, isSuperAdmin)`. SuperAdmin/Owner bypass. Fully unit-tested in `permissions.test.ts`.
- **Enforcement** (`src/lib/authz.ts`):
  - `requirePermission(module, action)` — throws (use where throwing is OK).
  - `hasPermission(module, action)` — non-throwing async; the standard guard in server actions.
  - `userCan(user, module, action)` — sync, for server components/UI.
  - `getCurrentUserWithPermissions()` — session user + resolved permissions.

### MANDATORY pattern for every server action

```ts
export async function doThing(...) {
  const session = await getSession();
  if (!session.schoolId || !(await hasPermission('moduleKey', 'action'))) {
    return { success: false, message: 'Access Denied' }; // keep each action's existing return contract
  }
  // ...always scope queries by session.schoolId
}
```

UI hides nav/buttons the user lacks (see `SchoolSidebar` `nav` map built in `app/school/layout.tsx`), but **the server check is the real gate — never trust the client.**

---

## 5. Current state — what's DONE

### Phase 0 — cleanup & safety net ✅
- Removed duplicate `session.save()` in `actions/auth.ts`.
- `src/lib/env.ts` validates env at boot (fail-fast); `.env.example` added.
- Debug scripts with hardcoded `password123` neutralized → replaced by gated `scripts/admin-cli.ts`. **NOTE:** the 4 old files (`check-db.ts`, `check-password.ts`, `reset-admin-password.ts`, `test-create-school.ts`) are tombstoned but still on disk — run `git rm` on them.
- Vitest + `test`/`typecheck` scripts + `.github/workflows/ci.yml`.
- Real `README.md`.

### Phase 1 — self-serve permissions ✅ (foundation + UI + action refactor)
- Module registry, `Role` model + `User.roleId`/`permissionOverride`, default role templates, seeding on school creation + in `seed.ts`.
- `requirePermission`/`hasPermission`/`userCan` helpers; resolver unit tests.
- Self-serve UI: `/school/users` (create users, assign roles, enable/disable) and `/school/users/roles` (action-level checkbox grid, clone/create/delete custom roles, locked Owner).
- Permission-aware sidebar + coarse layout guard.
- **All domain server actions refactored** from hardcoded role strings to `hasPermission(...)`: finance, student, teacher, staff, class, academics, timetable, settings, auth-management, teacher-dashboard. Teacher-portal actions accept legacy `Teacher` role OR `attendance`/`academics` permission (migration fallback).

### ⚠️ REQUIRED before anything else works
Run the migration to regenerate the Prisma client (adds `Role`, `roleId`, `permissionOverride`):
```bash
npx prisma migrate dev --name add_roles_permissions
```
Until this runs, `src/actions/users.ts`, `authz.ts`, `school.ts`, `seed.ts`, and the users pages will show "type doesn't exist" errors — all expected and resolved by the migration.

---

## 6. Known issues to fix (do these early)

1. **Run the pending migration** (above) and re-seed.
2. **`git rm`** the 4 tombstoned debug scripts at repo root.
3. **Pre-existing typecheck errors (block CI)** — unrelated to permissions work:
   - `scripts/import-teachers.ts`, `scripts/peek-excel.ts` — import missing `xlsx` package. Either add `xlsx` as a devDependency or delete these one-off scripts.
   - `scripts/add-teachers.ts`, `scripts/seed-teachers.ts` — type mismatches (`number` vs `string`, `userId` vs `user`). Fix or remove.
   - `src/actions/student.ts`, `teacher.ts`, `timetable.ts`, `academics.ts` — `schoolId: string | null` passed where `string` expected; `Decimal` vs `number`; `subject` on `TeacherClassAssignment`. Tighten null-guards / casts.
   - Goal: `npm run typecheck` and `npm test` both green so CI passes.
4. **Seed hardcodes `password123`** for the first SuperAdmin/demo users — make the seed read an env var (e.g. `SEED_ADMIN_PASSWORD`) with a random fallback, and document it.
5. **Vitest can't run in restricted/Linux-mismatched envs** if `node_modules` was installed on another OS — reinstall locally; it runs fine natively.

---

## 7. Phases REMAINING (build to 100% + market-ready)

Follow `ROADMAP.md` for detail. Summary of what's left:

### Phase 2 — MVP feature completeness ✅ COMPLETE
- ✅ Login: multi-tenant flow (no-slug → auto-find unique user OR prompt for slug), SuperAdmin path, per-role redirects, rate-limiting + lockout (5 attempts, 15-min lock).
- ✅ Role-appropriate dashboards: Finance role → finance dashboard; all others → academic dashboard with real counts + audit-log recent activity.
- ✅ Attendance end-to-end: `AttendanceTaker` (mark) + `AttendanceViewer` (view/reports) with class-level date navigation.
- ✅ Reports module: fee-collection, defaulters, income vs expense, salary register — all with Print + CSV export.
- ✅ Password change flow for all users (`/school/settings/account` with `ChangePasswordForm`).
- ✅ Portal accounts **decision**: Teacher/Student/Parent portals stay on legacy role enum (`session.role === 'Teacher'` etc.). Do NOT migrate them to the permissions system — the portals are user-specific and don't need action-level gating.

### Phase 3 — productization ✅ COMPLETE
- ✅ File/photo uploads: `PhotoUpload` component (drag-and-drop, preview, `/api/upload` → Vercel Blob, base64 fallback in dev); Teacher, Staff, Student forms updated.
- ✅ Transactional email (Resend): `src/lib/email.ts` — `sendWelcomeEmail` on user creation, `sendPasswordResetEmail` on reset request; no-ops when `RESEND_API_KEY` not set.
- ✅ Error monitoring (Sentry): `sentry.*.config.ts` + `instrumentation.ts` + `withSentryConfig`; no-op without `SENTRY_DSN`.
- ✅ Audit-log viewer UI: `/school/settings/audit-log` with pagination + model filter.
- ✅ Dashboard recent activity pulling from `db.auditLog`.
- ✅ Password reset flow: `requestPasswordReset` + `confirmPasswordReset` actions; `/login/reset` + `/login/reset/[token]` pages; anti-enumeration; 1-hour token TTL.
- ✅ Optional email on User model + `PasswordResetToken` model (migration: `add_user_email_password_reset`).
- ✅ All Phase 3 env vars optional, documented in `.env.example`.
- Self-serve school onboarding/signup (trial) for new clients. ← Phase 4 boundary
- Polished landing + pricing pages. ← Phase 4 boundary

### Phase 4 — monetization ✅ COMPLETE
- ✅ Landing page (`/`) — hero, features grid, pricing section, CTA, footer.
- ✅ Self-serve school signup (`/register`) — form calls `registerSchool`, auto-creates 14-day trial subscription, auto-logs in.
- ✅ Subscription model: `Subscription` DB model with `PlanTier` (Trial/Starter/School/District) + `SubscriptionStatus`.
- ✅ Plan constants + limit helpers in `src/lib/plans.ts` (maxStudents, maxUsers, pricing per plan).
- ✅ 14-day trial auto-created on `registerSchool`; SuperAdmin-created schools get trial via same helper.
- ✅ Usage limit enforcement: `admitStudent` + `createSchoolUser` check plan caps before proceeding.
- ✅ `TrialBanner` — dismissible banner in school layout counting down trial days; red when expired.
- ✅ `/school/settings/billing` — shows plan, status, usage bars, included features, upgrade CTA.
- ✅ Settings page quick-links added (Account, Billing, Audit Log).
- ✅ `/admin/billing` — SuperAdmin table of all schools with plan/status/usage; `UpdatePlanDialog` to manually set plan + status + notes + period.
- ✅ Admin sidebar: Billing link added.
- ✅ All subscription actions in `src/actions/subscription.ts`: `getSchoolSubscription`, `getAllSubscriptions`, `updateSchoolPlan`, `checkStudentLimit`, `checkUserLimit`.
- Payment gateway (Stripe / local PK) intentionally deferred — billing is manual (bank transfer + SuperAdmin upgrade) for initial market. ← Phase 5 boundary

### Phase 5 — scale & polish ✅ COMPLETE
- ✅ Portal layouts: `/app/portal/layout.tsx` — shared header (school name, role, username, logout) for Student, Parent, and Teacher portals. Portals were already built; now they have a nav shell.
- ✅ Calendar/Events UI: `/school/calendar` — monthly grid view with navigation, color-coded event dots, create/edit/delete dialog (SchoolAdmin only), event detail popup. Actions in `src/actions/events.ts`.
- ✅ Student CSV bulk import: `/school/students/import` — upload CSV, auto-parse, preview table, row-by-row import with per-row error reporting; generates roll numbers, creates guardian + parent portal user + student portal user automatically; respects plan limits; "Import CSV" button added to students page. Template download included.
- ✅ Exam results entry: `/school/academics/exams` — create exams per class, enter marks per student per subject (inline spreadsheet grid), subject management (common quick-add + custom). Exam results already fetched in student/parent portals. Link added to sidebar.
- ✅ School data export: `/school/settings/export` + `/api/export?type=` — CSV downloads for Students, Teachers, Staff, Fee Challans; auth-gated API route; added to settings page quick-links.
- SMS/notifications: deferred — no local PK SMS provider integrated yet. ← Future boundary
- Performance: all major listing pages already have server-side pagination (students, teachers, parents). Query caching deferred.
- GDPR hard-deletion: soft-delete already implemented throughout; per-school bulk export done. Hard-delete UI deferred.

### Cross-cutting "market standard" checklist (apply continuously)
- Every server action starts with a permission check + `schoolId` scoping. No exceptions.
- Tests for all new business logic (resolver-style pure functions especially); keep CI green.
- Zod-validate all inputs; never trust client.
- No secrets in code; everything via validated env.
- Accessibility, loading/empty/error states, and mobile-responsive UI on every new screen.
- Soft-delete + audit-log mutations (the `db.ts` extension already does audit logging — preserve it).

---

## 8. Conventions

- **Auth:** server actions use `hasPermission(module, action)`; server components/pages use `getCurrentUserWithPermissions()` + `userCan(...)`. Layouts do coarse "logged-in + belongs to this school" guards; fine-grained checks live in actions.
- **New module?** Add it to `src/lib/modules.ts` first, then surface it in the role-permission grid (automatic) and the sidebar `nav` map (`app/school/layout.tsx`).
- **DB access:** always import the extended client from `src/lib/db.ts` (gives soft-delete + audit). Always scope by `schoolId`.
- **Return contracts:** form actions return `{ success?, message?, errors? }` for `useActionState`/`useTransition` — don't make them throw on auth failure (return the message).
- **Run before pushing:** `npm run typecheck && npm test && npx prisma validate`.

---

## 9. Useful commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # prisma generate + next build
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npx prisma migrate dev # apply schema changes
npx prisma db seed     # seed SuperAdmin + demo school + roles
npx tsx scripts/admin-cli.ts list-admins   # operator CLI
```

**Demo credentials after seed** (CHANGE THESE / fix the seed): SuperAdmin `admin` / `password123` (no school slug); SchoolAdmin `admin_route` and Accountant `clerk_route` under slug `route-school-karyala`.
