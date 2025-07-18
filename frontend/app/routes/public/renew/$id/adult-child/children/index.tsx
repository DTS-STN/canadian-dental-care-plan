import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight, faEdit, faPlus, faRemove } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'node:crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { getChildrenState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
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

const FORM_ACTION = {
  add: 'add',
  continue: 'continue',
  remove: 'remove',
  back: 'back',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.childInformation,
  pageTitleI18nKey: 'renew-adult-child:children.index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.index.page-title') }) };

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const children = await Promise.all(
    getChildrenState(state).map(async (child) => {
      const federalGovernmentInsurancePlan = child.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale) : undefined;

      const provincialTerritorialSocialProgram = child.dentalBenefits?.provincialTerritorialSocialProgram
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
        : undefined;
      return {
        ...child,
        dentalBenefits: {
          ...child.dentalBenefits,
          federalSocialProgram: federalGovernmentInsurancePlan?.name,
          provincialTerritorialSocialProgram: provincialTerritorialSocialProgram?.name,
        },
      };
    }),
  );

  return { meta, children, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultChildState({ params, request, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.back) {
    if (demographicSurveyEnabled) {
      return redirect(getPathById('public/renew/$id/adult-child/demographic-survey', params));
    }
    if (state.hasFederalProvincialTerritorialBenefitsChanged) {
      return redirect(getPathById('public/renew/$id/adult-child/update-federal-provincial-territorial-benefits', params));
    }
    return redirect(getPathById('public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  if (formAction === FORM_ACTION.add) {
    const childId = randomUUID();
    const children = [...getChildrenState(state), { id: childId }];
    saveRenewState({ params, session, state: { children } });
    return redirect(getPathById('public/renew/$id/adult-child/children/$childId/information', { ...params, childId }));
  }

  if (formAction === FORM_ACTION.remove) {
    const removeChildId = formData.get('childId');
    const children = [...getChildrenState(state)].filter((child) => child.id !== removeChildId);
    saveRenewState({ params, session, state: { children } });
    return redirect(getPathById('public/renew/$id/adult-child/children/index', params));
  }

  saveRenewState({
    params,
    session,
    state: {
      editMode: true, // last step in the flow
    },
  });

  return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
}

export default function RenewFlowChildSummary({ loaderData, params }: Route.ComponentProps) {
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
        <Progress value={81} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('renew-adult-child:children.index.you-have-completed')}</p>
        <p className="mb-4">{t('renew-adult-child:children.index.in-this-section')}</p>
        <p>{t('renew-adult-child:children.index.each-child')}</p>
        {children.length > 0 && (
          <div className="mt-6 space-y-8">
            {children.map((child) => {
              const childName = `${child.information?.firstName} ${child.information?.lastName}`;
              const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';
              return (
                <section key={child.id}>
                  <h2 className="font-lato mb-4 text-2xl font-bold">{childName}</h2>
                  <dl className="mb-6 divide-y border-y">
                    <DescriptionListItem term={t('renew-adult-child:children.index.dob-title')}>
                      <p>{dateOfBirth}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('renew-adult-child:children.index.client-number-title')}>
                      <p>{child.information?.clientNumber}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('renew-adult-child:children.index.dental-insurance-title')}>{child.dentalInsurance ? t('renew-adult-child:children.index.yes') : t('renew-adult-child:children.index.no')}</DescriptionListItem>
                    <DescriptionListItem term={t('renew-adult-child:children.index.dental-benefit-title')}>
                      {!!child.dentalBenefits.hasFederalBenefits || !!child.dentalBenefits.hasProvincialTerritorialBenefits ? (
                        <>
                          <p>{t('renew-adult-child:children.index.yes')}</p>
                          <p>{t('renew-adult-child:children.index.dental-benefit-has-access')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalBenefits.hasFederalBenefits && <li>{child.dentalBenefits.federalSocialProgram}</li>}
                              {child.dentalBenefits.hasProvincialTerritorialBenefits && <li>{child.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>{t('renew-adult-child:children.index.no')}</>
                      )}
                    </DescriptionListItem>
                  </dl>
                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink
                      id="edit-child"
                      aria-label={t('renew-adult-child:children.index.edit-child-aria', { childName })}
                      disabled={isSubmitting}
                      size="sm"
                      variant="alternative"
                      routeId="public/renew/$id/adult-child/children/$childId/dental-insurance"
                      params={{ ...params, childId: child.id }}
                      startIcon={faEdit}
                      data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Edit child's information - Child(ren) renewal click"
                    >
                      {t('renew-adult-child:children.index.edit-child')}
                    </ButtonLink>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button aria-expanded={undefined} id="remove-child" aria-label={t('renew-adult-child:children.index.remove-child-aria', { childName })} disabled={isSubmitting} size="sm" variant="alternative" startIcon={faRemove}>
                          {t('renew-adult-child:children.index.modal.remove-btn')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('renew-adult-child:children.index.modal.header', { childName })}</DialogTitle>
                        </DialogHeader>
                        <p>{t('renew-adult-child:children.index.modal.info', { childName })}</p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button id="confirm-modal-back" disabled={isSubmitting} variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Return to summary page - Child(ren) renewal click">
                              {t('renew-adult-child:children.index.modal.back-btn')}
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
                              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Remove child - Child(ren) renewal click"
                              onClick={() => setSrMessage(t('renew-adult-child:children.index.removed-child', { childName }))}
                            >
                              {t('renew-adult-child:children.index.modal.remove-btn')}
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
          <Button className="my-10" id="add-child" name="_action" value={FORM_ACTION.add} disabled={isSubmitting} startIcon={faPlus} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Renew child - Child(ren) renewal click">
            {children.length === 0 ? t('renew-adult-child:children.index.add-child') : t('renew-adult-child:children.index.add-another-child')}
          </Button>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                id="save-button"
                routeId="public/renew/$id/adult-child/review-child-information"
                params={params}
                disabled={!hasChildren || isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Save - Child(ren) renewal click"
                variant="primary"
              >
                {t('children.index.save-btn')}
              </ButtonLink>
              <ButtonLink
                id="cancel-button"
                routeId="public/renew/$id/adult-child/review-child-information"
                params={params}
                disabled={!hasChildren || isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Cancel - Child(ren) renewal click"
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
                loading={isSubmitting && submitAction === FORM_ACTION.continue}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Continue - Child(ren) renewal click"
              >
                {t('renew-adult-child:children.index.continue-btn')}
              </LoadingButton>
              <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Back - Child(ren) renewal click">
                {t('renew-adult-child:children.index.back-btn')}
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
