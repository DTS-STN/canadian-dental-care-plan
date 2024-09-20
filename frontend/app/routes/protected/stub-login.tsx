import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputPatternField } from '~/components/input-pattern-field';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { sinInputPatternFormat } from '~/utils/sin-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('stub-login', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'stub-login:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  featureEnabled('stub-login');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('stub-login:index.page-title') }) };

  const idToken: IdToken | undefined = session.get('idToken');
  const userInfoToken: UserinfoToken | undefined = session.get('userInfoToken');

  const defaultValues = {
    sin: userInfoToken?.sin ?? '',
    sid: idToken?.sid ?? '00000000-0000-0000-0000-000000000000',
    sub: idToken?.sub ?? '00000000-0000-0000-0000-000000000000',
  };

  return { meta, defaultValues };
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('stub-login');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const stubLoginSchema = z.object({
    sin: z.string().trim().min(1, t('stub-login:index.error-message.sin-required')),
    sid: z.string().trim().min(1, t('stub-login:index.error-message.sid-required')),
    sub: z.string().trim().min(1, t('stub-login:index.error-message.sub-required')),
  });

  const formData = await request.formData();

  const data = {
    sin: String(formData.get('sin') ?? ''),
    sid: String(formData.get('sid') ?? ''),
    sub: String(formData.get('sub') ?? ''),
  };

  const parsedDataResult = stubLoginSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  const sin = parsedDataResult.data.sin;
  const sid = parsedDataResult.data.sid;
  const sub = parsedDataResult.data.sub;

  const currentDateInSeconds = Math.floor(UTCDate.now() / 1000);

  const idToken = {
    iss: 'GC-ECAS',
    jti: '71b080e9-2524-4572-a085-a53e63a98116',
    nbf: currentDateInSeconds - 30,
    exp: currentDateInSeconds + 300, //five minutes TTL for the token
    iat: currentDateInSeconds,
    aud: 'CDCP',
    sub,
    nonce: 'hqwVxGbvJ5g7NSWoOv1BvrA9avVAY7CL',
    locale: 'en-CA',
  };

  const userinfoTokenPayload = {
    aud: 'CDCP',
    birthdate: '2000-01-01',
    iss: 'GC-ECAS-MOCK',
    locale: 'en-CA',
    sid,
    sin,
    sub,
    mocked: true,
  };
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  if (!session.has('userInfoToken')) {
    session.set('userInfoToken', userinfoTokenPayload);
  } else {
    userInfoToken.sin = sin;
    userInfoToken.sub = sub;
    session.set('userInfoToken', userInfoToken);
  }
  session.set('idToken', idToken);

  const subscriptionService = getSubscriptionService();
  const user = await subscriptionService.getUserByRaoidcUserId(session.get('userInfoToken').sub);
  session.set('userId', user?.id);

  return redirect(getPathById('protected/home', params));
}

export default function StubLogin() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultValues } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    sin: 'sin',
    sid: 'sid',
    sub: 'sub',
  });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate className="space-y-6">
        <InputPatternField id="sin" name="sin" label={t('stub-login:index.sin')} required inputMode="numeric" format={sinInputPatternFormat} defaultValue={defaultValues.sin} />
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
