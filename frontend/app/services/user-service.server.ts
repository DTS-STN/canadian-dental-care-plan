import { z } from 'zod';

export const userInfoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  homeAddress: z.string().optional(),
  mailingAddress: z.string().optional(),
  preferredLanguage: z.string().optional()
});

export type UserInfo = z.infer<typeof userInfoSchema>;

export interface UserServiceDependencies {
  readonly env: {
    readonly INTEROP_API_BASE_URI: string;
  };
}

export function getUserService({ env }: UserServiceDependencies) {
  const { INTEROP_API_BASE_URI } = env;

  async function getUserId() {
    return '00000000-0000-0000-0000-000000000000';
  }

  async function getUserInfo(userId: string) {
    const response = await fetch(`${INTEROP_API_BASE_URI}/users/${userId}`);
    return userInfoSchema.parse(await response.json());
  }

  async function updateUserInfo(userId: string, userInfo: UserInfo) {
    const patches = Object.entries(userInfo)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => ({ op: 'replace', path: `/${key}`, value: value }));

    if (patches.length > 0) {
      await fetch(`${INTEROP_API_BASE_URI}/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(patches),
      });
    }
  }

  return {
    getUserId,
    getUserInfo,
    updateUserInfo,
  };
}
