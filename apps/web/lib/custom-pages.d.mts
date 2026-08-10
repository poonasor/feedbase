export interface CustomPageInput {
  title: string;
  slug: string;
  content: string;
  seo_title?: string | null;
  seo_description?: string | null;
  published?: boolean;
  show_in_header?: boolean;
  show_in_footer?: boolean;
  sort_order?: number;
}

export interface ValidatedCustomPageInput {
  title: string;
  slug: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  sort_order: number;
}

export const CUSTOM_PAGE_LIMITS: Readonly<{
  title: number;
  slug: number;
  seoTitle: number;
  seoDescription: number;
  content: number;
  sortOrderMin: number;
  sortOrderMax: number;
}>;
export const RESERVED_CUSTOM_PAGE_SLUGS: ReadonlySet<string>;
export function normalizeCustomPageSlug(value: unknown): string;
export function isValidCustomPageId(value: unknown): boolean;
export function sanitizeCustomPageHtml(value: unknown): string;
export function validateCustomPageInput(
  input: unknown
):
  | { success: true; data: ValidatedCustomPageInput }
  | { success: false; errors: Record<string, string>; data?: never };
export function validateCustomPageApiInput(
  input: unknown,
  current?: ValidatedCustomPageInput
):
  | { success: true; data: ValidatedCustomPageInput }
  | { success: false; errors: Record<string, string>; data?: never };
export function mapCustomPageDatabaseError(error: unknown): { message: string; status: number };
