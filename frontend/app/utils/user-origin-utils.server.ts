import { z } from 'zod';

import { getSessionService } from '~/services/session-service.server';

export const originEnumSchema = z.enum(['msca', 'msca-d']);

export async function getUserOrigin(request: Request) {
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  // try to get it from search params
  const { searchParams } = new URL(request.url);
  const originParam = searchParams.get('origin');
  const parsedOrigin = originEnumSchema.safeParse(originParam);
  if (parsedOrigin.success) return parsedOrigin.data;

  // try to get it from session
  const savedUserOrigin = session.get('userOrigin');

  // default to 'msca-d' if parse throw an error
  return originEnumSchema.catch(originEnumSchema.Enum['msca-d']).parse(savedUserOrigin);
}
