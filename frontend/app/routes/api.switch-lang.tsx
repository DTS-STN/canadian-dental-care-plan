import { ActionFunction, json } from '@remix-run/node';
import { getLocale } from '~/utils/locale-utils.server';
import { serialize, type CookieSerializeOptions } from 'cookie';

const cookieName = '_gc_lang';
const cookieOptions: CookieSerializeOptions = {
  path: '/', // TODO :: GjB :: make configurable
  maxAge: 50000000000000000,
};

export const action: ActionFunction = async ({ request }) => {
  const locale = await getLocale(request);
  const newLocale = !locale || locale === 'en' ? 'fr' : 'en';
  return json(
    { locale: newLocale },
    {
      headers: {
        'Set-Cookie': serialize(cookieName, newLocale, cookieOptions),
      },
    },
  );
};
