import { useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputField } from '~/components/input-field';
import { InputLegend } from '~/components/input-legend';
import { InputRadio } from '~/components/input-radio';
import { InputRadios } from '~/components/input-radios';
import { getLookupService } from '~/services/lookup-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getClientEnv } from '~/utils/env-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('communication-preference');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'communication-preference:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const { COMMUNICATION_METHOD_DIGITAL_ID } = getClientEnv();
  const preferredLanguages = await getLookupService().getAllPreferredLanguages();
  const preferredCommunicationMethods = await getLookupService().getAllPreferredCommunicationMethods();

  return json({ COMMUNICATION_METHOD_DIGITAL_ID, preferredLanguages, preferredCommunicationMethods });
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    preferredLanguage: z.enum(['en', 'fr']),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);
  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  session.set('newPreferredLanguage', parsedDataResult.data.preferredLanguage);

  return redirect('/personal-information/preferred-language/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function CommunicationPreferencePage() {
  const { COMMUNICATION_METHOD_DIGITAL_ID, preferredLanguages, preferredCommunicationMethods } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [isDigitalMethodChecked, setDigitalMethodChecked] = useState(false);
  const digitalMethod = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_DIGITAL_ID);

  console.log(COMMUNICATION_METHOD_DIGITAL_ID);
  if (!digitalMethod) {
    throw new Error('Unexpected digital communication method');
  }
  const nonDigitalMethods = preferredCommunicationMethods.filter((method) => method.id != COMMUNICATION_METHOD_DIGITAL_ID);

  const digitalMethodHandler = () => {
    setDigitalMethodChecked(true);
  };

  const nonDigitalMethodHandler = () => {
    setDigitalMethodChecked(false);
  };

  return (
    <>
      <p>{t('communication-preference:note')}</p>
      <Form method="post" noValidate>
        <div className="my-6">
          {preferredCommunicationMethods.length > 0 && (
            <fieldset id="input-radios=preferred-method" className="mb-6" data-testid="input-radios-preferred-method">
              <InputLegend id="input-radios=preferred-method-legend" className="mb-2" required>
                {t('communication-preference:preferred-method')}
              </InputLegend>
              <ul className="space-y-2">
                <li>
                  <InputRadio id="preferred-method-0" name="preferredMethod" value={preferredCommunicationMethods[0].id} onClick={digitalMethodHandler}>
                    {preferredCommunicationMethods.find((method) => method.id === 'digital')?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                  </InputRadio>
                  {isDigitalMethodChecked && (
                    <div className="my-4 ml-10 grid gap-6 md:grid-cols-4">
                      <InputField id="email" className="w-full" label={t('communication-preference:email')} name="email" />
                      <InputField id="confirmEmail" className="w-full" label={t('communication-preference:confirm-email')} name="confirm-email" />
                    </div>
                  )}
                </li>
                {nonDigitalMethods.map((method) => (
                  <li key={method.id}>
                    <InputRadio key={method.id} id="preferred-method-1" name="preferredMethod" value={method.id} onClick={nonDigitalMethodHandler}>
                      {getNameByLanguage(i18n.language, method)}
                    </InputRadio>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </div>
        <div className="my-6">
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('communication-preference:preferred-language')}
              options={preferredLanguages.map((language) => ({
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/intake">
            {t('communication-preference:back')}
          </ButtonLink>
          <Button id="continue-button" variant="primary">
            {t('communication-preference:continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
