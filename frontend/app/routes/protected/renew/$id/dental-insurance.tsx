import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { isInvitationToApplyClient, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  continue: 'continue',
  save: 'save',
  back: 'back',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageTitleI18nKey: 'protected-renew:dental-insurance.title',
  pageIdentifier: pageIds.protected.renew.dentalInsurance,
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const memberName = `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}`;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-renew:dental-insurance.title', { memberName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-renew:dental-insurance.title', { memberName: t('protected-renew:dental-insurance.member') }) }),
  };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.renew.dental-insurance', { userId: idToken.sub });

  return { id: state, meta, defaultState: state.dentalInsurance, editMode: state.editMode, i18nOptions: { memberName } };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    if (isInvitationToApplyClient(state.clientApplication)) {
      invariant(state.communicationPreferences, 'Expected state.communicationPreferences to be defined');
      if (state.communicationPreferences.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email || state.communicationPreferences.preferredNotificationMethod !== PREFERRED_NOTIFICATION_METHOD.mail) {
        return redirect(getPathById('protected/renew/$id/confirm-email', params));
      }
      return redirect(getPathById('protected/renew/$id/communication-preference', params));
    }
    return redirect(getPathById('protected/renew/$id/member-selection', params));
  }

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('protected-renew:dental-insurance.error-message.dental-insurance-required') }) }),
  });

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({
    params,
    request,
    session,
    state: {
      dentalInsurance: parsedDataResult.data.dentalInsurance,
      previouslyReviewed: state.editMode === false && (isInvitationToApplyClient(state.clientApplication) || demographicSurveyEnabled) ? undefined : true,
    },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.renew.dental-insurance', { userId: idToken.sub });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  if (isInvitationToApplyClient(state.clientApplication)) {
    return redirect(getPathById('protected/renew/$id/confirm-federal-provincial-territorial-benefits', params));
  }

  if (demographicSurveyEnabled) {
    return redirect(getPathById('protected/renew/$id/demographic-survey', params));
  }

  return redirect(getPathById('protected/renew/$id/member-selection', params));
}

export default function ProtectedRenewAdultChildAccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { dentalInsurance: 'input-radio-dental-insurance-option-0' });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <Collapsible summary={t('dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-4 pl-7">
            <li>{t('dental-insurance.detail.additional-info.eligible-list.employment-benefits')}</li>
            <li>
              {t('dental-insurance.detail.additional-info.eligible-list.organization.professional-student')}
              <p className="pl-4">{t('dental-insurance.detail.additional-info.eligible-list.organization.note')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.not-take')}</li>
                <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.pay-premium')}</li>
                <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.not-use')}</li>
              </ul>
            </li>
            <li>
              {t('dental-insurance.detail.additional-info.eligible-list.pension.pension-benefits')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.federal-provincial-territorial')}</li>
                <li>
                  {t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.eligible')}
                  <ul className="list-disc space-y-1 pl-7">
                    <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opted-out')}</li>
                    <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opt-back')}</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              {t('dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-through')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-privately')}</li>
              </ul>
            </li>
          </ul>
        </div>
      </Collapsible>
    </div>
  );

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="my-6">
          <InputRadios
            id="dental-insurance"
            name="dentalInsurance"
            legend={t('dental-insurance.legend')}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-insurance.option-yes" />,
                value: 'yes',
                defaultChecked: defaultState === true,
              },
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-insurance.option-no" />,
                value: 'no',
                defaultChecked: defaultState === false,
              },
            ]}
            helpMessagePrimary={helpMessage}
            helpMessagePrimaryClassName="text-black"
            errorMessage={errors?.dentalInsurance}
            required
          />
        </div>
        {editMode ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button name="_action" value={FORM_ACTION.save} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Access to private dental insurance click">
              {t('dental-insurance.button.save-btn')}
            </Button>
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/review-adult-information"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Access to private dental insurance click"
            >
              {t('dental-insurance.button.cancel-btn')}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              id="continue-button"
              name="_action"
              value={FORM_ACTION.continue}
              variant="primary"
              loading={isSubmitting}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Access to private dental insurance click"
            >
              {t('dental-insurance.button.continue')}
            </LoadingButton>
            <LoadingButton name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Access to private dental insurance click">
              {t('dental-insurance.button.back')}
            </LoadingButton>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}
