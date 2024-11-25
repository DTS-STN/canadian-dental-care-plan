import { useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewSingleChildState, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import type { InputCheckboxesProps } from '~/components/input-checkboxes';
import { InputCheckboxes } from '~/components/input-checkboxes';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { AppPageTitle } from '~/components/layouts/protected-layout';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Continue = 'continue',
  Save = 'save',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.demographicSurvey,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const csrfToken = String(session.get('csrfToken'));

  const { IS_APPLICANT_FIRST_NATIONS_YES_OPTION, ANOTHER_ETHNIC_GROUP_OPTION } = appContainer.get(TYPES.configs.ServerConfig);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const state = loadProtectedRenewSingleChildState({ params, session });

  const childNumber = t('protected-renew:children.child-number', { childNumber: state.childNumber });
  const memberName = state.firstName ?? childNumber;

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:demographic-survey.page-title', { memberName }) }) };

  const demographicSurveyService = appContainer.get(TYPES.domain.services.DemographicSurveyService);
  const indigenousStatuses = demographicSurveyService.listLocalizedIndigenousStatuses(locale);
  const firstNations = demographicSurveyService.listLocalizedFirstNations(locale);
  const disabilityStatuses = demographicSurveyService.listLocalizedDisabilityStatuses(locale);
  const ethnicGroups = demographicSurveyService.listLocalizedEthnicGroups(locale);
  const locationBornStatuses = demographicSurveyService.listLocalizedLocationBornStatuses(locale);
  const genderStatuses = demographicSurveyService.listLocalizedGenderStatuses(locale);

  return {
    csrfToken,
    meta,
    memberName,
    indigenousStatuses,
    firstNations,
    disabilityStatuses,
    ethnicGroups,
    locationBornStatuses,
    genderStatuses,
    defaultState: state.demographicSurvey,
    editMode: state.editMode,
    IS_APPLICANT_FIRST_NATIONS_YES_OPTION,
    ANOTHER_ETHNIC_GROUP_OPTION,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('protected/renew/children/demographic-survey');

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewSingleChildState({ params, session });
  const protectedRenewState = loadProtectedRenewState({ params, session });

  const { IS_APPLICANT_FIRST_NATIONS_YES_OPTION, ANOTHER_ETHNIC_GROUP_OPTION } = appContainer.get(TYPES.configs.ServerConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw data('Invalid CSRF token', { status: 400 });
  }

  const demographicSurveySchema = z
    .object({
      indigenousStatus: z.string().trim().optional(),
      firstNations: z.array(z.string().trim()),
      disabilityStatus: z.string().trim().optional(),
      ethnicGroups: z.array(z.string().trim()),
      anotherEthnicGroup: z.string().trim().optional(),
      locationBornStatus: z.string().trim().optional(),
      genderStatus: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.indigenousStatus === IS_APPLICANT_FIRST_NATIONS_YES_OPTION.toString() && !val.firstNations.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:demographic-survey.error-message.first-nations-required'), path: ['firstNations'] });
      }

      if (val.ethnicGroups.includes(ANOTHER_ETHNIC_GROUP_OPTION.toString()) && !val.anotherEthnicGroup) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:demographic-survey.error-message.another-ethnic-group-required'), path: ['anotherEthnicGroup'] });
      }
    });

  const parsedDataResult = demographicSurveySchema.safeParse({
    indigenousStatus: String(formData.get('indigenousStatus') ?? ''),
    firstNations: formData.getAll('firstNations'),
    disabilityStatus: String(formData.get('disabilityStatus') ?? ''),
    ethnicGroups: formData.getAll('ethnicGroups'),
    anotherEthnicGroup: String(formData.get('anotherEthnicGroup') ?? ''),
    locationBornStatus: String(formData.get('locationBornStatus') ?? ''),
    genderStatus: String(formData.get('genderStatus') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    session,
    state: {
      children: protectedRenewState.children.map((child) => {
        if (child.id !== state.id) return child;
        return { ...child, isSurveyCompleted: true, demographicSurvey: parsedDataResult.data };
      }),
    },
  });

  return redirect(getPathById('protected/renew/$id/review-child-information', params));
}

