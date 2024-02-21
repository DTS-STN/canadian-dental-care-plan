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

export default function EnterDoB() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <Form method="post">
        <input name="email" placeholder="Email Address" />
        <div>
          <ButtonLink id="back-button" to="/apply/application-type">
            {t('intake-forms:date-of-birth.button-back')}
          </ButtonLink>
          <Button id="confirm-button" variant="primary">
            {t('intake-forms:date-of-birth.button-continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
