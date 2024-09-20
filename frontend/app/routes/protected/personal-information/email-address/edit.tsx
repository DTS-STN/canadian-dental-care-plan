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
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:email-address.edit.breadcrumbs.personal-information', routeId: 'protected/personal-information/index' },
    { labelI18nKey: 'personal-information:email-address.edit.breadcrumbs.change-email-address' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.emailAddressEdit,
  pageTitleI18nKey: 'personal-information:email-address.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('edit-personal-info');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const emailAddress = personalInformation.emailAddress;

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:email-address.edit.page-title') }) };

  instrumentationService.countHttpStatus('email-address.edit', 200);
  return json({ csrfToken, meta, defaultValues: { emailAddress } });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('edit-personal-info');

  const log = getLogger('email-address/edit');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z
    .object({
      emailAddress: z.string().trim().min(1, t('email-address.edit.error-message.empty-email-address')).email(t('email-address.edit.error-message.invalid-email-format')),
      confirmEmailAddress: z.string().trim().min(1, t('email-address.edit.error-message.empty-email-address')).email(t('email-address.edit.error-message.invalid-email-format')),
    })
    .superRefine((val, ctx) => {
      if (val.emailAddress !== val.confirmEmailAddress) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('email-address.edit.error-message.email-match'), path: ['confirmEmailAddress'] });
      }
    });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    confirmEmailAddress: String(formData.get('confirmEmailAddress')),
    emailAddress: String(formData.get('emailAddress')),
  };
  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('email-address.edit', 400);
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  instrumentationService.countHttpStatus('email-address.edit', 302);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformationService = getPersonalInformationService();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  const newPersonalInformation = {
    ...personalInformation,
    emailAddress: parsedDataResult.data.emailAddress,
  };
  await personalInformationService.updatePersonalInformation(userInfoToken.sin, newPersonalInformation);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.email-address', { userId: idToken.sub });

  instrumentationService.countHttpStatus('email-address.edit', 302);

  session.set('personal-info-updated', true);
  return redirect(getPathById('protected/personal-information/index', params));
}

export default function EmailAddressEdit() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultValues } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    emailAddress: 'emailAddress',
    confirmEmailAddress: 'confirmEmailAddress',
  });

  return (
    <>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <InputField id="emailAddress" name="emailAddress" type="tel" label={t('personal-information:email-address.edit.component.email')} required defaultValue={defaultValues.emailAddress} errorMessage={errors?.emailAddress} />
        </div>
        <div className="my-6">
          <InputField
            id="confirmEmailAddress"
            name="confirmEmailAddress"
            type="tel"
            label={t('personal-information:email-address.edit.component.confirm-email')}
            required
            defaultValue={defaultValues.emailAddress}
            errorMessage={errors?.confirmEmailAddress}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LoadingButton id="submit" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Save - Email address click">
            {t('personal-information:email-address.edit.button.save')}
          </LoadingButton>
          <ButtonLink id="cancel" routeId="protected/personal-information/index" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Cancel - Email address click">
            {t('personal-information:email-address.edit.button.cancel')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </>
  );
}
