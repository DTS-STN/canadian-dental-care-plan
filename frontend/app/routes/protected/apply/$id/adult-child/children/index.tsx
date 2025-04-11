import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight, faEdit, faPlus, faRemove } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { getChildrenState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const FORM_ACTION = {
  add: 'add',
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
  remove: 'remove',
  back: 'back',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.childSummary,
  pageTitleI18nKey: 'protected-apply-adult-child:children.index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:children.index.page-title') }) };

  const children = getChildrenState(state).map((child) => {
    const federalGovernmentInsurancePlan =
      child.hasFederalProvincialTerritorialBenefits && child.dentalBenefits?.federalSocialProgram
        ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale)
        : undefined;

    const provincialTerritorialSocialProgram =
      child.hasFederalProvincialTerritorialBenefits && child.dentalBenefits?.provincialTerritorialSocialProgram
        ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
        : undefined;

    const idToken: IdToken = session.get('idToken');
    appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.adult-child.children.index', { userId: idToken.sub });

    instrumentationService.countHttpStatus('protected.apply.adult-child.children', 200);

    return {
      ...child,
      dentalBenefits: {
        ...child.dentalBenefits,
        federalSocialProgram: federalGovernmentInsurancePlan?.name,
        provincialTerritorialSocialProgram: provincialTerritorialSocialProgram?.name,
      },
    };
  });

  return { meta, children, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });
  const state = loadProtectedApplyAdultChildState({ params, request, session });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  instrumentationService.countHttpStatus('protected.apply.adult-child.children', 302);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.adult-child.children.index', { userId: idToken.sub });

  if (formAction === FORM_ACTION.add) {
    const childId = randomUUID();
    const children = [...getChildrenState(state), { id: childId }];
    saveProtectedApplyState({ params, session, state: { children } });
    return redirect(getPathById('protected/apply/$id/adult-child/children/$childId/information', { ...params, childId }));
  }

  if (formAction === FORM_ACTION.remove) {
    const removeChildId = formData.get('childId');
    const children = [...getChildrenState(state)].filter((child) => child.id !== removeChildId);
    saveProtectedApplyState({ params, session, state: { children } });
    return redirect(getPathById('protected/apply/$id/adult-child/children/index', params));
  }

  if (formAction === FORM_ACTION.back) {
    saveProtectedApplyState({ params, session, state: { editMode: false } });
    if (state.hasFederalProvincialTerritorialBenefits) {
      return redirect(getPathById('protected/apply/$id/adult-child/federal-provincial-territorial-benefits', params));
    }
    return redirect(getPathById('protected/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  saveProtectedApplyState({
    params,
    session,
    state: {
      editMode: true, // last step in the flow
    },
  });

  return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
}

