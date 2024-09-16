import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:preferred-language.edit.breadcrumbs.personal-information', routeId: '$lang/_protected/personal-information/index' },
    { labelI18nKey: 'personal-information:preferred-language.edit.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.preferredLanguageEdit,
  pageTitleI18nKey: 'personal-information:preferred-language.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('edit-personal-info');
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const preferredLanguageId = personalInformation.preferredLanguageId;

  const csrfToken = String(session.get('csrfToken'));
  const preferredLanguages = serviceProvider.preferredLanguageService.findAll();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:preferred-language.edit.page-title') }) };

  instrumentationService.countHttpStatus('preferred-language.edit', 200);
  return json({ csrfToken, meta, preferredLanguages, preferredLanguageId });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('edit-personal-info');
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
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  instrumentationService.countHttpStatus('preferred-language.edit', 302);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const personalInformationService = getPersonalInformationService();
  const newPersonalInformation = {
    ...personalInformation,
    preferredLanguageId: parsedDataResult.data.preferredLanguage,
  };
  await personalInformationService.updatePersonalInformation(userInfoToken.sin, newPersonalInformation);

  instrumentationService.countHttpStatus('preferred-language.edit', 302);
  session.set('personal-info-updated', true);
  return redirect(getPathById('$lang/_protected/personal-information/index', params));
}

export default function PreferredLanguageEdit() {
  const fetcher = useFetcher<typeof action>();
  const { csrfToken, preferredLanguageId, preferredLanguages } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
  });

  return (
    <>
      <errorSummary.ErrorSummary />
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
              errorMessage={errors?.preferredLanguage}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" routeId="$lang/_protected/personal-information/index" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Back - Preferred Language click">
            {t('personal-information:preferred-language.edit.back')}
          </ButtonLink>
          <LoadingButton id="change-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Save - Preferred Language click">
            {t('personal-information:preferred-language.edit.save')}
          </LoadingButton>
        </div>
      </fetcher.Form>
    </>
  );
}
