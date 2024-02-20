import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('intake-forms');
export const handle = {
  breadcrumbs: [{ labelI18nKey: 'intake-forms:application-type.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-1111',
  pageTitleI18nKey: 'intake-forms:application-type.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  //TODO
  //COMPLETE ONCE THE NEXT PAGE IS ADDED

  return json({ ok: true });
}

export default function ApplicationType() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <Form method="post">
        <div>
          <InputRadios
            id="selected-address"
            name="selectedAddress"
            legend={t('intake-forms:application-type.i-am')}
            options={[
              { value: 'myself', children: t('intake-forms:application-type.appliying-myself') },
              { value: 'someone-else', children: t('intake-forms:application-type.applying-else') },
            ]}
            required
          />
        </div>
        <div>
          <ButtonLink id="back-button" to="/">
            {t('intake-forms:application-type.button-back')}
          </ButtonLink>
          <Button id="confirm-button" variant="primary">
            {t('intake-forms:application-type.button-continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
