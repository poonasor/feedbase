import Link from 'next/link';
import { Separator } from '@ui/components/ui/separator';

interface FooterLink {
  name: string;
  link: string;
}

export default function Footer({ links }: { links: FooterLink[] }) {
  if (links.length === 0) return null;

  return (
    <footer className='mt-auto flex w-full flex-col items-center pt-12'>
      <Separator className='bg-border/60' />
      <nav
        aria-label='Footer navigation'
        className='flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 px-5 py-8 text-sm sm:px-10 lg:max-w-screen-xl'>
        {links.map((link) => (
          <Link
            className='text-foreground/70 hover:text-foreground transition-colors duration-150'
            href={link.link}
            key={link.link}>
            {link.name}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
