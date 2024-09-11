import { useRouteLoaderData } from '@remix-run/react';
import type { To } from '@remix-run/router';

import { useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from './locale-utils';
import type { loader as rootLoader } from '~/root';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export function useUserOrigin(): { to: To; text: string; isFromMSCAD: boolean } | undefined {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  const { t } = useTranslation(i18nNamespaces);

  if (!data) return undefined;

  switch (data.userOrigin) {
    case 'msca-d': {
      return {
        to: t('gcweb:header.menu-dashboard.href', { baseUri: data.env.SCCH_BASE_URI }),
        text: t('gcweb:header.menu-dashboard.text'),
        isFromMSCAD: true,
      };
    }
    default: {
      throw Error(`Origin '${origin}' not supported.`);
    }
  }
}
