import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CUSTOM_PAGE_LIMITS,
  normalizeCustomPageSlug,
  sanitizeCustomPageHtml,
  validateCustomPageInput,
} from './custom-pages.mjs';

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
