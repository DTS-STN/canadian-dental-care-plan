import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:exit-application.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('apply:exit-application.page-title') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  return json({ id });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  await applyFlow.loadState({ request, params });
  //TODO: Add apply form logic
  const sessionResponseInit = await applyFlow.clearState({ request, params });
  return redirect(`/apply`, sessionResponseInit);
}

export default function ApplyFlowTaxFiling() {
  const { id } = useLoaderData<typeof loader>();

  const { t } = useTranslation(handle.i18nNamespaces);

  return (
    <div className="space-y-6">
      <p>{t('apply:exit-application.are-you-sure')}</p>
      <p>{t('apply:exit-application.click-back')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Form method="post" noValidate>
          <ButtonLink variant="alternative" id="back-button" to={`/apply/${id}/review-information`}>
            {t('apply:exit-application.back-btn')}
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          </ButtonLink>
          <Button variant="primary">{t('apply:exit-application.exit-btn')}</Button>
        </Form>
      </div>
    </div>
  );
}
