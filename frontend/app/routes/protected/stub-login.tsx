import { data, redirectDocument, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/stub-login';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputSelect } from '~/components/input-select';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('stub-login', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'stub-login:index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateFeatureEnabled('stub-login');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('stub-login:index.page-title') }) };

  const idTokenOption = session.find('idToken');
  const userInfoTokenOption = session.find('userInfoToken');

  const defaultValues = {
    sin: userInfoTokenOption.mapOr<string>('', (userInfoToken) => userInfoToken.sin ?? ''),
    sid: idTokenOption.mapOr<string>('00000000-0000-0000-0000-000000000000', (idToken) => idToken.sid),
    sub: idTokenOption.mapOr<string>('00000000-0000-0000-0000-000000000000', (idToken) => idToken.sub),
  };

  return { meta, defaultValues };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateFeatureEnabled('stub-login');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const stubLoginSchema = z.object({
    sin: z.string().trim().min(1, t('stub-login:index.error-message.sin-required')),
    destinationRouteId: z.string().trim().min(1, t('stub-login:index.error-message.destination-required')),
    sid: z.string().trim().min(1, t('stub-login:index.error-message.sid-required')),
    sub: z.string().trim().min(1, t('stub-login:index.error-message.sub-required')),
  });

  const formData = await request.formData();

  const parsedDataResult = stubLoginSchema.safeParse({
    sin: String(formData.get('sin') ?? ''),
    destinationRouteId: String(formData.get('destinationRouteId') ?? ''),
    sid: String(formData.get('sid') ?? ''),
    sub: String(formData.get('sub') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const sin = parsedDataResult.data.sin;
  const sid = parsedDataResult.data.sid;
  const sub = parsedDataResult.data.sub;

  const currentDateInSeconds = Math.floor(UTCDate.now() / 1000);

  const idToken: IdToken = {
    iss: 'GC-ECAS',
    jti: '71b080e9-2524-4572-a085-a53e63a98116',
    nbf: currentDateInSeconds - 30,
    exp: currentDateInSeconds + 300, //five minutes TTL for the token
    iat: currentDateInSeconds,
    aud: 'CDCP',
    sid,
    sub,
    nonce: 'hqwVxGbvJ5g7NSWoOv1BvrA9avVAY7CL',
    locale: 'en-CA',
  };

  const userInfoTokenPayload: UserinfoToken = {
    aud: 'CDCP',
    birthdate: '2000-01-01',
    iss: 'GC-ECAS-MOCK',
    jti: '71b080e9-2524-4572-a085-a53e63a98116',
    nbf: currentDateInSeconds - 30,
    exp: currentDateInSeconds + 300, //five minutes TTL for the token
    iat: currentDateInSeconds,
    locale: 'en-CA',
    sid,
    sin,
    sub,
    mocked: true,
  };

  if (session.has('userInfoToken')) {
    const userInfoToken = session.get('userInfoToken');
    userInfoToken.sin = sin;
    userInfoToken.sub = sub;

    session.set('userInfoToken', userInfoToken);
  } else {
    session.set('userInfoToken', userInfoTokenPayload);
  }

  session.set('idToken', idToken);
  session.unset('clientNumber');

  return redirectDocument(getPathById(parsedDataResult.data.destinationRouteId, params));
}

export default function StubLogin({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultValues } = loaderData;
  const fetcher = useFetcher<typeof action>();

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    sin: 'sin',
    destinationRouteId: 'destination-page',
    sid: 'sid',
    sub: 'sub',
  });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate className="space-y-6">
        <InputField id="sin" name="sin" label={t('stub-login:index.sin')} required inputMode="numeric" defaultValue={defaultValues.sin} />
        <InputSelect
          id="destination-page"
          name="destinationRouteId"
          label={t('stub-login:index.destination')}
          options={[
            {
              children: 'Letters',
              value: 'protected/letters/index',
            },
            {
              children: 'Apply',
              value: 'protected/apply/index',
            },
            {
              children: 'Renew my coverage',
              value: 'protected/renew/index',
            },
          ]}
        />
        <fieldset>
          <legend className="mb-2 text-xl font-semibold">{t('stub-login:index.raoidc')}</legend>
          <div className="space-y-6">
            <InputField id="sid" name="sid" className="w-full" inputMode="text" label={t('stub-login:index.sid')} defaultValue={defaultValues.sid} />
            <InputField id="sub" name="sub" className="w-full" inputMode="text" label={t('stub-login:index.sub')} defaultValue={defaultValues.sub} />
          </div>
        </fieldset>
        <Button variant="primary" id="login-button">
          {t('stub-login:index.login')}
        </Button>
      </fetcher.Form>
    </div>
  );
}
