import { useRouteLoaderData } from '@remix-run/react';
import { To } from '@remix-run/router';

import { useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from './locale-utils';
import { loader as rootLoader } from '~/root';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export function useUserOrigin(): { to: To; text: string } | undefined {
  const data = useRouteLoaderData<typeof rootLoader>('root');
  const { t } = useTranslation(i18nNamespaces);

  if (!data) return undefined;

  switch (data.userOrigin) {
    case 'msca': {
      return {
        to: t('gcweb:header.menu-msca-home.href', { baseUri: data.env.MSCA_HOME_URI }),
        text: t('gcweb:header.menu-dashboard.text'),
      };
    }
    case 'msca-d': {
      return {
        to: t('gcweb:header.menu-dashboard.href', { baseUri: data.env.SCCH_BASE_URI }),
        text: t('gcweb:header.menu-dashboard.text'),
      };
    }
    default: {
      throw Error(`Origin '${origin}' not supported.`);
    }
  }
}
