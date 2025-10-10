import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/applicant-information';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.applicantInformation,
  pageTitleI18nKey: 'protected-profile:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:applicant-information.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const primaryApplicant = {
    firstName: clientApplication.applicantInformation.firstName,
    lastName: clientApplication.applicantInformation.lastName,
    id: clientApplication.applicantInformation.clientNumber,
    dob: clientApplication.dateOfBirth.toString(),
    sin: clientApplication.applicantInformation.socialInsuranceNumber,
  };

  const children = clientApplication.children.map((child) => ({
    firstName: child.information.firstName,
    lastName: child.information.lastName,
    id: child.information.clientNumber,
    dob: child.information.dateOfBirth.toString(),
    sin: child.information.socialInsuranceNumber,
  }));

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.applicant-information', { userId: idToken.sub });

  return {
    meta,
    SCCH_BASE_URI,
    primaryApplicant,
    children,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {}

export default function ProtectedApplicantInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { primaryApplicant, children, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose space-y-10">
      <p>
        <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:applicant-information.form-instructions" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
      </p>
      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{`${primaryApplicant.firstName} ${primaryApplicant.lastName}`}</h2>
        <dl className="divide-y border-y">
          <DescriptionListItem term={t('protected-profile:applicant-information.member-id')}>
            <p>{primaryApplicant.id}</p>
          </DescriptionListItem>
          <DescriptionListItem term={t('protected-profile:applicant-information.dob')}>
            <p>{primaryApplicant.dob}</p>
          </DescriptionListItem>
          <DescriptionListItem term={t('protected-profile:applicant-information.sin')}>
            <p>{primaryApplicant.sin}</p>
          </DescriptionListItem>
        </dl>
      </section>

      {children.map((child) => {
        return (
          <section className="space-y-6" key={child.id}>
            <h2 className="font-lato text-2xl font-bold">{`${child.firstName} ${child.lastName}`}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-profile:applicant-information.member-id')}>
                <p>{child.id}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-profile:applicant-information.dob')}>
                <p>{child.dob}</p>
              </DescriptionListItem>
              <DescriptionListItem term={t('protected-profile:applicant-information.sin')}>
                <p>{child.sin}</p>
              </DescriptionListItem>
            </dl>
          </section>
        );
      })}

      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - Applicant information return button click"
      >
        {t('protected-profile:applicant-information.return-button')}
      </ButtonLink>
    </div>
  );
}
