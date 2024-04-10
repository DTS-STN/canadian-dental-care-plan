import { useParams } from '@remix-run/react';

import { BilingualNotFoundError, NotFoundError } from '~/components/layouts/public-layout';

export default function LangIndex() {
  const { lang: langParam } = useParams();

  return langParam && ['en', 'fr'].includes(langParam) ? <NotFoundError /> : <BilingualNotFoundError />;
}
