import { useTranslation } from 'react-i18next';

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

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:applicant-information.page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const primaryApplicant = {
    firstName: 'John', // This should be replaced with primary applicant data
    lastName: 'Doe',
    id: '123456789', 
    dob: '1990-01-01', 
    sin: '123-456-789',
  }

  const children = [
    {
      information: {
        firstName: 'Jane', // This should be replaced with child data
        lastName: 'Doe',
        id: '987654321',
        dob: '2015-05-05',
        sin: '987-654-321',
      },
    },
  ];

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
    <div className="max-w-prose">
      <p className="mb-4">{t('protected-profile:applicant-information.form-instructions')}</p>
      <dl className="divide-y border-y">
        <h2 className="font-lato text-2xl font-bold">{`${primaryApplicant.firstName} ${primaryApplicant.lastName}`}</h2>
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
      {children.map((child) => {
        return (
          <dl className="divide-y border-y" key={child.information?.id}>
            <h2 className="font-lato text-2xl font-bold">{`${child.information?.firstName} ${child.information?.lastName}`}</h2>
            <DescriptionListItem term={t('protected-profile:applicant-information.member-id')}>
              <p>{child.information?.id}</p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-profile:applicant-information.dob')}>
              <p>{child.information?.dob}</p>
            </DescriptionListItem>
            <DescriptionListItem term={t('protected-profile:applicant-information.sin')}>
              <p>{child.information?.sin}</p>
            </DescriptionListItem>
          </dl>
        );
      })}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Information:Return to dashboard - You have not applied for CDCP click">
          {t('data-protected-profile:applicant-information.return-button')}
        </ButtonLink>
      </div>
    </div>
  );
}
