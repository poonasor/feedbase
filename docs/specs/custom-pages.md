# Custom Pages Specification

**Status:** Approved  
**Owner:** Feedbase maintainers  
**Created:** 2026-08-09  
**Last Updated:** 2026-08-09

## Overview

Add project-scoped, editable public pages to Feedbase so project teams can publish legal and informational content such as Privacy Policy, Terms, About, and Community Guidelines.

## Goals

- Let project members create, edit, publish, unpublish, and delete custom pages from Hub settings.
- Serve published pages at `/<slug>` on the project subdomain or verified custom domain.
- Allow optional header and footer navigation placement with deterministic ordering.
- Protect built-in routes and prevent unsafe HTML from being published.
- Keep the implementation generic and suitable for contribution upstream.

## Non-Goals

- Nested page paths, page hierarchies, localization, version history, collaborative editing, templates, or arbitrary scripts/styles.
- Replacing the existing Feedback or Changelog modules.

## User Stories

### As a project member, I want to manage custom pages so that my public hub can include required legal and informational content

**Acceptance Criteria:**
- [ ] Hub settings list all pages, including drafts.
- [ ] A member can create and edit title, slug, rich-text content, SEO fields, publication state, navigation visibility, and order.
- [ ] Duplicate, malformed, empty, and reserved slugs are rejected with actionable errors.
- [ ] A member can delete a page after confirmation.

### As a hub visitor, I want to open published custom pages from navigation so that I can read project information

**Acceptance Criteria:**
- [ ] Published pages resolve at `/<slug>` on subdomains and verified custom domains.
- [ ] Draft and missing pages return 404 and are not exposed by public queries.
- [ ] Header/footer links appear only when enabled and are ordered consistently.
- [ ] Per-page title and description metadata are emitted.

## Technical Design

### Architecture

A `custom_pages` Supabase table stores project-scoped page records. Authenticated CRUD routes use the existing `withProjectAuth` membership wrapper. Public server reads request only published records. The existing Tiptap editor produces HTML; writes are sanitized before persistence and rendering is defense-in-depth sanitized.

### Data Model

`custom_pages`: `id`, timestamps, `project_id`, `title`, `slug`, `content`, `seo_title`, `seo_description`, `published`, `show_in_header`, `show_in_footer`, and `sort_order`. A unique constraint covers `(project_id, slug)`, a foreign key cascades on project deletion, and RLS allows public reads only for published rows while project members can manage their project’s rows.

### API Design

- `GET /api/v1/projects/:slug/pages` — member-only list, including drafts.
- `POST /api/v1/projects/:slug/pages` — member-only create.
- `PUT /api/v1/projects/:slug/pages/:id` — member-only update scoped to project.
- `DELETE /api/v1/projects/:slug/pages/:id` — member-only delete scoped to project.

### UI/UX Design

Add a Custom Pages card to Settings → Hub. It includes an empty state, page list with Draft/Published status, create/edit dialog, navigation controls, and delete confirmation. Public pages use the hub theme and shell.

## Implementation Plan

### Phase 1: Core contracts and storage
- [ ] Add RED tests for slug validation and HTML sanitization.
- [ ] Add validation/sanitization utility and Supabase migration/types.

### Phase 2: Data and API
- [ ] Add authenticated CRUD and published read helpers.
- [ ] Add API routes with validation and project scoping.

### Phase 3: Dashboard and public hub
- [ ] Add Hub settings manager and rich-text editor.
- [ ] Add public dynamic route, metadata, header links, and footer links.

### Phase 4: Verification
- [ ] Run focused tests, full tests, typecheck, lint, build, and route smoke checks where environment permits.

## Testing Strategy

- Node unit tests for normalization, reserved slugs, input limits, and sanitization.
- TypeScript compilation and ESLint for integration contracts.
- Next.js production build for route integration.
- Manual/live smoke checks for dashboard CRUD and published/draft behavior when Supabase credentials are available.

## Rollout Plan

Ship first on `poonasor/feedbase` behind no feature flag because empty projects are unaffected. Apply the migration, validate on our deployment, then prepare an upstream PR.

## Metrics & Success Criteria

- A project member can publish Privacy and Terms pages without code changes.
- Draft content is never available to anonymous visitors.
- Existing Feedback and Changelog routes continue to work.
- Repository tests and static/build checks pass.

## Dependencies

- Existing Supabase/Postgres stack and `withProjectAuth`.
- Existing Tiptap editor packages.
- A maintained HTML sanitizer compatible with server/route execution.

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stored XSS | High | Medium | Sanitize on writes and again before rendering; disallow scripts/styles/event handlers. |
| Route collisions | High | Medium | Central reserved-slug validation plus DB uniqueness. |
| Draft disclosure | High | Low | Published-only public helpers and restrictive RLS. |
| Mutable module navigation | Medium | Existing | Build per-request tab arrays rather than mutating module-level arrays. |

## Open Questions

None for V1; nested paths, templates, and localization remain future enhancements.

## References

- `docs/adrs/0001-project-scoped-custom-pages.md`
- `docs/plans/2026-08-09-custom-pages.md`
