import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Separator } from 'ui/components/ui/separator';
import { getPublishedCustomPageNavigation } from '@/lib/api/custom-pages';
import { getProjectBySlug, getProjectConfigBySlug } from '@/lib/api/projects';
import { getCurrentUser } from '@/lib/api/user';
import Footer from '@/components/hub/footer';
import Header from '@/components/hub/nav-bar';
import CustomThemeWrapper from '@/components/hub/theme-wrapper';
import { ThemeProvider as NextThemeProvider } from '@/components/theme-provider';

type Props = {
  children: React.ReactNode;
  params: { project: string };
};

type NavigationItem = {
  name: string;
  link: string;
};

const BUILT_IN_TABS = Object.freeze([
  {
    name: 'Feedback',
    link: '/feedback',
  },
  {
    name: 'Changelog',
    link: '/changelog',
  },
]);

// Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Get project
  const { data: project, error } = await getProjectBySlug(params.project, 'server', true, false);

  // If project is undefined redirects to 404
  if (error?.status === 404 || !project) {
    notFound();
  }

  return {
    title: project.name,
    description: `Discover the latest updates, roadmaps, submit feedback, and explore more about ${project.name}.`,
    icons: project.icon,
    openGraph: {
      images: [
        {
          url: project.og_image || '',
          width: 1200,
          height: 600,
          alt: project.name,
        },
      ],
    },
  };
}

export default async function HubLayout({ children, params }: Props) {
  const headerList = headers();
  const pathname = headerList.get('x-pathname');
  const hostname = headerList.get('host');

  // Only the public hub root redirects. Other paths must reach their child route.
  if (pathname === '/') {
    redirect('/feedback');
  }

  // Get project data
  const { data: project, error } = await getProjectBySlug(params.project, 'server', true, false);

  if (error?.status === 404 || !project) {
    notFound();
  }

  // Get project config
  const { data: config } = await getProjectConfigBySlug(params.project, 'server', true, false);

  if (!config) {
    notFound();
  }

  // Check if custom domain is set and redirect to it without dropping the public path.
  if (config.custom_domain && config.custom_domain_verified && hostname !== config.custom_domain) {
    redirect(new URL(pathname || '/', `https://${config.custom_domain}`).toString());
  }

  const [{ data: customPageNavigation }, { data: user }] = await Promise.all([
    getPublishedCustomPageNavigation(params.project, 'server'),
    getCurrentUser('server'),
  ]);

  const builtInTabs: NavigationItem[] = BUILT_IN_TABS.filter(
    (tab) => tab.link !== '/changelog' || config.changelog_enabled
  ).map((tab) => ({ ...tab }));
  const headerTabs: NavigationItem[] = [
    ...builtInTabs,
    ...(customPageNavigation || [])
      .filter((page) => page.show_in_header)
      .map((page) => ({ name: page.title, link: `/${page.slug}` })),
  ];
  const footerLinks: NavigationItem[] = (customPageNavigation || [])
    .filter((page) => page.show_in_footer)
    .map((page) => ({ name: page.title, link: `/${page.slug}` }));
  const currentTab = pathname
    ? headerTabs.find((tab) => pathname === tab.link || pathname.startsWith(`${tab.link}/`))
    : undefined;

  return (
    <CustomThemeWrapper projectConfig={config}>
      <NextThemeProvider
        attribute='class'
        defaultTheme={
          config.custom_theme === 'custom' ? undefined : config.custom_theme === 'light' ? 'light' : 'dark'
        }>
        <div className='flex min-h-screen w-full flex-col items-center pt-5'>
          {/* Header */}
          <Header tabs={headerTabs} initialTab={currentTab} project={project} user={user} config={config} />

          {/* Separator with max screen width */}
          <Separator className='bg-border/60' />

          {/* Main content */}
          <div className='flex h-full w-full flex-col items-start justify-start pt-10 lg:max-w-screen-xl'>
            {children}
          </div>

          <Footer links={footerLinks} />
        </div>
      </NextThemeProvider>
    </CustomThemeWrapper>
  );
}
