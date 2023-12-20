import { Link, type LinkProps } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the AppLink component.
 */
export type AppLinkProps = { locale?: 'en' | 'fr' } & LinkProps;

/**
 * A component that renders a localized link.
 */
export function AppLink({ locale, ...props }: AppLinkProps) {
  const { i18n } = useTranslation();

  const targetLocale = locale ?? i18n.language;
  const path = `/${targetLocale}${props.to}`;

  return (
    <Link {...props} to={path}>
      {props.children}
    </Link>
  );
}
