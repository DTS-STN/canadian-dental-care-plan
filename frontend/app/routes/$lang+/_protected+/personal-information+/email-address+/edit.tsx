import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';
import validator from 'validator';
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

  if (!emailAddress) {
    instrumentationService.countHttpStatus('email-address.edit', 404);
    throw new Response(null, { status: 404 });
  }
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

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z
    .object({
      emailAddress: z.string(),
      confirmEmailAddress: z.string(),
    })
    .superRefine((val, ctx) => {
      if (typeof val.emailAddress !== 'string' || validator.isEmpty(val.emailAddress)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'empty-email-address', path: ['emailAddress'] });
      } else if (!validator.isEmail(val.emailAddress)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid-email-format', path: ['emailAddress'] });
      }

      if (typeof val.confirmEmailAddress !== 'string' || validator.isEmpty(val.confirmEmailAddress)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'empty-email-address', path: ['confirmEmailAddress'] });
      } else if (!validator.isEmail(val.confirmEmailAddress)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid-email-format', path: ['confirmEmailAddress'] });
      } else if (val.emailAddress !== val.confirmEmailAddress) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'email-match', path: ['confirmEmail'] });
      }
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
    instrumentationService.countHttpStatus('email-address.confirm', 400);
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  session.set('newEmailAddress', parsedDataResult.data.emailAddress);

  instrumentationService.countHttpStatus('email-address.confirm', 302);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformationService = getPersonalInformationService();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  const newPersonalInformation = {
    ...personalInformation,
    emailAddress: session.get('newEmailAddress'),
  };
  await personalInformationService.updatePersonalInformation(userInfoToken.sin ?? '', newPersonalInformation);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.email-address', { userId: idToken.sub });

  session.unset('newEmailAddress');

  instrumentationService.countHttpStatus('email-address.confirm', 302);
  return redirectWithSuccess(getPathById('$lang+/_protected+/personal-information+/index', params), 'personal-information:email-address.edit.updated-notification');
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

  /**
   * Gets an error message based on the provided internationalization (i18n) key.
   *
   * @param errorI18nKey - The i18n key for the error message.
   * @returns The corresponding error message, or undefined if no key is provided.
   */
  function getErrorMessage(errorI18nKey?: string): string | undefined {
    console.log('getErrorMessage called:');
    console.log(errorI18nKey);
    if (!errorI18nKey) return undefined;

    /**
     * The 'as any' is employed to circumvent typechecking, as the type of
     * 'errorI18nKey' is a string, and the string literal cannot undergo validation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`personal-information:email-address.edit.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    emailAddress: getErrorMessage(fetcher.data?.errors.emailAddress?._errors[0]),
    confirmEmailAddress: getErrorMessage(fetcher.data?.errors.confirmEmailAddress?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  console.log('Errors:');
  console.log(errorMessages);
  console.log(errorSummaryItems);
  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:email-address.edit.subtitle')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
          <InputField id="emailAddress" name="emailAddress" type="tel" label={t('personal-information:email-address.edit.component.email')} required defaultValue={defaultValues.emailAddress} errorMessage={errorMessages.emailAddress} />
        </div>
        <div className="my-6">
          <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
          <InputField id="confirmEmailAddress" name="confirmEmailAddress" type="tel" label={t('personal-information:email-address.edit.component.confirm-email')} required defaultValue={defaultValues.emailAddress} />
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
