import { type Namespace } from 'i18next';

import type gcweb from '~/public/locales/en/gcweb.json';

export interface RouteHandle extends Record<string, unknown> {
  i18nNamespaces?: Namespace;
  breadcrumbs?: Array<{ i18nKey: typeof gcweb; to?: string }>;
}
