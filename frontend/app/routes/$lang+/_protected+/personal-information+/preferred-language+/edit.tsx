import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:preferred-language.edit.breadcrumbs.personal-information', routeId: '$lang+/_protected+/personal-information+/index' },
    { labelI18nKey: 'personal-information:preferred-language.edit.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.preferredLanguageEdit,
  pageTitleI18nKey: 'personal-information:preferred-language.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('edit-personal-info');
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const preferredLanguageId = personalInformation.preferredLanguageId;

  const csrfToken = String(session.get('csrfToken'));
  const preferredLanguages = await lookupService.getAllPreferredLanguages();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:preferred-language.edit.page-title') }) };

  instrumentationService.countHttpStatus('preferred-language.edit', 200);
  return json({ csrfToken, meta, preferredLanguages, preferredLanguageId });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('preferred-language/edit');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('personal-information:preferred-language.edit.error-message.preferred-language-required')),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
  };

  const parsedDataResult = formDataSchema.safeParse(data);
  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('preferred-language.edit', 400);
    return json({ errors: parsedDataResult.error.format() });
  }

  instrumentationService.countHttpStatus('preferred-language.edit', 302);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const personalInformationServie = getPersonalInformationService();
  const newPersonalInformation = {
    ...personalInformation,
    preferredLanguageId: parsedDataResult.data.preferredLanguage,
  };
  await personalInformationServie.updatePersonalInformation(userInfoToken.sin ?? '', newPersonalInformation);

  instrumentationService.countHttpStatus('preferred-language.edit', 302);
  session.set('personal-info-updated', true);
  return redirect(getPathById('$lang+/_protected+/personal-information+/index', params));
}

export default function PreferredLanguageEdit() {
  const fetcher = useFetcher<typeof action>();
  const { csrfToken, preferredLanguageId, preferredLanguages } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-preferred-language-option-0': fetcher.data?.errors.preferredLanguage?._errors[0],
    }),
    [fetcher.data?.errors.preferredLanguage?._errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('personal-information:preferred-language.edit.preferred-language-legend')}
              options={preferredLanguages.map((language) => ({
                defaultChecked: preferredLanguageId === language.id,
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              errorMessage={errorMessages['input-radio-preferred-language-option-0']}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" routeId="$lang+/_protected+/personal-information+/index" params={params}>
            {t('personal-information:preferred-language.edit.back')}
          </ButtonLink>
          <Button id="change-button" variant="primary">
            {t('personal-information:preferred-language.edit.save')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
