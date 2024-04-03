import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:preferred-language.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.edit.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.preferredLanguageEdit,
  pageTitleI18nKey: 'personal-information:preferred-language.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    instrumentationService.countHttpStatus('preferred-language.edit', 404);
    throw new Response(null, { status: 404 });
  }

  const csrfToken = String(session.get('csrfToken'));
  const preferredLanguages = await lookupService.getAllPreferredLanguages();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:preferred-language.edit.page-title') }) };

  instrumentationService.countHttpStatus('preferred-language.edit', 200);
  return json({ csrfToken, meta, preferredLanguages, userInfo });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const log = getLogger('preferred-language/edit');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    preferredLanguage: z.string().trim().min(1),
  });

  const formData = Object.fromEntries(await request.formData());
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData['_csrf']);

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('preferred-language.edit', 400);
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  session.set('newPreferredLanguage', parsedDataResult.data.preferredLanguage);

  instrumentationService.countHttpStatus('preferred-language.edit', 302);
  return redirectWithLocale(request, '/personal-information/preferred-language/confirm');
}

export default function PreferredLanguageEdit() {
  const { csrfToken, userInfo, preferredLanguages } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:preferred-language.edit.subtitle')}</p>
      <Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('personal-information:preferred-language.edit.page-title')}
              options={preferredLanguages.map((language) => ({
                defaultChecked: userInfo.preferredLanguage === language.id,
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="change-button" variant="primary">
            {t('personal-information:preferred-language.edit.change')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information">
            {t('personal-information:preferred-language.edit.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
