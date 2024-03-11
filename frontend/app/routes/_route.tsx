import { MetaFunction } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getDescriptionMetaTags, getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('gcweb'),
} as const satisfies RouteHandleData;

export const meta: MetaFunction = mergeMeta((args) => {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const author = t('gcweb:meta.author');
  const description = t('gcweb:meta.description');
  const language = i18n.language === 'fr' ? 'fra' : 'eng';
  const locale = `${i18n.language}_CA`;
  const siteName = t('gcweb:meta.site-name');
  const subject = t('gcweb:meta.subject');
  const title = t('gcweb:meta.title.default');
  return [
    ...getTitleMetaTags(title),
    ...getDescriptionMetaTags(description),
    { name: 'author', content: author },
    { name: 'dcterms.accessRights', content: '2' },
    { name: 'dcterms.creator', content: author },
    { name: 'dcterms.language', content: language },
    { name: 'dcterms.service', content: 'ESDC-EDSC_CDCP-RCSD' },
    { name: 'dcterms.spatial', content: 'Canada' },
    { name: 'dcterms.subject', content: subject },
    { property: 'og:locale', content: locale },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: title },
    { property: 'og:type', content: 'website' },
  ];
});
