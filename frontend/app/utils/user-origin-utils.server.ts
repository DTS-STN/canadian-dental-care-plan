import { createCookie } from '@remix-run/node';

import { z } from 'zod';

export const userOriginCookie = createCookie('__CDCP//origin', {
  path: '/',
  secure: true,
});

export const originEnumSchema = z.enum(['msca', 'msca-d']);

export async function getUserOrigin(request: Request) {
  // try to get it from search params
  const { searchParams } = new URL(request.url);
  const originParam = searchParams.get('origin');
  const parsedOrigin = originEnumSchema.safeParse(originParam);
  if (parsedOrigin.success) return parsedOrigin.data;

  // try to get it from session
  const cookieHeader = request.headers.get('Cookie');
  const cookieValue = (await userOriginCookie.parse(cookieHeader)) || {};

  // default to 'msca-d' if parse throw an error
  return originEnumSchema.catch(originEnumSchema.Enum['msca-d']).parse(cookieValue);
}
