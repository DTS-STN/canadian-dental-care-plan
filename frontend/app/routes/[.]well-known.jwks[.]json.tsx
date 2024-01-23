import { type LoaderFunctionArgs, json } from '@remix-run/node';

import { createHash, createPublicKey } from 'node:crypto';

import { getEnv } from '~/utils/env.server';

/**
 * A JSON endpoint that contains a list of the application's public keys that
 * can be used by an auth provider to verify private key JWTs.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const { AUTH_JWT_PUBLIC_KEY } = getEnv();

  if (!AUTH_JWT_PUBLIC_KEY) {
    return json({ keys: [] });
  }

  return json(
    {
      keys: [
        {
          use: 'sig',
          kid: createHash('md5').update(AUTH_JWT_PUBLIC_KEY).digest('hex'),
          ...createPublicKey(`-----BEGIN PUBLIC KEY-----\n${AUTH_JWT_PUBLIC_KEY}\n-----END PUBLIC KEY-----`).export({ format: 'jwk' }),
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
