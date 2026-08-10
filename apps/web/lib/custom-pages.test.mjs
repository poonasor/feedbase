import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CUSTOM_PAGE_LIMITS,
  getCustomPageNavigationLabel,
  getCustomPageStatusLabel,
  isValidCustomPageId,
  mapCustomPageDatabaseError,
  normalizeCustomPageSlug,
  sanitizeCustomPageHtml,
  selectCustomPagePatch,
  validateCustomPageApiInput,
  validateCustomPageInput,
} from './custom-pages.mjs';

test('formats custom page status and navigation placement labels', () => {
  assert.equal(getCustomPageStatusLabel(true), 'Published');
  assert.equal(getCustomPageStatusLabel(false), 'Draft');
  assert.equal(getCustomPageNavigationLabel(true, true), 'Header & Footer');
  assert.equal(getCustomPageNavigationLabel(true, false), 'Header');
  assert.equal(getCustomPageNavigationLabel(false, true), 'Footer');
  assert.equal(getCustomPageNavigationLabel(false, false), 'Not in navigation');
});

test('normalizes page slugs to lowercase hyphenated values', () => {
  assert.equal(normalizeCustomPageSlug('  Privacy Policy  '), 'privacy-policy');
  assert.equal(normalizeCustomPageSlug('About___Us'), 'about-us');
  assert.equal(normalizeCustomPageSlug('A  B---C'), 'a-b-c');
});

test('rejects empty, malformed, and reserved slugs', () => {
  for (const slug of ['', '---', 'two/slugs', 'feedback', 'CHANGELOG', '_next', 'favicon.ico']) {
    const result = validateCustomPageInput({ title: 'Title', slug, content: '' });
    assert.equal(result.success, false, `expected ${slug || '<empty>'} to be rejected`);
    assert.ok(result.errors.slug);
  }
});

test('accepts a valid normalized slug and applies defaults', () => {
  const result = validateCustomPageInput({ title: '  About us  ', slug: ' About Us ', content: '<p>Hello</p>' });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    title: 'About us',
    slug: 'about-us',
    content: '<p>Hello</p>',
    seo_title: null,
    seo_description: null,
    published: false,
    show_in_header: false,
    show_in_footer: false,
    sort_order: 0,
  });
});

test('enforces all page input limits and sort order integer bounds', () => {
  const cases = [
    [{ title: 'x'.repeat(CUSTOM_PAGE_LIMITS.title + 1), slug: 'valid', content: '' }, 'title'],
    [{ title: 'Title', slug: 'x'.repeat(CUSTOM_PAGE_LIMITS.slug + 1), content: '' }, 'slug'],
    [{ title: 'Title', slug: 'valid', content: '', seo_title: 'x'.repeat(CUSTOM_PAGE_LIMITS.seoTitle + 1) }, 'seo_title'],
    [
      {
        title: 'Title',
        slug: 'valid',
        content: '',
        seo_description: 'x'.repeat(CUSTOM_PAGE_LIMITS.seoDescription + 1),
      },
      'seo_description',
    ],
    [{ title: 'Title', slug: 'valid', content: 'x'.repeat(CUSTOM_PAGE_LIMITS.content + 1) }, 'content'],
    [{ title: 'Title', slug: 'valid', content: '', sort_order: 1.5 }, 'sort_order'],
    [{ title: 'Title', slug: 'valid', content: '', sort_order: CUSTOM_PAGE_LIMITS.sortOrderMax + 1 }, 'sort_order'],
    [{ title: 'Title', slug: 'valid', content: '', sort_order: CUSTOM_PAGE_LIMITS.sortOrderMin - 1 }, 'sort_order'],
  ];

  for (const [input, field] of cases) {
    const result = validateCustomPageInput(input);
    assert.equal(result.success, false, `expected ${field} to fail`);
    assert.ok(result.errors[field]);
  }
});

test('requires a title and validates field types', () => {
  const noTitle = validateCustomPageInput({ title: '   ', slug: 'valid', content: '' });
  assert.equal(noTitle.success, false);
  assert.ok(noTitle.errors.title);

  const wrongTypes = validateCustomPageInput({
    title: 'Title',
    slug: 'valid',
    content: 42,
    published: 'yes',
    show_in_header: 1,
  });
  assert.equal(wrongTypes.success, false);
  assert.ok(wrongTypes.errors.content);
  assert.ok(wrongTypes.errors.published);
  assert.ok(wrongTypes.errors.show_in_header);
});

