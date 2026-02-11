import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/eligibility-requirements';

import { isTaxFilingSectionCompleted, isTermsAndConditionsSectionCompleted } from '~/.server/routes/helpers/protected-application-entry-section-checks';
import { getProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.eligibilityRequirements,
  pageTitleI18nKey: 'protected-application:eligibility-requirements.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getProtectedApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application:eligibility-requirements.page-title') }) };
  return {
    state: {
      termsAndConditions: state.termsAndConditions,
      hasFiledTaxes: state.hasFiledTaxes,
    },
    sections: {
      termsAndConditions: { completed: isTermsAndConditionsSectionCompleted(state) },
      taxFiling: { completed: isTaxFilingSectionCompleted(state) },
    },
    meta,
  };
}

export default function ProtectedApplicationEligibilityRequirements({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('protected-application:required-label')}</p>
        <p>{completedSectionsLabel}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('protected-application:eligibility-requirements.terms-conditions-section.title')}</CardTitle>
          <CardAction>{sections.termsAndConditions.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.termsAndConditions === undefined ? (
            <p>{t('protected-application:eligibility-requirements.terms-conditions-section.instructions')}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-7">
              {state.termsAndConditions.acknowledgeTerms && <li>{t('protected-application:eligibility-requirements.terms-conditions-section.acknowledge-terms')}</li>}
              {state.termsAndConditions.acknowledgePrivacy && <li>{t('protected-application:eligibility-requirements.terms-conditions-section.acknowledge-privacy')}</li>}
              {state.termsAndConditions.shareData && <li>{t('protected-application:eligibility-requirements.terms-conditions-section.share-data')}</li>}
            </ul>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-terms-conditions-button" variant="link" className="p-0" routeId="protected/application/$id/terms-conditions" params={params} startIcon={sections.termsAndConditions.completed ? faPenToSquare : faCircleCheck} size="lg">
            {sections.termsAndConditions.completed //
              ? t('protected-application:eligibility-requirements.terms-conditions-section.edit-button')
              : t('protected-application:eligibility-requirements.terms-conditions-section.add-button')}
          </ButtonLink>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('protected-application:eligibility-requirements.tax-filing-section.title')}</CardTitle>
          <CardAction>{sections.taxFiling.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          <p>{state.hasFiledTaxes === true ? t('protected-application:eligibility-requirements.tax-filing-section.have-filed-taxes') : t('protected-application:eligibility-requirements.tax-filing-section.instructions')}</p>
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-tax-filing-button" variant="link" className="p-0" routeId="protected/application/$id/tax-filing" params={params} startIcon={sections.taxFiling.completed ? faPenToSquare : faCircleCheck} size="lg">
            {sections.taxFiling.completed ? t('protected-application:eligibility-requirements.tax-filing-section.edit-button') : t('protected-application:eligibility-requirements.tax-filing-section.add-button')}
          </ButtonLink>
        </CardFooter>
      </Card>
      {/* TODO update next route */}
      <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="protected/application/$id/eligibility-requirements" params={params}>
        {t('protected-application:eligibility-requirements.next-button')}
      </NavigationButtonLink>
    </div>
  );
}
