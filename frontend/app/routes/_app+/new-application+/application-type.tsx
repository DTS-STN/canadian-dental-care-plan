import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('new-application');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'new-application:application-type.breadcrumbs.new-application' }, { labelI18nKey: 'new-application:application-type.breadcrumbs.application-type' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0016',
  pageTitleI18nKey: 'new-application:application-type.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const applyingFor = session.get('applyingFor');

  return json({ applyingFor });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const formDataRadio = Object.fromEntries(await request.formData());
  const applyingForSelf = formDataRadio.applyingFor === 'self';
  session.set('applyingForSelf', applyingForSelf);

  return redirect('/new-application/a3', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function ApplicationType() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
      <Form method="post">
        <InputRadios
          id="applying-for"
          name="applyingFor"
          legend={t('new-application:application-type.choose-type')}
          options={[
            { value: 'self', children: t('new-application:application-type.self') },
            { value: 'other', children: t('new-application:application-type.other') },
          ]}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" to="/new-application/">
            {t('new-application:application-type.back')}
          </ButtonLink>
          <Button id="confirm-button" variant="primary">
            {t('new-application:application-type.continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
