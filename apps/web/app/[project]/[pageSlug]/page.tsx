import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedCustomPage } from '@/lib/api/custom-pages';
import { sanitizeCustomPageHtml } from '@/lib/custom-pages.mjs';

type Props = {
  params: { project: string; pageSlug: string };
};

async function getPageOrNotFound({ project, pageSlug }: Props['params']) {
  const { data: page } = await getPublishedCustomPage(project, pageSlug, 'server');

  if (!page) {
    notFound();
  }

  return page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPageOrNotFound(params);
  const title = page.seo_title || page.title;
  const description = page.seo_description || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function CustomPage({ params }: Props) {
  const page = await getPageOrNotFound(params);

  return (
    <article className='flex w-full flex-col gap-8 px-5 pb-16 sm:px-10 md:px-10 lg:px-20'>
      <h1 className='text-3xl font-medium sm:text-4xl'>{page.title}</h1>
      <div
        className='prose prose-zinc text-foreground/80 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-highlight dark:prose-invert max-w-none font-light'
        dangerouslySetInnerHTML={{ __html: sanitizeCustomPageHtml(page.content) }}
      />
    </article>
  );
}
