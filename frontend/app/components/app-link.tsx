import { ComponentProps } from 'react';

import { Link, useHref, useParams } from '@remix-run/react';

/**
 * Props for the AppLink component.
 */
export interface AppLinkProps extends ComponentProps<typeof Link> {
  targetLang?: 'en' | 'fr';
}

/**
 * A component that renders a localized link.
 */
export function AppLink({ targetLang, ...props }: AppLinkProps) {
  const href = useHref(props.to);
  const { lang: langParam } = useParams();

  const isExternalHref = typeof props.to === 'string' && props.to.startsWith('http');

  if (isExternalHref) {
    // external links must be respected as they are 🫡
    return <Link {...props} />;
  }

  // passed-in language takes precedence over language in URL
  const lang = targetLang ?? langParam;
  const localizedTo = `/${lang}${href}`;

  return (
    <Link {...props} to={localizedTo}>
      {props.children}
    </Link>
  );
}
