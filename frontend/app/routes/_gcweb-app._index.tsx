import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { type Namespace } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { getFixedT } from '~/utils/locale-utils.server';

const i18nNamespaces: Namespace = ['common'];

const userSchema = z.object({ firstName: z.string(), lastName: z.string() });
type User = z.infer<typeof userSchema>;

async function getUser() {
  const response = await fetch('https://api.example.com/user/00000000-0000-0000-0000-00000000000');
  return userSchema.parse(await response.json()) as User;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, i18nNamespaces);

  // TODO :: GjB :: figure out a cleaner way to type this
  return json<LoaderFunctionData & { user: User }>({
    breadcrumbs: [{ label: t('common:index.breadcrumbs.home') }],
    i18nNamespaces: i18nNamespaces,
    pageIdentifier: 'CDCP-0001',
    pageTitle: t('common:index.page-title'),
    user: await getUser(),
  });
}

export default function () {
  const { t } = useTranslation(i18nNamespaces);
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:index.page-title')}
      </h1>
      <p>
        Welcome {user.firstName} {user.lastName}
      </p>
      <ul>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/not-found">404 not found page</Link>
        </li>
        <li>
          <Link to="/error">500 internal server error page</Link>
        </li>
      </ul>
    </>
  );
}
