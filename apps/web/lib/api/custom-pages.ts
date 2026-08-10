import { withProjectAuth } from '@/lib/auth';
import {
  isValidCustomPageId,
  mapCustomPageDatabaseError,
  normalizeCustomPageSlug,
  validateCustomPageApiInput,
  type ValidatedCustomPageInput,
} from '@/lib/custom-pages.mjs';
import { CustomPageProps } from '@/lib/types';

export type CustomPageNavigationItem = Pick<
  CustomPageProps['Row'],
  'id' | 'title' | 'slug' | 'show_in_header' | 'show_in_footer' | 'sort_order'
>;

const notFoundError = { message: 'Custom page not found.', status: 404 };
const invalidIdError = { message: 'Invalid custom page id.', status: 400 };

function validationError(errors: Record<string, string>) {
  return { message: Object.values(errors).join(' '), status: 400 };
}

function editableFields(page: CustomPageProps['Row']): ValidatedCustomPageInput {
  return {
    title: page.title,
    slug: page.slug,
    content: page.content,
    seo_title: page.seo_title,
    seo_description: page.seo_description,
    published: page.published,
    show_in_header: page.show_in_header,
    show_in_footer: page.show_in_footer,
    sort_order: page.sort_order,
  };
}

export const getAllCustomPages = withProjectAuth<CustomPageProps['Row'][]>(
  async (_user, supabase, project, authError) => {
    if (authError) return { data: null, error: authError };

    const { data, error } = await supabase
      .from('custom_pages')
      .select()
      .eq('project_id', project!.id)
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true })
      .order('id', { ascending: true });

    if (error) return { data: null, error: mapCustomPageDatabaseError(error) };
    return { data, error: null };
  }
);

export const getPublishedCustomPage = (
  projectSlug: string,
  pageSlug: string,
  cType: 'server' | 'route' = 'server'
) =>
  withProjectAuth<CustomPageProps['Row']>(async (_user, supabase, project, authError) => {
    if (authError) return { data: null, error: authError };

    const { data, error } = await supabase
      .from('custom_pages')
      .select()
      .eq('project_id', project!.id)
      .eq('slug', normalizeCustomPageSlug(pageSlug))
      .eq('published', true)
      .maybeSingle();

    if (error) return { data: null, error: mapCustomPageDatabaseError(error) };
    if (!data) return { data: null, error: notFoundError };
    return { data, error: null };
  })(projectSlug, cType, true, false);

export const getPublishedCustomPageNavigation = (
  projectSlug: string,
  cType: 'server' | 'route' = 'server'
) =>
  withProjectAuth<CustomPageNavigationItem[]>(async (_user, supabase, project, authError) => {
    if (authError) return { data: null, error: authError };

    const { data, error } = await supabase
      .from('custom_pages')
      .select('id, title, slug, show_in_header, show_in_footer, sort_order')
      .eq('project_id', project!.id)
      .eq('published', true)
      .or('show_in_header.eq.true,show_in_footer.eq.true')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true })
      .order('id', { ascending: true });

    if (error) return { data: null, error: mapCustomPageDatabaseError(error) };
    return { data, error: null };
  })(projectSlug, cType, true, false);

export const createCustomPage = (projectSlug: string, input: unknown, cType: 'server' | 'route') =>
  withProjectAuth<CustomPageProps['Row']>(async (_user, supabase, project, authError) => {
    if (authError) return { data: null, error: authError };

    const validation = validateCustomPageApiInput(input);
    if (!validation.success) return { data: null, error: validationError(validation.errors) };

    const { data, error } = await supabase
      .from('custom_pages')
      .insert({ ...validation.data, project_id: project!.id })
      .select()
      .single();

    if (error) return { data: null, error: mapCustomPageDatabaseError(error) };
    return { data, error: null };
  })(projectSlug, cType);

export const updateCustomPage = (
  id: string,
  projectSlug: string,
  input: unknown,
  cType: 'server' | 'route'
) =>
  withProjectAuth<CustomPageProps['Row']>(async (_user, supabase, project, authError) => {
    if (authError) return { data: null, error: authError };
    if (!isValidCustomPageId(id)) return { data: null, error: invalidIdError };

    const { data: current, error: currentError } = await supabase
      .from('custom_pages')
      .select()
      .eq('id', id)
      .eq('project_id', project!.id)
      .maybeSingle();

    if (currentError) return { data: null, error: mapCustomPageDatabaseError(currentError) };
    if (!current) return { data: null, error: notFoundError };

    const validation = validateCustomPageApiInput(input, editableFields(current));
    if (!validation.success) return { data: null, error: validationError(validation.errors) };

    const { data, error } = await supabase
      .from('custom_pages')
      .update(validation.data)
      .eq('id', id)
      .eq('project_id', project!.id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: mapCustomPageDatabaseError(error) };
    if (!data) return { data: null, error: notFoundError };
    return { data, error: null };
  })(projectSlug, cType);

export const deleteCustomPage = (id: string, projectSlug: string, cType: 'server' | 'route') =>
  withProjectAuth<CustomPageProps['Row']>(async (_user, supabase, project, authError) => {
    if (authError) return { data: null, error: authError };
    if (!isValidCustomPageId(id)) return { data: null, error: invalidIdError };

    const { data, error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id)
      .eq('project_id', project!.id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: mapCustomPageDatabaseError(error) };
    if (!data) return { data: null, error: notFoundError };
    return { data, error: null };
  })(projectSlug, cType);