export default function ApplyFlowChildSummary({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { children, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const hasChildren = children.length > 0;
  const [submitAction, setSubmitAction] = useState<string>();
  const [srMessage, setSrMessage] = useState<string>('');

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    setSubmitAction(submitter.value);

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={84} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="my-4">{t('protected-apply-adult-child:children.index.almost-completed')}</p>
        <p className="my-4">{t('protected-apply-adult-child:children.index.in-this-section')}</p>
        <p className="my-4">{t('protected-apply-adult-child:children.index.can-apply')}</p>
        <ul className="my-4 list-disc space-y-1 pl-7">
          <li>{t('protected-apply-adult-child:children.index.parent-guardian')}</li>
          <li>{t('protected-apply-adult-child:children.index.over-sixteen')}</li>
          <li>{t('protected-apply-adult-child:children.index.under-eighteen')}</li>
        </ul>
        <Collapsible className="my-4" id="name-instructions" summary={t('protected-apply-adult-child:children.index.share-custody')}>
          <p>{t('protected-apply-adult-child:children.index.one-application')}</p>
          <p className="my-4">{t('protected-apply-adult-child:children.index.eligibility')}</p>
        </Collapsible>
        {children.length > 0 && (
          <div className="mt-6 space-y-8">
            {children.map((child) => {
              const childName = `${child.information?.firstName} ${child.information?.lastName}`;
              const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';
              return (
                <section key={child.id}>
                  <h2 className="font-lato mb-4 text-2xl font-bold">{childName}</h2>
                  <dl className="mb-6 divide-y border-y">
                    <DescriptionListItem term={t('protected-apply-adult-child:children.index.dob-title')}>
                      <p>{dateOfBirth}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:children.index.sin-title')}>
                      <p>{child.information?.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:children.index.dental-insurance-title')}>
                      {child.dentalInsurance ? t('protected-apply-adult-child:children.index.yes') : t('protected-apply-adult-child:children.index.no')}
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:children.index.dental-benefit-title')}>
                      {!!child.dentalBenefits.hasFederalBenefits || !!child.dentalBenefits.hasProvincialTerritorialBenefits ? (
                        <>
                          <p>{t('protected-apply-adult-child:children.index.yes')}</p>
                          <p>{t('protected-apply-adult-child:children.index.dental-benefit-has-access')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalBenefits.hasFederalBenefits && <li>{child.dentalBenefits.federalSocialProgram}</li>}
                              {child.dentalBenefits.hasProvincialTerritorialBenefits && <li>{child.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>{t('protected-apply-adult-child:children.index.no')}</>
                      )}
                    </DescriptionListItem>
                  </dl>
                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink
                      id="edit-child"
                      disabled={isSubmitting}
                      size="sm"
                      variant="alternative"
                      routeId="protected/apply/$id/adult-child/children/$childId/information"
                      params={{ ...params, childId: child.id }}
                      startIcon={faEdit}
                      data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Edit child - Child(ren) application click"
                    >
                      {t('protected-apply-adult-child:children.index.edit-child')}
                    </ButtonLink>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button aria-expanded={undefined} id="remove-child" disabled={isSubmitting} size="sm" variant="alternative" startIcon={faRemove}>
                          {t('protected-apply-adult-child:children.index.modal.remove-btn')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('protected-apply-adult-child:children.index.modal.header', { childName })}</DialogTitle>
                        </DialogHeader>
                        <p>{t('protected-apply-adult-child:children.index.modal.info', { childName })}</p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button id="confirm-modal-back" disabled={isSubmitting} variant="default" size="sm">
                              {t('protected-apply-adult-child:children.index.modal.back-btn')}
                            </Button>
                          </DialogClose>
                          <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
                            <CsrfTokenInput />
                            <input type="hidden" name="childId" value={child.id} />
                            <Button
                              id="remove-child"
                              name="_action"
                              value={FORM_ACTION.remove}
                              disabled={isSubmitting}
                              variant="primary"
                              size="sm"
                              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Remove child - Child(ren) application click"
                              onClick={() => setSrMessage(t('protected-apply-adult-child:children.index.removed-child', { childName }))}
                            >
                              {t('protected-apply-adult-child:children.index.modal.remove-btn')}
                            </Button>
                          </fetcher.Form>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
          <CsrfTokenInput />
          <Button
            className="my-10"
            id="add-child"
            name="_action"
            value={FORM_ACTION.add}
            disabled={isSubmitting}
            startIcon={faPlus}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Add child - Child(ren) application click"
          >
            {children.length === 0 ? t('protected-apply-adult-child:children.index.add-child') : t('protected-apply-adult-child:children.index.add-another-child')}
          </Button>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                id="save-button"
                routeId="protected/apply/$id/adult-child/review-child-information"
                params={params}
                disabled={!hasChildren || isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Save - Child(ren) application click"
                variant="primary"
              >
                {t('children.index.save-btn')}
              </ButtonLink>
              <ButtonLink
                id="cancel-button"
                routeId="protected/apply/$id/adult-child/review-child-information"
                params={params}
                disabled={!hasChildren || isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Cancel - Child(ren) application click"
              >
                {t('children.index.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FORM_ACTION.continue}
                variant="primary"
                disabled={!hasChildren || isSubmitting}
                loading={isSubmitting && submitAction === FORM_ACTION.continue}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Continue - Child(ren) application click"
              >
                {t('protected-apply-adult-child:children.index.continue-btn')}
              </LoadingButton>
              <Button
                id="back-button"
                name="_action"
                value={FORM_ACTION.back}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Child(ren) application click"
              >
                {t('protected-apply-adult-child:children.index.back-btn')}
              </Button>
            </div>
          )}
        </fetcher.Form>
        <span aria-atomic="true" aria-live="polite" className="sr-only">
          {srMessage}
        </span>
      </div>
    </>
  );
}
