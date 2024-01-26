import type { ComponentProps, ReactNode } from 'react';

import { Link } from '@remix-run/react';

export interface LandingPageLinkProps extends Omit<ComponentProps<typeof Link>, 'children' | 'title'> {
  children: ReactNode;
  description: string;
  title: ReactNode;
}

export function LandingPageLink(props: LandingPageLinkProps) {
  const { className, children, description, title, ...linkProps } = props;
  return (
    <div className="header-bg rounded-lg border p-6 shadow">
      <h2 className="h3 !mt-0">{title}</h2>
      <p>{description}</p>
      <Link {...linkProps}>{children}</Link>
    </div>
  );
}
