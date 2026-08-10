'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@ui/components/ui/responsive-dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'ui/components/ui/alert-dialog';
import { Badge } from 'ui/components/ui/badge';
import { Button } from 'ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui/components/ui/card';
import { Input } from 'ui/components/ui/input';
import { Label } from 'ui/components/ui/label';
import { Switch } from 'ui/components/ui/switch';
import { Textarea } from 'ui/components/ui/textarea';
import {
  CUSTOM_PAGE_LIMITS,
  getCustomPageNavigationLabel,
  getCustomPageStatusLabel,
  validateCustomPageInput,
} from '@/lib/custom-pages.mjs';
import { CustomPageProps } from '@/lib/types';
import RichTextEditor from '@/components/shared/tiptap-editor';

type CustomPage = CustomPageProps['Row'];

type PageForm = {
  title: string;
  slug: string;
  content: string;
  seo_title: string;
  seo_description: string;
  published: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  sort_order: string;
};

type PagePayload = {
  title: string;
  slug: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  sort_order: number;
};

function pageFormPayload(form: PageForm): PagePayload {
  return {
    title: form.title,
    slug: form.slug,
    content: form.content,
    seo_title: form.seo_title.trim() || null,
    seo_description: form.seo_description.trim() || null,
    published: form.published,
    show_in_header: form.show_in_header,
    show_in_footer: form.show_in_footer,
    sort_order: Number(form.sort_order),
  };
}

function changedPagePayload(payload: PagePayload, page: CustomPage): Partial<PagePayload> {
  const original = pageFormPayload(pageToForm(page));
  return Object.fromEntries(
    (Object.keys(payload) as (keyof PagePayload)[])
      .filter((field) => payload[field] !== original[field])
      .map((field) => [field, payload[field]])
  ) as Partial<PagePayload>;
}

function validatePageForm(form: PageForm) {
  if (!/^-?\d+$/.test(form.sort_order.trim())) {
    return { success: false as const, errors: { sort_order: 'Sort order must be an integer.' } };
  }
  return validateCustomPageInput(pageFormPayload(form));
}

function pageToForm(page?: CustomPage): PageForm {
  return {
    title: page?.title ?? '',
    slug: page?.slug ?? '',
    content: page?.content ?? '',
    seo_title: page?.seo_title ?? '',
    seo_description: page?.seo_description ?? '',
    published: page?.published ?? false,
    show_in_header: page?.show_in_header ?? false,
    show_in_footer: page?.show_in_footer ?? false,
    sort_order: String(page?.sort_order ?? 0),
  };
}

async function customPageRequest(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'Unable to save the custom page.';
    throw new Error(message);
  }

  return body;
}

