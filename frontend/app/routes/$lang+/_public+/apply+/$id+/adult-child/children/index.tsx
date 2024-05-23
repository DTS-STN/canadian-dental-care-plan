import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { getChildrenState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum FormAction {
  Add = 'add',
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
  Remove = 'remove',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.childInformation,
  pageTitleI18nKey: 'apply-adult-child:children.index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const i18n = getLocale(request);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.index.page-title') }) };

  const lookupService = getLookupService();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();
  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();

  const children = getChildrenState(state, false).map((child) => {
    const federalSocialProgramEntity = federalSocialPrograms.find((p) => p.id === child.dentalBenefits?.federalSocialProgram);
    const federalSocialProgram = federalSocialProgramEntity ? getNameByLanguage(i18n, federalSocialProgramEntity) : federalSocialProgramEntity;

    const provincialTerritorialSocialProgramEntity = provincialTerritorialSocialPrograms.filter((p) => p.provinceTerritoryStateId === child.dentalBenefits?.province).find((p) => p.id === child.dentalBenefits?.provincialTerritorialSocialProgram);
    const provincialTerritorialSocialProgram = provincialTerritorialSocialProgramEntity ? getNameByLanguage(i18n, provincialTerritorialSocialProgramEntity) : provincialTerritorialSocialProgramEntity;

    return {
      ...child,
      dentalBenefits: {
        ...child.dentalBenefits,
        federalSocialProgram,
        provincialTerritorialSocialProgram,
      },
    };
  });

  return json({ id: state.id, csrfToken, meta, children });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });

  const log = getLogger('apply/adult-child/child-summary');

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
    const children = [...getChildrenState(state, false), { id: childId }];
    saveApplyState({ params, session, state: { children } });
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/information', { ...params, childId }));
  }

  if (formAction === FormAction.Remove) {
    const removeChildId = formData.get('childId');
    const children = [...getChildrenState(state, false)].filter((child) => child.id !== removeChildId);
    saveApplyState({ params, session, state: { children } });
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/index', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/review-adult-information', params));
}

export default function ApplyFlowChildSummary() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, children } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const hasChildren = children.length > 0;

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={40} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-adult-child:children.index.you-have-completed')}</p>
        <p className="mb-6">{t('apply-adult-child:children.index.in-this-section')}</p>
        {children.map((child) => {
          const childName = `${child.information?.firstName} ${child.information?.lastName}`;
          return (
            <div key={child.id}>
              <h2 className="text-2xl font-semibold">{`${child.information?.firstName} ${child.information?.lastName}`}</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="alternative" size="xs" className="my-2">
                    {t('apply-adult-child:children.index.modal.remove-btn')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('apply-adult-child:children.index.modal.header', { childName })}</DialogTitle>
                  </DialogHeader>
                  <p>{t('apply-adult-child:children.index.modal.info', { childName })}</p>
                  <DialogFooter>
                    <DialogClose>
                      <Button id="confirm-modal-back" variant="default" size="sm">
                        {t('apply-adult-child:children.index.modal.back-btn')}
                      </Button>
                    </DialogClose>
                    <fetcher.Form method="post" noValidate>
                      <input type="hidden" name="_csrf" value={csrfToken} />
                      <input type="hidden" name="childId" value={child.id} />
                      <Button id="remove-child" name="_action" value={FormAction.Remove} variant="primary" className="my-2">
                        {t('apply-adult-child:children.index.modal.remove-btn')}
                      </Button>
                    </fetcher.Form>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <dl className="mb-6 divide-y border-y">
                <DescriptionListItem term={t('apply-adult-child:children.index.dob-title')}>
                  <p>{child.information?.dateOfBirth}</p>
                  <p className="mt-4">
                    <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult-child/children/$childId/information" params={{ ...params, childId: child.id }}>
                      {t('apply-adult-child:children.index.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:children.index.sin-title')}>
                  <p>{child.information?.socialInsuranceNumber}</p>
                  <p className="mt-4">
                    <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/adult-child/children/$childId/information" params={{ ...params, childId: child.id }}>
                      {t('apply-adult-child:children.index.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:children.index.dental-insurance-title')}>
                  {child.dentalInsurance ? t('apply-adult-child:children.index.yes') : t('apply-adult-child:children.index.no')}
                  <p className="mt-4">
                    <InlineLink id="change-access-dental" routeId="$lang+/_public+/apply+/$id+/adult-child/children/$childId/dental-insurance" params={{ ...params, childId: child.id }}>
                      {t('apply-adult-child:children.index.dental-insurance-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:children.index.dental-benefit-title')}>
                  {!!child.dentalBenefits.hasFederalBenefits || !!child.dentalBenefits.hasProvincialTerritorialBenefits ? (
                    <>
                      <p>{t('apply-adult-child:children.index.yes')}</p>
                      <p>{t('apply-adult-child:children.index.dental-benefit-has-access')}</p>
                      <div>
                        <ul className="ml-6 list-disc">
                          {child.dentalBenefits.hasFederalBenefits && <li>{child.dentalBenefits.federalSocialProgram}</li>}
                          {child.dentalBenefits.hasProvincialTerritorialBenefits && <li>{child.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>{t('apply-adult-child:children.index.no')}</>
                  )}
                  <p className="mt-4">
                    <InlineLink id="change-dental-benefits" routeId="$lang+/_public+/apply+/$id+/adult-child/children/$childId/federal-provincial-territorial-benefits" params={{ ...params, childId: child.id }}>
                      {t('apply-adult-child:children.index.dental-benefit-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              </dl>
            </div>
          );
        })}

        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <Button className="mb-10" id="add-child" name="_action" value={FormAction.Add} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click">
            <FontAwesomeIcon icon={faPlus} className="me-3 block size-4" />
            {t('apply-adult-child:children.index.add-child')}
          </Button>

          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button id="continue-button" name="_action" value={FormAction.Continue} variant="primary" disabled={!hasChildren || isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Applicant Information click">
              {t('apply-adult-child:children.index.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink
              id="back-button"
              routeId="$lang+/_public+/apply+/$id+/adult-child/federal-provincial-territorial-benefits"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply-adult-child:children.index.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
