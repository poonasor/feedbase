# ADR-001: Project-Scoped Sanitized Rich-Text Custom Pages

**Status:** Accepted  
**Date:** 2026-08-09  
**Deciders:** Feedbase maintainers  
**Technical Story:** `docs/specs/custom-pages.md`

## Context

Feedbase hubs expose fixed Feedback and Changelog routes but cannot publish legal or informational pages. The feature must fit the current Supabase, Next.js App Router, Tiptap, project membership, custom-domain, and theme conventions while remaining safe enough for an upstream contribution.

## Decision

Create a normalized `custom_pages` table keyed to a project, with unique project-local slugs, publication state, SEO fields, and header/footer placement. Reuse Tiptap’s HTML output for editing, sanitize HTML before persistence and before rendering, use existing project-authenticated API conventions for management, and expose published pages through a dynamic `app/[project]/[pageSlug]` route. Enforce draft privacy in both application queries and RLS.

## Consequences

### Positive

- Supports legal and general informational pages without code deployments.
- Reuses existing editor, theme, auth, routing, and database patterns.
- Project-local records are portable and straightforward to contribute upstream.
- Defense-in-depth limits stored-XSS and draft-disclosure risk.

### Negative

- Introduces a sanitizer dependency and one more dynamic route.
- Rich HTML is less portable than Markdown.
- Navigation queries add a small read to the hub layout.

### Neutral

- V1 pages are flat, not nested or localized.
- Existing fixed modules remain first-class routes.

## Options Considered

### Option 1: Hard-coded Privacy and Terms pages
- **Pros:** Smallest implementation.
- **Cons:** Requires code changes per project and does not solve general custom pages.

### Option 2: Markdown-backed pages
- **Pros:** Portable and safe-by-default rendering.
- **Cons:** Adds a different authoring model from Feedbase’s existing Tiptap editor and requires Markdown tooling.

### Option 3: Sanitized Tiptap HTML in a project-scoped table
- **Pros:** Consistent authoring UX, flexible content, minimal conceptual change.
- **Cons:** Requires robust sanitization and HTML storage.

## Related Decisions

- None.

## Notes

Reserved slugs include built-in application and infrastructure paths such as `feedback`, `changelog`, `dash`, `api`, `auth`, and Next.js internals.
