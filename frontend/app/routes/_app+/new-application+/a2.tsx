import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('new-application');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'new-application:a2.breadcrumbs.new-application' }, { labelI18nKey: 'new-application:a2.breadcrumbs.a2' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0016',
  pageTitleI18nKey: 'new-application:a2.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const selectedType = session.get('selectedType');

  return json({ selectedType });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const formDataRadio = Object.fromEntries(await request.formData());
  const selectedType = formDataRadio.selectedType === 'self';
  session.set('selectedType', selectedType);

  return redirect('/new-application/a3', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function A2() {
  useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  const updateValidationMessage = () => {
    (document.getElementById('input-radio-selected-type-option-0') as HTMLInputElement).setCustomValidity(t('new-application:a2.required'));
  };

  return (
    <>
      <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
      <Form method="post">
        <InputRadios
          id="selected-type"
          name="selectedType"
          legend={t('new-application:a2.choose-type')}
          options={[
            { value: 'self', children: t('new-application:a2.self') },
            { value: 'else', children: t('new-application:a2.else') },
          ]}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" to="/new-application/">
            {t('new-application:a2.back')}
          </ButtonLink>
          <Button id="confirm-button" variant="primary" onClick={updateValidationMessage}>
            {t('new-application:a2.continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