export default function ProtectedChildrenDemographicSurveyQuestions() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, memberName, indigenousStatuses, firstNations, disabilityStatuses, ethnicGroups, locationBornStatuses, genderStatuses, defaultState, editMode, IS_APPLICANT_FIRST_NATIONS_YES_OPTION, ANOTHER_ETHNIC_GROUP_OPTION } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const params = useParams();

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    indigenousStatus: 'input-radio-indigenous-status-option-0-label',
    firstNations: 'input-checkbox-first-nations-option-0-label',
    disabilityStatus: 'input-radio-disability-status-option-0-label',
    ethnicGroups: 'input-checkboxes-ethnic-groups',
    anotherEthnicGroup: 'another-ethnic-group',
    locationBornStatus: 'input-radio-location-born-status-option-0-label',
    genderStatus: 'input-radio-gender-status-option-0-label',
  });

  const [isIndigenousStatusValue, setIsIndigenousStatusValue] = useState(defaultState?.indigenousStatus === IS_APPLICANT_FIRST_NATIONS_YES_OPTION.toString());
  const [isAnotherEthnicGroupValue, setIsAnotherEthnicGroupValue] = useState(defaultState?.ethnicGroups?.includes(ANOTHER_ETHNIC_GROUP_OPTION.toString()));

  function handleOnIsIndigenousStatusChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setIsIndigenousStatusValue(e.target.value === IS_APPLICANT_FIRST_NATIONS_YES_OPTION.toString());
  }

  function handleOnIsAnotherEthnicGroupChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setIsAnotherEthnicGroupValue(e.target.value === ANOTHER_ETHNIC_GROUP_OPTION.toString());
  }

  const firstNationsOptions = useMemo<InputCheckboxesProps['options']>(() => {
    return firstNations.map((status) => ({ defaultChecked: defaultState?.firstNations?.includes(status.id), children: status.name, value: status.id }));
  }, [defaultState?.firstNations, firstNations]);

  const indigenousStatusOptions = indigenousStatuses.map((status) => ({
    defaultChecked: status.id === defaultState?.indigenousStatus,
    children: status.name,
    value: status.id,
    onChange: handleOnIsIndigenousStatusChanged,
    append: status.id === IS_APPLICANT_FIRST_NATIONS_YES_OPTION.toString() && isIndigenousStatusValue && (
      <InputCheckboxes id="first-nations" name="firstNations" legend={t('protected-renew:demographic-survey.indigenous-status')} options={firstNationsOptions} errorMessage={errors?.firstNations} required />
    ),
  }));

  const disabilityStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return disabilityStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.disabilityStatus, children: status.name, value: status.id }));
  }, [defaultState?.disabilityStatus, disabilityStatuses]);

  const ethnicGroupOptions = ethnicGroups.map((status) => ({
    defaultChecked: defaultState?.ethnicGroups?.includes(status.id),
    children: status.name,
    value: status.id,
    onChange: status.id === ANOTHER_ETHNIC_GROUP_OPTION.toString() ? handleOnIsAnotherEthnicGroupChanged : undefined,
    append: status.id === ANOTHER_ETHNIC_GROUP_OPTION.toString() && isAnotherEthnicGroupValue && (
      <InputSanitizeField id="another-ethnic-group" name="anotherEthnicGroup" label={t('protected-renew:demographic-survey.ethnic-groups')} defaultValue={defaultState?.anotherEthnicGroup ?? ''} errorMessage={errors?.anotherEthnicGroup} required />
    ),
  }));

  const locationBornStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return locationBornStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.locationBornStatus, children: status.name, value: status.id }));
  }, [defaultState?.locationBornStatus, locationBornStatuses]);

  const genderStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return genderStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.genderStatus, children: status.name, value: status.id }));
  }, [defaultState?.genderStatus, genderStatuses]);

  return (
    <>
      <AppPageTitle>{t('protected-renew:demographic-survey.page-title', { memberName })}</AppPageTitle>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('protected-renew:demographic-survey.optional')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <InputRadios id="indigenous-status" name="indigenousStatus" legend={t('protected-renew:demographic-survey.indigenous-status')} options={indigenousStatusOptions} errorMessage={errors?.indigenousStatus} required />
            <InputRadios id="disability-status" name="disabilityStatus" legend={t('protected-renew:demographic-survey.disability-status')} options={disabilityStatusOptions} errorMessage={errors?.disabilityStatus} required />
            <InputCheckboxes id="ethnic-groups" name="ethnicGroups" legend={t('protected-renew:demographic-survey.ethnic-groups')} options={ethnicGroupOptions} errorMessage={errors?.ethnicGroups} required />
            <InputRadios id="location-born-status" name="locationBornStatus" legend={t('protected-renew:demographic-survey.location-born-status')} options={locationBornStatusOptions} errorMessage={errors?.locationBornStatus} required />
            <InputRadios id="gender-status" name="genderStatus" legend={t('protected-renew:demographic-survey.gender-status')} options={genderStatusOptions} errorMessage={errors?.genderStatus} required />
          </div>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button name="_action" value={FormAction.Save} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Access to other dental insurance click">
                {t('protected-renew:demographic-survey.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Access to other dental insurance click"
              >
                {t('protected-renew:demographic-survey.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Save - Questions click">
                {t('protected-renew:demographic-survey.continue-btn')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="protected/renew/$id/$childId/dental-insurance" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Cancel - Questions click">
                {t('protected-renew:demographic-survey.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
