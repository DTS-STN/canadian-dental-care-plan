import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faEdit, faPlus, faRemove } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { getChildrenState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeFederalSocialProgram, localizeProvincialGovernmentInsurancePlan } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

enum FormAction {
  Add = 'add',
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
  Remove = 'remove',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.childInformation,
  pageTitleI18nKey: 'apply-child:children.index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:children.index.page-title') }) };

  const children = getChildrenState(state).map((child) => {
    const federalGovernmentInsurancePlanService = child.dentalBenefits?.federalSocialProgram ? serviceProvider.getFederalGovernmentInsurancePlanService().findById(child.dentalBenefits.federalSocialProgram) : undefined;
    const provincialTerritorialSocialProgram = child.dentalBenefits?.provincialTerritorialSocialProgram
      ? serviceProvider.getProvincialGovernmentInsurancePlanService().getProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram)
      : undefined;

    return {
      ...child,
      dentalBenefits: {
        ...child.dentalBenefits,
        federalSocialProgram: federalGovernmentInsurancePlanService && localizeFederalSocialProgram(federalGovernmentInsurancePlanService, locale).name,
        provincialTerritorialSocialProgram: provincialTerritorialSocialProgram && localizeProvincialGovernmentInsurancePlan(provincialTerritorialSocialProgram, locale).name,
      },
    };
  });

  return json({ csrfToken, meta, children, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });

  const log = getLogger('apply/child/child-summary');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Add) {
    const childId = randomUUID();
    const children = [...getChildrenState(state), { id: childId }];
    saveApplyState({ params, session, state: { children } });
    return redirect(getPathById('public/apply/$id/child/children/$childId/information', { ...params, childId }));
  }

  if (formAction === FormAction.Remove) {
    const removeChildId = formData.get('childId');
    const children = [...getChildrenState(state)].filter((child) => child.id !== removeChildId);
    saveApplyState({ params, session, state: { children } });
    return redirect(getPathById('public/apply/$id/child/children/index', params));
  }

  return redirect(getPathById('public/apply/$id/child/applicant-information', params));
}

export default function ApplyFlowChildSummary() {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, children, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const hasChildren = children.length > 0;

  const [submitAction, setSubmitAction] = useState<string>();

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    setSubmitAction(submitter.value);

    fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={37} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p>{t('apply-child:children.index.in-this-section')}</p>
        {children.length > 0 && (
          <div className="mt-6 space-y-8">
            {children.map((child) => {
              const childName = `${child.information?.firstName} ${child.information?.lastName}`;
              const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), i18n.language) : '';
              return (
                <section key={child.id}>
                  <h2 className="mb-4 font-lato text-2xl font-bold">{childName}</h2>
                  <dl className="mb-6 divide-y border-y">
                    <DescriptionListItem term={t('apply-child:children.index.dob-title')}>
                      <p>{dateOfBirth}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:children.index.sin-title')}>
                      <p>{child.information?.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:children.index.dental-insurance-title')}>{child.dentalInsurance ? t('apply-child:children.index.yes') : t('apply-child:children.index.no')}</DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:children.index.dental-benefit-title')}>
                      {!!child.dentalBenefits.hasFederalBenefits || !!child.dentalBenefits.hasProvincialTerritorialBenefits ? (
                        <>
                          <p>{t('apply-child:children.index.yes')}</p>
                          <p>{t('apply-child:children.index.dental-benefit-has-access')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalBenefits.hasFederalBenefits && <li>{child.dentalBenefits.federalSocialProgram}</li>}
                              {child.dentalBenefits.hasProvincialTerritorialBenefits && <li>{child.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>{t('apply-child:children.index.no')}</>
                      )}
                    </DescriptionListItem>
                  </dl>
                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink
                      id="edit-child"
                      disabled={isSubmitting}
                      size="sm"
                      variant="alternative"
                      routeId="public/apply/$id/child/children/$childId/information"
                      params={{ ...params, childId: child.id }}
                      startIcon={faEdit}
                      data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Edit child - Child(ren) application click"
                    >
                      {t('apply-child:children.index.edit-child')}
                    </ButtonLink>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button id="remove-child" disabled={isSubmitting} size="sm" variant="alternative" startIcon={faRemove}>
                          {t('apply-child:children.index.remove-btn')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('apply-child:children.index.modal.header', { childName })}</DialogTitle>
                        </DialogHeader>
                        <p>{t('apply-child:children.index.modal.info', { childName })}</p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button id="confirm-modal-back" disabled={isSubmitting} variant="default" size="sm">
                              {t('apply-child:children.index.modal.back-btn')}
                            </Button>
                          </DialogClose>
                          <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
                            <input type="hidden" name="_csrf" value={csrfToken} />
                            <input type="hidden" name="childId" value={child.id} />
                            <Button
                              id="remove-child"
                              name="_action"
                              value={FormAction.Remove}
                              disabled={isSubmitting}
                              variant="primary"
                              size="sm"
                              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Remove child - Child(ren) application click"
                            >
                              {t('apply-child:children.index.modal.remove-btn')}
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
          <input type="hidden" name="_csrf" value={csrfToken} />
          <Button className="my-10" id="add-child" name="_action" value={FormAction.Add} disabled={isSubmitting} startIcon={faPlus} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Add child - Child(ren) application click">
            {children.length === 0 ? t('apply-child:children.index.add-child') : t('apply-child:children.index.add-another-child')}
          </Button>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                id="save-button"
                routeId="public/apply/$id/child/review-child-information"
                params={params}
                disabled={!hasChildren || isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Child(ren) application click"
                variant="primary"
              >
                {t('children.index.save-btn')}
              </ButtonLink>
              <ButtonLink
                id="cancel-button"
                routeId="public/apply/$id/child/review-child-information"
                params={params}
                disabled={!hasChildren || isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Child(ren) application click"
              >
                {t('children.index.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                disabled={!hasChildren || isSubmitting}
                loading={isSubmitting && submitAction === FormAction.Continue}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Child(ren) application click"
              >
                {t('apply-child:children.index.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/tax-filing"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child(ren) application click"
              >
                {t('apply-child:children.index.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
