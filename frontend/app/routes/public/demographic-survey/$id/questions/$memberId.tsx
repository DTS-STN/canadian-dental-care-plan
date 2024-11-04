import { useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import type { InputCheckboxesProps } from '~/components/input-checkboxes';
import { InputCheckboxes } from '~/components/input-checkboxes';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { AppPageTitle } from '~/components/layouts/public-layout';
import { LoadingButton } from '~/components/loading-button';
import { loadDemographicSurveySingleMemberState, loadDemographicSurveyState, saveDemographicSurveyState } from '~/route-helpers/demographic-survey-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('demographic-survey', 'gcweb'),
  pageIdentifier: pageIds.public.demographicSurvey.questions,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  const csrfToken = String(session.get('csrfToken'));

  const member = loadDemographicSurveySingleMemberState({ params, session });
  const memberName = `${member.firstName} ${member.lastName}`;

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('demographic-survey:questions.page-title', { memberName }) }) };

  const demographicSurveyService = appContainer.get(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_SERVICE);
  const indigenousStatuses = demographicSurveyService.listLocalizedIndigenousStatuses(locale);
  const disabilityStatuses = demographicSurveyService.listLocalizedDisabilityStatuses(locale);
  const ethnicGroups = demographicSurveyService.listLocalizedEthnicGroups(locale);
  const locationBornStatuses = demographicSurveyService.listLocalizedLocationBornStatuses(locale);
  const genderStatuses = demographicSurveyService.listLocalizedGenderStatuses(locale);

  return json({ csrfToken, meta, memberName, indigenousStatuses, disabilityStatuses, ethnicGroups, locationBornStatuses, genderStatuses, defaultState: member.questions });
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('demographic-survey/questions');

  const state = loadDemographicSurveyState({ params, session });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const demographicSurveySchema = z.object({
    indigenousStatus: z.string().trim().optional(),
    disabilityStatus: z.string().trim().optional(),
    ethnicGroups: z.array(z.string().trim()),
    locationBornStatus: z.string().trim().optional(),
    genderStatus: z.string().trim().optional(),
  });

  const data = {
    indigenousStatus: String(formData.get('indigenousStatus') ?? ''),
    disabilityStatus: String(formData.get('disabilityStatus') ?? ''),
    ethnicGroups: formData.getAll('ethnicGroups'),
    locationBornStatus: String(formData.get('locationBornStatus') ?? ''),
    genderStatus: String(formData.get('genderStatus') ?? ''),
  };

  const parsedDataResult = demographicSurveySchema.safeParse(data);
  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  saveDemographicSurveyState({
    params,
    session,
    state: {
      memberInformation: state.memberInformation.map((member) => {
        if (member.id !== params.memberId) return member;
        return { ...member, isSurveyCompleted: true, questions: { ...member.questions, ...parsedDataResult.data } };
      }),
    },
  });

  return redirect(getPathById('public/demographic-survey/$id/summary', params));
}

export default function DemographicSurveyQuestions() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, memberName, indigenousStatuses, disabilityStatuses, ethnicGroups, locationBornStatuses, genderStatuses, defaultState } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const params = useParams();

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    indigenousStatus: 'indigenous-status',
    disabilityStatus: 'disability-status',
    ethnicGroups: 'ethnic-groups',
    locationBornStatus: 'location-born-status',
    genderStatus: 'genderStatus',
  });

  const indigenousStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return indigenousStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.indigenousStatus, children: status.name, value: status.id }));
  }, [defaultState?.indigenousStatus, indigenousStatuses]);

  const disabilityStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return disabilityStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.disabilityStatus, children: status.name, value: status.id }));
  }, [defaultState?.disabilityStatus, disabilityStatuses]);

  const ethnicGroupOptions = useMemo<InputCheckboxesProps['options']>(() => {
    return ethnicGroups.map((status) => ({ defaultChecked: defaultState?.ethnicGroups?.includes(status.id), children: status.name, value: status.id }));
  }, [defaultState?.ethnicGroups, ethnicGroups]);

  const locationBornStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return locationBornStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.locationBornStatus, children: status.name, value: status.id }));
  }, [defaultState?.locationBornStatus, locationBornStatuses]);

  const genderStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return genderStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.genderStatus, children: status.name, value: status.id }));
  }, [defaultState?.genderStatus, genderStatuses]);

  return (
    <>
      <AppPageTitle>{t('demographic-survey:questions.page-title', { memberName })}</AppPageTitle>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('demographic-survey:questions.optional')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <InputRadios id="indigenous-status" name="indigenousStatus" legend={t('demographic-survey:questions.indigenous-status')} options={indigenousStatusOptions} errorMessage={errors?.indigenousStatus} required />
            <InputRadios id="disability-status" name="disabilityStatus" legend={t('demographic-survey:questions.disability-status')} options={disabilityStatusOptions} errorMessage={errors?.disabilityStatus} required />
            <InputCheckboxes id="ethnic-groups" name="ethnicGroups" legend={t('demographic-survey:questions.ethnic-groups')} options={ethnicGroupOptions} errorMessage={errors?.ethnicGroups} required />
            <InputRadios id="location-born-status" name="locationBornStatus" legend={t('demographic-survey:questions.location-born-status')} options={locationBornStatusOptions} errorMessage={errors?.locationBornStatus} required />
            <InputRadios id="gender-status" name="genderStatus" legend={t('demographic-survey:questions.gender-status')} options={genderStatusOptions} errorMessage={errors?.genderStatus} required />
          </div>

          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Save - Questions click">
              {t('demographic-survey:questions.save-btn')}
            </LoadingButton>
            <ButtonLink id="back-button" routeId="public/demographic-survey/$id/summary" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Cancel - Questions click">
              {t('demographic-survey:questions.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