function CustomPageDialog({
  projectSlug,
  page,
  trigger,
}: {
  projectSlug: string;
  page?: CustomPage;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [form, setForm] = useState<PageForm>(() => pageToForm(page));
  const isEditing = Boolean(page);
  const formValidation = validatePageForm(form);
  const validationMessage = formValidation.success ? null : Object.values(formValidation.errors)[0];
  const fullPayload = pageFormPayload(form);
  const payload = page ? changedPagePayload(fullPayload, page) : fullPayload;
  const hasChanges = !page || Object.keys(payload).length > 0;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(pageToForm(page));
      setEditorVersion((version) => version + 1);
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValidation.success) {
      toast.error(validationMessage || 'Please correct the custom page fields.');
      return;
    }

    if (!hasChanges) {
      toast.error('Make a change before saving.');
      return;
    }

    const url = isEditing
      ? `/api/v1/projects/${projectSlug}/pages/${page!.id}`
      : `/api/v1/projects/${projectSlug}/pages`;
    const request = customPageRequest(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(true);
    toast.promise(request, {
      loading: isEditing ? 'Updating page...' : 'Creating page...',
      success: isEditing ? 'Page updated successfully.' : 'Page created successfully.',
      error: (error) => (error instanceof Error ? error.message : 'Unable to save the custom page.'),
    });

    try {
      await request;
      setOpen(false);
      router.refresh();
    } catch {
      // The toast above presents the API error to the user.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className='max-h-[96%] overflow-y-auto sm:max-w-3xl'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{isEditing ? 'Edit custom page' : 'Create custom page'}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Add legal or informational content to your public hub.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className='grid gap-5 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor={`${page?.id ?? 'new'}-title`}>Title</Label>
              <Input
                id={`${page?.id ?? 'new'}-title`}
                value={form.title}
                onChange={(event) => {
                  setForm((current) => ({ ...current, title: event.target.value }));
                }}
                placeholder='Privacy Policy'
                maxLength={CUSTOM_PAGE_LIMITS.title}
                required
                disabled={submitting}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${page?.id ?? 'new'}-slug`}>Slug</Label>
              <div className='flex items-center rounded-md border'>
                <span className='text-muted-foreground px-3 text-sm' aria-hidden='true'>
                  /
                </span>
                <Input
                  id={`${page?.id ?? 'new'}-slug`}
                  className='border-0 pl-0 focus-visible:ring-0 focus-visible:ring-offset-0'
                  value={form.slug}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, slug: event.target.value }));
                  }}
                  placeholder='privacy'
                  maxLength={CUSTOM_PAGE_LIMITS.slug}
                  pattern='[A-Za-z0-9 _-]+'
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label id={`${page?.id ?? 'new'}-content-label`}>Content</Label>
            <div
              role='group'
              aria-labelledby={`${page?.id ?? 'new'}-content-label`}
              className='bg-background min-h-[220px] rounded-md border p-4'>
              <RichTextEditor
                key={`${page?.id ?? 'new'}-${editorVersion}`}
                content={form.content}
                setContent={(content) => {
                  setForm((current) => ({ ...current, content }));
                }}
                placeholder='Write your page content...'
                ariaLabel='Page content'
                characterLimit={CUSTOM_PAGE_LIMITS.content}
                className='min-h-[188px]'
              />
            </div>
          </div>

          <div className='grid gap-5 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor={`${page?.id ?? 'new'}-seo-title`}>SEO title</Label>
              <Input
                id={`${page?.id ?? 'new'}-seo-title`}
                value={form.seo_title}
                onChange={(event) => {
                  setForm((current) => ({ ...current, seo_title: event.target.value }));
                }}
                placeholder='Optional search result title'
                maxLength={CUSTOM_PAGE_LIMITS.seoTitle}
                disabled={submitting}
              />
            </div>
            <div className='space-y-2 sm:row-span-2'>
              <Label htmlFor={`${page?.id ?? 'new'}-seo-description`}>SEO description</Label>
              <Textarea
                id={`${page?.id ?? 'new'}-seo-description`}
                value={form.seo_description}
                onChange={(event) => {
                  setForm((current) => ({ ...current, seo_description: event.target.value }));
                }}
                placeholder='Optional search result description'
                maxLength={CUSTOM_PAGE_LIMITS.seoDescription}
                className='min-h-[92px] resize-none'
                disabled={submitting}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${page?.id ?? 'new'}-sort-order`}>Sort order</Label>
              <Input
                id={`${page?.id ?? 'new'}-sort-order`}
                type='number'
                step='1'
                min={CUSTOM_PAGE_LIMITS.sortOrderMin}
                max={CUSTOM_PAGE_LIMITS.sortOrderMax}
                value={form.sort_order}
                onChange={(event) => {
                  setForm((current) => ({ ...current, sort_order: event.target.value }));
                }}
                disabled={submitting}
              />
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            {(
              [
                ['published', 'Published'],
                ['show_in_header', 'Show in header'],
                ['show_in_footer', 'Show in footer'],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className='flex items-center justify-between gap-3 rounded-md border p-3'>
                <Label htmlFor={`${page?.id ?? 'new'}-${field}`}>{label}</Label>
                <Switch
                  id={`${page?.id ?? 'new'}-${field}`}
                  checked={form[field]}
                  onCheckedChange={(checked) => {
                    setForm((current) => ({ ...current, [field]: checked }));
                  }}
                  disabled={submitting}
                />
              </div>
            ))}
          </div>

          <div aria-live='polite' className='text-destructive min-h-5 text-sm'>
            {validationMessage || (!hasChanges ? 'Make a change before saving.' : '')}
          </div>

          <ResponsiveDialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setOpen(false);
              }}
              disabled={submitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={submitting || !formValidation.success || !hasChanges}>
              {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create page'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function DeleteCustomPage({ projectSlug, page }: { projectSlug: string; page: CustomPage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const request = customPageRequest(`/api/v1/projects/${projectSlug}/pages/${page.id}`, {
      method: 'DELETE',
    });

    setDeleting(true);
    toast.promise(request, {
      loading: 'Deleting page...',
      success: 'Page deleted successfully.',
      error: (error) => (error instanceof Error ? error.message : 'Unable to delete the custom page.'),
    });

    try {
      await request;
      setOpen(false);
      router.refresh();
    } catch {
      // The toast above presents the API error to the user.
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleting) setOpen(nextOpen);
      }}>
      <AlertDialogTrigger asChild>
        <Button variant='ghost' size='sm' className='text-destructive hover:text-destructive' disabled={deleting}>
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{page.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This custom page will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive hover:bg-destructive/90'
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}>
            {deleting ? 'Deleting...' : 'Delete page'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CustomPagesManager({
  projectSlug,
  pages,
}: {
  projectSlug: string;
  pages: CustomPage[];
}) {
  return (
    <Card className='flex w-full flex-col'>
      <CardHeader className='flex flex-col items-stretch justify-between gap-4 space-y-0 sm:flex-row sm:items-start'>
        <div className='space-y-1.5'>
          <CardTitle>Custom Pages</CardTitle>
          <CardDescription>Manage legal and informational pages for your public hub.</CardDescription>
        </div>
        <CustomPageDialog
          projectSlug={projectSlug}
          trigger={
            <Button className='w-full shrink-0 sm:w-auto'>
              <Plus className='mr-2 h-4 w-4' />
              New Page
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-4 rounded-md border border-dashed px-6 py-12 text-center'>
            <div className='space-y-1'>
              <p className='font-medium'>No custom pages yet</p>
              <p className='text-muted-foreground text-sm'>Create a page for policies, terms, or other hub content.</p>
            </div>
            <CustomPageDialog projectSlug={projectSlug} trigger={<Button variant='outline'>Create your first page</Button>} />
          </div>
        ) : (
          <div className='divide-y rounded-md border'>
            {pages.map((page) => (
              <div key={page.id} className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0 space-y-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='truncate font-medium'>{page.title}</p>
                    <Badge variant='secondary'>{getCustomPageStatusLabel(page.published)}</Badge>
                    <Badge variant='secondary'>Order {page.sort_order}</Badge>
                  </div>
                  <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm'>
                    <span>/{page.slug}</span>
                    <span>{getCustomPageNavigationLabel(page.show_in_header, page.show_in_footer)}</span>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-1 self-end sm:self-auto'>
                  <CustomPageDialog
                    projectSlug={projectSlug}
                    page={page}
                    trigger={
                      <Button variant='ghost' size='sm'>
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                      </Button>
                    }
                  />
                  <DeleteCustomPage projectSlug={projectSlug} page={page} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
