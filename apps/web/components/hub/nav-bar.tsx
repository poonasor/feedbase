'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@ui/components/ui/button';
import { cn } from '@ui/lib/utils';
import { satoshi } from '@ui/styles/fonts';
import { ProfileProps, ProjectConfigWithoutSecretProps, ProjectProps } from '@/lib/types';
import { hslToHex } from '@/lib/utils';
import UserDropdown from '../shared/user-dropdown';
import AuthModal from './modals/login-signup-modal';

interface TabProps {
  name: string;
  link: string;
}

export default function Header({
  tabs,
  initialTab,
  project,
  config,
  user,
}: {
  tabs: TabProps[];
  initialTab?: TabProps;
  project: ProjectProps['Row'];
  config: ProjectConfigWithoutSecretProps;
  user: ProfileProps['Row'] | null;
}) {
  const pathname = usePathname();
  const currentTab = pathname
    ? tabs.find((tab) => pathname === tab.link || pathname.startsWith(`${tab.link}/`))
    : initialTab;

  return (
    <div className='flex w-full flex-col items-center gap-4 px-5 sm:px-10 lg:max-w-screen-xl'>
      {/* Branding & User */}
      <div className='flex w-full flex-row items-center justify-between'>
        {/* Branding */}
        <Link
          className='flex cursor-pointer select-none flex-row items-center gap-3'
          href={config.logo_redirect_url || '/'}>
          {/* Logo Image */}
          {project?.icon ? (
            <img
              src={project?.icon || ''}
              alt='Logo'
              width={35}
              height={35}
              className={project?.icon_radius || ''}
            />
          ) : null}

          {/* Name */}
          <div
            className={cn(
              satoshi.variable,
              'text-foreground/90 font-satoshi text-center text-xl font-medium'
            )}>
            {project?.name}
          </div>
        </Link>

        {/* User */}
        {user ? (
          <UserDropdown
            user={user}
            iconColor={
              config.custom_theme === 'custom' ? hslToHex(config.custom_theme_primary_foreground) : undefined
            }
          />
        ) : null}

        {/* Login */}
        {!config.integration_sso_status && !user && (
          <AuthModal projectSlug={project?.slug || ''}>
            <Button variant='default'>Login</Button>
          </AuthModal>
        )}

        {/* SSO */}
        {config.integration_sso_status && !user ? (
          <Link href={config.integration_sso_url || ''}>
            <Button variant='default'>Login with {project?.name}</Button>
          </Link>
        ) : null}
      </div>

      {/* Navigation */}
      <div className='flex h-fit w-full flex-row items-center gap-4'>
        {tabs.map((tab) => {
          const isActive = tab.link === currentTab?.link;

          return (
            <Link
              href={tab.link}
              className={cn('pb-[6px] first:-ml-3', isActive && 'border-foreground border-b-2')}
              key={tab.link}>
              <Button
                variant='secondary'
                size='sm'
                className='text-foreground/90 hover:bg-foreground/10 inline-flex items-center rounded-md px-3 py-1 text-base font-light transition-colors duration-150'>
                {tab.name}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
