import { useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState, loadRenewAdultSingleChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import type { InputCheckboxesProps } from '~/components/input-checkboxes';
import { InputCheckboxes } from '~/components/input-checkboxes';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'gcweb'),
  pageTitleI18nKey: 'renew-adult-child:children.demographic-survey.page-title',
  pageIdentifier: pageIds.public.renew.adultChild.demographicSurvey,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('demographic-survey');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const state = loadRenewAdultSingleChildState({ params, request, session });

  const childNumber = t('renew-adult-child:children.child-number', { childNumber: state.childNumber });
  const memberName = state.information?.firstName ?? childNumber;

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.demographic-survey.page-title', { memberName }) }) };

  const demographicSurveyService = appContainer.get(TYPES.domain.services.DemographicSurveyService);
  const indigenousStatuses = demographicSurveyService.listLocalizedIndigenousStatuses(locale);
  const firstNations = demographicSurveyService.listLocalizedFirstNations(locale);
  const disabilityStatuses = demographicSurveyService.listLocalizedDisabilityStatuses(locale);
  const ethnicGroups = demographicSurveyService.listLocalizedEthnicGroups(locale);
  const locationBornStatuses = demographicSurveyService.listLocalizedLocationBornStatuses(locale);
  const genderStatuses = demographicSurveyService.listLocalizedGenderStatuses(locale);

  return {
    meta,
    indigenousStatuses,
    firstNations,
    disabilityStatuses,
    ethnicGroups,
    locationBornStatuses,
    genderStatuses,
    defaultState: state.demographicSurvey,
    editMode: state.editMode,
    i18nOptions: { memberName },
    memberName,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewAdultSingleChildState({ params, request, session });
  const renewState = loadRenewAdultChildState({ params, request, session });

  const {
    IS_APPLICANT_FIRST_NATIONS_YES_OPTION,
    ANOTHER_ETHNIC_GROUP_OPTION,
    INDIGENOUS_STATUS_PREFER_NOT_TO_ANSWER,
    DISABILITY_STATUS_PREFER_NOT_TO_ANSWER,
    ETHNIC_GROUP_PREFER_NOT_TO_ANSWER,
    LOCATION_BORN_STATUS_PREFER_NOT_TO_ANSWER,
    GENDER_STATUS_PREFER_NOT_TO_ANSWER,
  } = appContainer.get(TYPES.configs.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);

  const demographicSurveySchema = z
    .object({
      indigenousStatus: z.string().trim().optional(),
      firstNations: z.string().trim().optional(),
      disabilityStatus: z.string().trim().optional(),
      ethnicGroups: z.array(z.string().trim()),
      anotherEthnicGroup: z.string().trim().optional(),
      locationBornStatus: z.string().trim().optional(),
      genderStatus: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.indigenousStatus === IS_APPLICANT_FIRST_NATIONS_YES_OPTION.toString() && !val.firstNations) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:children.demographic-survey.error-message.first-nations-required'), path: ['firstNations'] });
      }

      if (val.ethnicGroups.includes(ANOTHER_ETHNIC_GROUP_OPTION.toString()) && !val.anotherEthnicGroup) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:children.demographic-survey.error-message.another-ethnic-group-required'), path: ['anotherEthnicGroup'] });
      }
    });

  const preferNotToAnswer = z.nativeEnum(FormAction).parse(formData.get('_action')) === FormAction.Save;

  const parsedDataResult = demographicSurveySchema.safeParse({
    indigenousStatus: preferNotToAnswer ? INDIGENOUS_STATUS_PREFER_NOT_TO_ANSWER.toString() : String(formData.get('indigenousStatus') ?? ''),
    firstNations: String(formData.get('firstNations') ?? ''),
    disabilityStatus: preferNotToAnswer ? DISABILITY_STATUS_PREFER_NOT_TO_ANSWER.toString() : String(formData.get('disabilityStatus') ?? ''),
    ethnicGroups: preferNotToAnswer || formData.getAll('ethnicGroups').includes(ETHNIC_GROUP_PREFER_NOT_TO_ANSWER.toString()) ? [ETHNIC_GROUP_PREFER_NOT_TO_ANSWER.toString()] : formData.getAll('ethnicGroups'),
    anotherEthnicGroup: String(formData.get('anotherEthnicGroup') ?? ''),
    locationBornStatus: preferNotToAnswer ? LOCATION_BORN_STATUS_PREFER_NOT_TO_ANSWER.toString() : String(formData.get('locationBornStatus') ?? ''),
    genderStatus: preferNotToAnswer ? GENDER_STATUS_PREFER_NOT_TO_ANSWER.toString() : String(formData.get('genderStatus') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      children: renewState.children.map((child) => {
        if (child.id !== state.id) return child;
        return { ...child, demographicSurvey: parsedDataResult.data };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-child-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/children/index', params));
}

export default function RenewAdultChildChildrenDemographicSurveyQuestions() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { indigenousStatuses, firstNations, disabilityStatuses, ethnicGroups, locationBornStatuses, genderStatuses, defaultState, editMode, memberName } = useLoaderData<typeof loader>();
  const { IS_APPLICANT_FIRST_NATIONS_YES_OPTION, ANOTHER_ETHNIC_GROUP_OPTION } = useClientEnv();
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
      <InputRadios id="first-nations" name="firstNations" legend={t('renew-adult-child:children.demographic-survey.indigenous-status', { memberName })} options={firstNationsOptions} errorMessage={errors?.firstNations} required />
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
      <InputSanitizeField
        id="another-ethnic-group"
        name="anotherEthnicGroup"
        label={t('renew-adult-child:children.demographic-survey.ethnic-groups', { memberName })}
        defaultValue={defaultState?.anotherEthnicGroup ?? ''}
        errorMessage={errors?.anotherEthnicGroup}
        required
      />
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
      <div className="max-w-prose">
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <p>{t('renew-adult-child:children.demographic-survey.improve-cdcp')}</p>
            <p>{t('renew-adult-child:children.demographic-survey.confidential')}</p>
            <p>{t('renew-adult-child:children.demographic-survey.impact-enrollment')}</p>
            <Button name="_action" value={FormAction.Save} variant="alternative" endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application:Prefer not to answer - Demographic survey click">
              {t('renew-adult-child:children.demographic-survey.prefer-not-to-answer-btn')}
            </Button>
            <p className="mb-4 italic">{t('renew-adult-child:children.demographic-survey.optional')}</p>
            <InputRadios id="indigenous-status" name="indigenousStatus" legend={t('renew-adult-child:children.demographic-survey.indigenous-status', { memberName })} options={indigenousStatusOptions} errorMessage={errors?.indigenousStatus} required />
            <InputRadios
              id="disability-status"
              name="disabilityStatus"
              legend={t('renew-adult-child:children.demographic-survey.disability-status', { memberName })}
              options={disabilityStatusOptions}
              errorMessage={errors?.disabilityStatus}
              required
              helpMessagePrimary={t('renew-adult-child:children.demographic-survey.disability-help-message')}
            />
            <InputCheckboxes id="ethnic-groups" name="ethnicGroups" legend={t('renew-adult-child:children.demographic-survey.ethnic-groups', { memberName })} options={ethnicGroupOptions} errorMessage={errors?.ethnicGroups} required />
            <InputRadios
              id="location-born-status"
              name="locationBornStatus"
              legend={t('renew-adult-child:children.demographic-survey.location-born-status', { memberName })}
              options={locationBornStatusOptions}
              errorMessage={errors?.locationBornStatus}
              required
            />
            <InputRadios
              id="gender-status"
              name="genderStatus"
              legend={t('renew-adult-child:children.demographic-survey.gender-status', { memberName })}
              options={genderStatusOptions}
              errorMessage={errors?.genderStatus}
              required
              helpMessagePrimary={t('renew-adult-child:children.demographic-survey.gender-help-message')}
            />
          </div>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button name="_action" value={FormAction.Continue} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Access to other dental insurance click">
                {t('renew-adult-child:children.demographic-survey.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Access to other dental insurance click"
              >
                {t('renew-adult-child:children.demographic-survey.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" name="_action" value={FormAction.Continue} variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Save - Questions click">
                {t('renew-adult-child:children.demographic-survey.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Cancel - Questions click"
              >
                {t('renew-adult-child:children.demographic-survey.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
