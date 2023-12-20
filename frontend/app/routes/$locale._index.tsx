import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';
import { getLocale } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.pageTitle }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = getLocale(request.url);
  const { pathname } = new URL(request.url);

  if (pathname !== '/' && locale === undefined) {
    throw new Response('Not found', { status: 404, statusText: 'Not found' });
  }

  const t = await getFixedT(request, 'common');
  return json({ pageTitle: t('index.page-title') });
};

export const handle = {
  i18nNamespaces: ['common'],
};

export default function Index() {
  const { t } = useTranslation('common');

  return (
    <>
      <h1 className="text-3xl font-bold underline">{t('index.page-title')}</h1>
      <LanguageSwitcher />
    </>
  );
}
