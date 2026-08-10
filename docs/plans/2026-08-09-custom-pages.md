# Custom Pages Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add secure project-scoped custom pages managed from Hub settings and rendered on public project domains.

**Architecture:** Store sanitized rich-text pages in Supabase, protect management with existing project membership auth, enforce published-only anonymous reads through RLS and query filters, and render pages through the existing themed hub shell. Build navigation arrays per request and append published pages according to visibility/order.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase/Postgres/RLS, React, Tiptap, Tailwind, Node test runner.

---

### Task 1: Define and test page contracts

**Objective:** Establish reusable slug, input-validation, and sanitization behavior before production integration.

**Files:**
- Create: `apps/web/lib/custom-pages.test.mjs`
- Create: `apps/web/lib/custom-pages.mjs`
- Create: `apps/web/lib/custom-pages.d.mts`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Steps:**
1. Write failing Node tests for normalization, reserved/invalid slugs, limits, and unsafe HTML.
2. Run `pnpm --filter web test`; confirm failure because the module/contracts are missing.
3. Add the minimal utility and sanitizer dependency.
4. Re-run `pnpm --filter web test`; confirm pass.
5. Commit the verified slice.

### Task 2: Add persistent storage and generated types

**Objective:** Add a secure project-scoped table compatible with Supabase clients.

**Files:**
- Create: `supabase/migrations/*_custom_pages.sql`
- Modify: `apps/web/lib/supabase.ts`
- Modify: `apps/web/lib/types.ts`

**Steps:**
1. Encode table constraints, indexes, foreign key, grants, and RLS policies.
2. Add generated-style TypeScript table definitions and `CustomPageProps`.
3. Run unit tests and `pnpm --filter web ts`.
4. Commit the verified slice.

### Task 3: Add data helpers and API routes

**Objective:** Implement member-only CRUD and published-only public reads.

**Files:**
- Create: `apps/web/lib/api/custom-pages.ts`
- Create: `apps/web/app/api/v1/projects/[slug]/pages/route.ts`
- Create: `apps/web/app/api/v1/projects/[slug]/pages/[id]/route.ts`

**Steps:**
1. Use central validation/sanitization utilities for create/update.
2. Scope update/delete by both page ID and authenticated project ID.
3. Map duplicate slugs to HTTP 409 and invalid inputs to HTTP 400.
4. Add public helpers that always filter `published = true`.
5. Run tests and typecheck; commit.

### Task 4: Add Hub settings management UI

**Objective:** Let project members manage pages from Settings → Hub.

**Files:**
- Create: `apps/web/components/dashboard/custom-pages/*`
- Create: `apps/web/components/dashboard/modals/add-edit-custom-page-modal.tsx`
- Modify: `apps/web/app/dash/[slug]/settings/hub/page.tsx`

**Steps:**
1. Add list/empty state, status badges, edit/delete controls, and create CTA.
2. Add title, slug, SEO, rich-text, published, header/footer, and order fields.
3. Submit through new APIs and refresh on success.
4. Run tests, typecheck, and lint; commit.

### Task 5: Render public pages and navigation

**Objective:** Serve published pages with metadata in the themed hub and expose configured links.

**Files:**
- Create: `apps/web/app/[project]/[pageSlug]/page.tsx`
- Create: `apps/web/components/hub/footer.tsx`
- Modify: `apps/web/app/[project]/layout.tsx`
- Modify: `apps/web/components/hub/nav-bar.tsx`

**Steps:**
1. Fetch only published pages and return 404 for draft/missing slugs.
2. Generate page-specific title/description metadata.
3. Add ordered header/footer links while preserving built-in module routes.
4. Sanitize again before rendering.
5. Run tests, typecheck, lint, and build; commit.

### Task 6: Final integration review and publication

**Objective:** Prove the feature is merge-ready in our fork.

**Steps:**
1. Run `pnpm --filter web test`, `pnpm --filter web ts`, `pnpm --filter web lint`, and `pnpm --filter web build`.
2. Inspect the migration, RLS, auth boundaries, route collisions, UI states, and complete diff.
3. Fix all critical/important review findings and re-run verification.
4. Push `feature/custom-pages` to `poonasor/feedbase` and open a PR against our fork’s `main`.
5. Deploy/apply migration only after repository checks are green.
