import jsonpatch from 'fast-json-patch';
import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('user-service.server');

const userInfoSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  homeAddress: z.string().optional(),
  mailingAddress: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

export type UserInfo = z.infer<typeof userInfoSchema>;

/**
 * Return a singleton instance (by means of memomization) of the user service.
 */
export const getUserService = moize(createUserService, { onCacheAdd: () => log.info('Creating new user service') });

function createUserService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  async function getUserId() {
    return '00000000-0000-0000-0000-000000000000';
  }

  async function getUserInfo(userId: string) {
    const url = `${INTEROP_API_BASE_URI}/users/${userId}`;
    const response = await fetch(url);

    if (response.ok) return userInfoSchema.parse(await response.json());
    if (response.status === 404) return null;

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function updateUserInfo(userId: string, userInfo: UserInfo) {
    const curentUserInfo = await getUserInfo(userId);

    if (!curentUserInfo) return;

    const patch = jsonpatch.compare(curentUserInfo, { ...curentUserInfo, ...userInfo });
    if (patch.length === 0) return;

    const url = `${INTEROP_API_BASE_URI}/users/${userId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to fetch data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
  }

  return { getUserId, getUserInfo, updateUserInfo };
}
