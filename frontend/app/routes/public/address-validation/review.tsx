import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { PublicLayout } from '~/components/layouts/public-layout';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('address-validation', 'gcweb'),
  pageTitleI18nKey: 'address-validation:review.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('address-validation');

  const locale = getLocale(request);
  const mailingAddressValidator = appContainer.get(TYPES.routes.public.addressValidation.MailingAddressValidatorFactory).create(locale);
  const validationResult = await mailingAddressValidator.validateMailingAddress(session.get('route.address-validation'));

  if (!validationResult.success) {
    session.unset('route.address-validation');
    return redirect('public/address-validation/index');
  }

  const validatedMailingAddress = validationResult.data;
  const formattedMailingAddress = {
    address: validatedMailingAddress.address,
    city: validatedMailingAddress.city,
    country: appContainer.get(TYPES.domain.services.CountryService).getLocalizedCountryById(validatedMailingAddress.countryId, locale).name,
    postalZipCode: validatedMailingAddress.postalZipCode,
    provinceState: validatedMailingAddress.provinceStateId && appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).getLocalizedProvinceTerritoryStateById(validatedMailingAddress.provinceStateId, locale).abbr,
  };

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('address-validation:review.page-title') }) };

  return {
    meta,
    mailingAddress: formattedMailingAddress,
  };
}

export default function AddressValidationReviewRoute() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { mailingAddress } = useLoaderData<typeof loader>();
  const params = useParams();

  return (
    <PublicLayout>
      <div className="mb-6 max-w-prose space-y-4">
        <h2 className="font-lato text-2xl font-bold">{t('address-validation:review.address-header')}</h2>
        <p>{t('address-validation:review.address-sub-header')}</p>
        <hr className="h-px border-0 bg-gray-200" />
        <Address address={mailingAddress} />
        <hr className="h-px border-0 bg-gray-200" />
      </div>
      <ButtonLink startIcon={faEdit} id="edit-button-link" routeId="public/address-validation/index" params={params}>
        {t('address-validation:review.edit-button')}
      </ButtonLink>
    </PublicLayout>
  );
}
