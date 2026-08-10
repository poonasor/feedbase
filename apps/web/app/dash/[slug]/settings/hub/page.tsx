import HubConfigCards from '@/components/dashboard/settings/hub-cards';
import CustomPagesManager from '@/components/dashboard/settings/custom-pages-manager';
import { getAllCustomPages } from '@/lib/api/custom-pages';
import { getProjectBySlug, getProjectConfigBySlug } from '@/lib/api/projects';

export default async function HubSettings({ params }: { params: { slug: string } }) {
  const [projectResult, projectConfigResult, customPagesResult] = await Promise.all([
    getProjectBySlug(params.slug, 'server'),
    getProjectConfigBySlug(params.slug, 'server'),
    getAllCustomPages(params.slug, 'server'),
  ]);

  if (projectResult.error) {
    return <div>{projectResult.error.message}</div>;
  }

  if (projectConfigResult.error) {
    return <div>{projectConfigResult.error.message}</div>;
  }

  if (customPagesResult.error) {
    return <div>{customPagesResult.error.message}</div>;
  }

  return (
    <div className='flex h-full w-full flex-col space-y-6 overflow-y-auto'>
      <HubConfigCards
        projectData={projectResult.data}
        projectConfigData={projectConfigResult.data}
      />
      <CustomPagesManager projectSlug={params.slug} pages={customPagesResult.data} />
    </div>
  );
}
