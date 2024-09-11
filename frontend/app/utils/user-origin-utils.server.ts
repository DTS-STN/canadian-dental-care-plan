import type { Session } from '@remix-run/node';

export function getUserOrigin(request: Request, session: Session) {
  // try to get it from search params
  const { searchParams } = new URL(request.url);
  const originParam = searchParams.get('origin');
  if (originParam) return originParam;

  // try to get it from session
  const savedUserOrigin = session.get('userOrigin');

  // default to 'msca-d'
  return savedUserOrigin ?? 'msca-d';
}
