import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:email-address.edit.breadcrumbs.personal-information', routeId: '$lang+/_protected+/personal-information+/index' },
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
  return json({ csrfToken, meta, emailAddress });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
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
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
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
  return redirect(getPathById('$lang+/_protected+/personal-information+/index', params));
}

export default function EmailAddressEdit() {
  const { csrfToken, emailAddress } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const errorSummaryId = 'error-summary';

  const { t } = useTranslation(handle.i18nNamespaces);

  const defaultValues = {
    emailAddress: fetcher.data?.formData.emailAddress ?? emailAddress,
    confirmEmailAddress: fetcher.data?.formData.confirmEmailAddress ?? emailAddress,
  };

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      emailAddress: fetcher.data?.errors.emailAddress?._errors[0],
      confirmEmailAddress: fetcher.data?.errors.confirmEmailAddress?._errors[0],
    }),
    [fetcher.data?.errors.confirmEmailAddress?._errors, fetcher.data?.errors.emailAddress?._errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <InputField id="emailAddress" name="emailAddress" type="tel" label={t('personal-information:email-address.edit.component.email')} required defaultValue={defaultValues.emailAddress} errorMessage={errorMessages.emailAddress} />
        </div>
        <div className="my-6">
          <InputField
            id="confirmEmailAddress"
            name="confirmEmailAddress"
            type="tel"
            label={t('personal-information:email-address.edit.component.confirm-email')}
            required
            defaultValue={defaultValues.emailAddress}
            errorMessage={errorMessages.confirmEmailAddress}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="submit" variant="primary">
            {t('personal-information:email-address.edit.button.save')}
          </Button>
          <ButtonLink id="cancel" routeId="$lang+/_protected+/personal-information+/index" params={params}>
            {t('personal-information:email-address.edit.button.cancel')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </>
  );
}
