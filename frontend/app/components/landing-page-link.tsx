import type { ComponentProps, ReactNode } from 'react';

import { Link } from '@remix-run/react';

import clsx from 'clsx';

export interface LandingPageLinkProps extends Omit<ComponentProps<typeof Link>, 'children' | 'title'> {
  children: ReactNode;
  title: ReactNode;
}

export function LandingPageLink(props: LandingPageLinkProps) {
  const { className, children, title, ...linkProps } = props;
  const linkResetClassNames = '!text-inherit !no-underline !decoration-inherit';
  return (
    <Link className={clsx(linkResetClassNames, 'block rounded-lg border border-gray-200 p-6 shadow hover:bg-gray-100', className)} {...linkProps}>
      <h2 className="h3 !mt-0">{title}</h2>
      <p className="m-0">{children}</p>
    </Link>
  );
}