test('sanitizes scripts, event handlers, dangerous URLs, and styles while preserving rich text', () => {
  const dirty = [
    '<h2 onclick="alert(1)">Heading</h2>',
    '<script>alert(1)</script>',
    '<p style="position:fixed">Hello <strong>world</strong></p>',
    '<a href="javascript:alert(1)" target="_blank">bad</a>',
    '<a href="https://example.com" target="_blank">good</a>',
    '<img src=x onerror="alert(1)">',
  ].join('');
  const clean = sanitizeCustomPageHtml(dirty);

  assert.match(clean, /<h2>Heading<\/h2>/);
  assert.match(clean, /<p>Hello <strong>world<\/strong><\/p>/);
  assert.match(clean, /href="https:\/\/example.com"/);
  assert.match(clean, /rel="noopener noreferrer"/);
  assert.doesNotMatch(clean, /script|onclick|onerror|javascript:|style=|<img/i);
});

test('rejects protocol-relative links', () => {
  const clean = sanitizeCustomPageHtml('<a href="//evil.example/path">bad</a>');

  assert.equal(clean, '<a>bad</a>');
});

test('sanitization is idempotent', () => {
  const dirty =
    '<h2 onclick="alert(1)">Heading</h2><a href="https://example.com" target="_blank">safe</a><img src=x>';
  const clean = sanitizeCustomPageHtml(dirty);

  assert.equal(sanitizeCustomPageHtml(clean), clean);
});

test('validates canonical UUID page ids', () => {
  assert.equal(isValidCustomPageId('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isValidCustomPageId('not-a-uuid'), false);
  assert.equal(isValidCustomPageId('550e8400e29b41d4a716446655440000'), false);
});

test('rejects non-object and server-managed API fields', () => {
  for (const input of [null, [], 'invalid']) {
    const result = validateCustomPageApiInput(input);
    assert.equal(result.success, false);
    assert.ok(result.errors.body);
  }

  for (const field of ['id', 'project_id', 'created_at', 'updated_at']) {
    const result = validateCustomPageApiInput({ title: 'Title', slug: 'valid', content: '', [field]: 'x' });
    assert.equal(result.success, false);
    assert.ok(result.errors[field]);
  }
});

test('validates merged PATCH input while preserving false, zero, and null values', () => {
  const current = {
    title: 'Current',
    slug: 'current',
    content: '<p>Current</p>',
    seo_title: 'SEO',
    seo_description: 'Description',
    published: true,
    show_in_header: true,
    show_in_footer: true,
    sort_order: 12,
  };
  const result = validateCustomPageApiInput(
    {
      seo_title: '',
      seo_description: null,
      published: false,
      show_in_header: false,
      show_in_footer: false,
      sort_order: 0,
    },
    current
  );

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    ...current,
    seo_title: null,
    seo_description: null,
    published: false,
    show_in_header: false,
    show_in_footer: false,
    sort_order: 0,
  });
});

test('selects only sanitized fields present in a PATCH request', () => {
  const validated = {
    title: 'Current title',
    slug: 'current',
    content: '<p>Current</p>',
    seo_title: null,
    seo_description: 'Description',
    published: false,
    show_in_header: true,
    show_in_footer: true,
    sort_order: 0,
  };

  assert.deepEqual(selectCustomPagePatch({ seo_title: '', published: false, sort_order: 0 }, validated), {
    seo_title: null,
    published: false,
    sort_order: 0,
  });
});

test('maps only the custom page slug constraint to conflict', () => {
  assert.deepEqual(
    mapCustomPageDatabaseError({
      code: '23505',
      constraint: 'custom_pages_project_id_slug_key',
      message: 'duplicate key value violates unique constraint',
    }),
    {
      message: 'A custom page with this slug already exists.',
      status: 409,
    }
  );
});

test('maps unrelated database errors to a generic server error', () => {
  for (const error of [
    { code: '23505', constraint: 'some_other_unique_key', message: 'duplicate key value' },
    { code: 'XX000', message: 'raw postgres details' },
  ]) {
    assert.deepEqual(mapCustomPageDatabaseError(error), {
      message: 'Unable to process the custom page request.',
      status: 500,
    });
  }
});
