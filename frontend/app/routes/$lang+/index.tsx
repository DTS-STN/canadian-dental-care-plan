import { useParams } from '@remix-run/react';

import { BilingualNotFoundError, NotFoundError } from '~/components/layouts/public-layout';

export default function LangIndex() {
  const { lang: langParam } = useParams();

  return ['en', 'fr'].includes(langParam) ? <NotFoundError /> : <BilingualNotFoundError />;
}
