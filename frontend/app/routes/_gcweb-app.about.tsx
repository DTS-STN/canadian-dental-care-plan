import { type LoaderFunctionArgs, json } from '@remix-run/node';

import { type Namespace } from 'i18next';
import { useTranslation } from 'react-i18next';

import { getFixedT } from '~/utils/locale-utils.server';

const i18nNamespaces: Namespace = ['common'];

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, i18nNamespaces);

  return json({
    breadcrumbs: [{ label: t('common:about.breadcrumbs.home'), to: '/' }, { label: t('common:about.breadcrumbs.about') }],
    i18nNamespaces,
    pageIdentifier: 'CDCP-0002',
    pageTitle: t('common:about.page-title'),
  });
}

export default function () {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:about.page-title')}
      </h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu tempor est. Maecenas vitae urna quis mauris tristique dapibus et nec diam. Morbi vulputate sollicitudin justo ut tempor. Aliquam aliquam condimentum dolor ut tincidunt. Duis at
        mattis lacus. Praesent rhoncus ipsum sit amet eros semper, et accumsan nibh consequat. Nulla pretium leo et purus dapibus, a molestie nunc dignissim. Donec at tincidunt velit, id iaculis nunc. In vitae aliquam velit, nec vulputate nisi. Vestibulum
        in metus quis lacus facilisis sodales in at ligula. Donec et lacus sit amet magna efficitur ornare. Phasellus sem enim, ullamcorper eu porta et, egestas nec massa. Aenean sollicitudin, eros sed facilisis imperdiet, leo magna gravida felis, ac
        consequat lorem mi et urna. Aliquam accumsan sem eget justo pharetra, nec ullamcorper nunc laoreet.
      </p>
    </>
  );
}
