import sanitizeHtml from 'sanitize-html';

export const CUSTOM_PAGE_LIMITS = Object.freeze({
  title: 120,
  slug: 80,
  seoTitle: 70,
  seoDescription: 300,
  content: 100000,
  sortOrderMin: -10000,
  sortOrderMax: 10000,
});

export const RESERVED_CUSTOM_PAGE_SLUGS = new Set([
  'feedback',
  'changelog',
  'dash',
  'api',
  'auth',
  'home',
  'login',
  'signup',
  'invite',
  'settings',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const SAFE_SLUG_INPUT = /^[a-zA-Z0-9 _-]+$/;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeCustomPageSlug(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[ _-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function sanitizeCustomPageHtml(value) {
  if (typeof value !== 'string') return '';
  return sanitizeHtml(value, {
    allowedTags: [
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'code',
      'strong',
      'em',
      'u',
      's',
      'ul',
      'ol',
      'li',
      'a',
      'hr',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
    },
  });
}

export function validateCustomPageInput(input) {
  const errors = {};
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!title) errors.title = 'Title is required.';
  else if (title.length > CUSTOM_PAGE_LIMITS.title) errors.title = `Title must be ${CUSTOM_PAGE_LIMITS.title} characters or fewer.`;

  const rawSlug = typeof value.slug === 'string' ? value.slug.trim() : '';
  const slug = normalizeCustomPageSlug(rawSlug);
  if (!rawSlug) errors.slug = 'Slug is required.';
  else if (!SAFE_SLUG_INPUT.test(rawSlug)) errors.slug = 'Slug may only contain letters, numbers, spaces, underscores, and hyphens.';
  else if (!SAFE_SLUG.test(slug)) errors.slug = 'Slug must contain letters or numbers separated by single hyphens.';
  else if (slug.length > CUSTOM_PAGE_LIMITS.slug) errors.slug = `Slug must be ${CUSTOM_PAGE_LIMITS.slug} characters or fewer.`;
  else if (RESERVED_CUSTOM_PAGE_SLUGS.has(rawSlug.toLowerCase()) || RESERVED_CUSTOM_PAGE_SLUGS.has(slug)) {
    errors.slug = 'This slug is reserved by Feedbase.';
  }

  const content = typeof value.content === 'string' ? value.content : '';
  if (typeof value.content !== 'string') errors.content = 'Content must be text.';
  else if (content.length > CUSTOM_PAGE_LIMITS.content) errors.content = `Content must be ${CUSTOM_PAGE_LIMITS.content} characters or fewer.`;

  const seoTitle = value.seo_title === null || value.seo_title === undefined || value.seo_title === '' ? null : value.seo_title;
  if (seoTitle !== null && typeof seoTitle !== 'string') errors.seo_title = 'SEO title must be text.';
  else if (seoTitle && seoTitle.length > CUSTOM_PAGE_LIMITS.seoTitle) errors.seo_title = `SEO title must be ${CUSTOM_PAGE_LIMITS.seoTitle} characters or fewer.`;

  const seoDescription =
    value.seo_description === null || value.seo_description === undefined || value.seo_description === ''
      ? null
      : value.seo_description;
  if (seoDescription !== null && typeof seoDescription !== 'string') errors.seo_description = 'SEO description must be text.';
  else if (seoDescription && seoDescription.length > CUSTOM_PAGE_LIMITS.seoDescription) errors.seo_description = `SEO description must be ${CUSTOM_PAGE_LIMITS.seoDescription} characters or fewer.`;

  for (const field of ['published', 'show_in_header', 'show_in_footer']) {
    if (value[field] !== undefined && typeof value[field] !== 'boolean') errors[field] = `${field} must be a boolean.`;
  }

  const sortOrder = value.sort_order === undefined ? 0 : value.sort_order;
  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < CUSTOM_PAGE_LIMITS.sortOrderMin ||
    sortOrder > CUSTOM_PAGE_LIMITS.sortOrderMax
  ) {
    errors.sort_order = `Sort order must be an integer between ${CUSTOM_PAGE_LIMITS.sortOrderMin} and ${CUSTOM_PAGE_LIMITS.sortOrderMax}.`;
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      title,
      slug,
      content: sanitizeCustomPageHtml(content),
      seo_title: seoTitle === null ? null : seoTitle.trim() || null,
      seo_description: seoDescription === null ? null : seoDescription.trim() || null,
      published: value.published ?? false,
      show_in_header: value.show_in_header ?? false,
      show_in_footer: value.show_in_footer ?? false,
      sort_order: sortOrder,
    },
  };
}
