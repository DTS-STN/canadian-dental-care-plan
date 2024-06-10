import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useParams } from '@remix-run/react';

import { BilingualNotFoundError, NotFoundError } from '~/components/layouts/public-layout';
import { getLogger } from '~/utils/logging.server';

export function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  // Return a 404 status response because the displayed content is "not found"
  return new Response(null, { status: 404 });
}

export function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('$lang/index');

  if (!['en', 'fr'].includes(String(params.lang))) {
    log.warn('Invalid lang requested [%s]; responding with 404', params.lang);
    throw new Response(null, { status: 404 });
  }

  log.warn('Invalid method requested [%s]; responding with 405', request.method);
  throw new Response(null, { status: 405 });
}

export default function LangIndex() {
  const { lang: langParam } = useParams();

  return langParam && ['en', 'fr'].includes(langParam) ? <NotFoundError /> : <BilingualNotFoundError />;
}
