import { useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { TYPES } from '~/.server/constants';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import type { ApplicantInformationState } from '~/route-helpers/apply-route-helpers.server';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.applicantInformation,
  pageTitleI18nKey: 'apply-adult-child:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const maritalStatuses = appContainer.get(TYPES.domain.services.MaritalStatusService).listLocalizedMaritalStatuses(locale);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:applicant-information.page-title') }) };

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  return { id: state.id, maritalStatuses, csrfToken, meta, defaultState: state.applicantInformation, ageCategory, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/applicant-information');

  const state = loadApplyAdultChildState({ params, request, session });
  const applyState = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Cancel) {
    invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');

    if (applicantInformationStateHasPartner(state.applicantInformation) && state.partnerInformation === undefined) {
      const errorMessage = t('apply-adult-child:applicant-information.error-message.marital-status-no-partner-information');
      const flattenedErrors: z.typeToFlattenedError<ApplicantInformationState> = { formErrors: [errorMessage], fieldErrors: { maritalStatus: [errorMessage] } };
      return { errors: transformFlattenedError(flattenedErrors) };
    }

    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  // Form action Continue & Save
  // state validation schema
  const applicantInformationSchema = z.object({
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('apply-adult-child:applicant-information.error-message.sin-required'))
      .superRefine((sin, ctx) => {
        if (!isValidSin(sin)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:applicant-information.error-message.sin-valid') });
        } else if (
          [applyState.partnerInformation?.socialInsuranceNumber, ...applyState.children.map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin))
            .includes(formatSin(sin))
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:children.information.error-message.sin-unique') });
        }
      }),
    firstName: z.string().trim().min(1, t('apply-adult-child:applicant-information.error-message.first-name-required')).max(100).refine(isAllValidInputCharacters, t('apply-adult-child:applicant-information.error-message.characters-valid')),
    lastName: z
      .string()
      .trim()
      .min(1, t('apply-adult-child:applicant-information.error-message.last-name-required'))
      .max(100)
      .refine(isAllValidInputCharacters, t('apply-adult-child:applicant-information.error-message.characters-valid'))
      .refine((lastName) => !hasDigits(lastName), t('apply-adult-child:applicant-information.error-message.no-digits')),
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('apply-adult-child:applicant-information.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('apply-adult-child:applicant-information.error-message.marital-status-required')),
  }) satisfies z.ZodType<ApplicantInformationState>;

  const data = {
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    maritalStatus: formData.get('maritalStatus') ? String(formData.get('maritalStatus')) : undefined,
  };

  const parsedDataResult = applicantInformationSchema.safeParse(data);
  if (!parsedDataResult.success) {
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  const hasPartner = applicantInformationStateHasPartner(parsedDataResult.data);
  const remove = !hasPartner ? 'partnerInformation' : undefined;
  saveApplyState({ params, remove, session, state: { applicantInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  if (hasPartner) {
    return redirect(getPathById('public/apply/$id/adult-child/partner-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/contact-information', params));
}

export default function ApplyFlowApplicationInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { ageCategory, csrfToken, defaultState, maritalStatuses, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    socialInsuranceNumber: 'social-insurance-number',
    maritalStatus: 'input-radio-marital-status-option-0',
  });

  function getBackButtonRouteId() {
    if (ageCategory === 'adults') {
      return 'public/apply/$id/adult-child/disability-tax-credit';
    }

    if (ageCategory === 'youth') {
      return 'public/apply/$id/adult-child/living-independently';
    }

    return 'public/apply/$id/adult-child/date-of-birth';
  }

  const maritalStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return maritalStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.maritalStatus, children: status.name, value: status.id }));
  }, [defaultState?.maritalStatus, maritalStatuses]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={36} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('applicant-information.form-instructions-sin')}</p>
        <p className="mb-6">{t('applicant-information.form-instructions-info')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('applicant-information.single-legal-name')}>
              <p>{t('applicant-information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('applicant-information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('applicant-information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('applicant-information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('applicant-information.name-instructions')}
                required
              />
            </div>
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('applicant-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('apply-adult-child:applicant-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
            <InputRadios id="marital-status" name="maritalStatus" legend={t('applicant-information.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus} required />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Applicant information click">
                {t('apply-adult-child:applicant-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Applicant information click">
                {t('apply-adult-child:applicant-information.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Applicant information click"
              >
                {t('apply-adult-child:applicant-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={getBackButtonRouteId()}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Applicant information click"
              >
                {t('apply-adult-child:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
