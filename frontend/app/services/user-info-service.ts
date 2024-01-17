import { z } from 'zod';

export type UserInfo = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

export async function getUserId() {
  return '00000000-0000-0000-0000-000000000000';
}

export async function getUserInfo(userId: string) {
  const response = await fetch(`https://api.example.com/users/${userId}`);

  // prettier-ignore
  const isUserInfo = (val: unknown) => {
    return (typeof val === 'object' && z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phoneNumber: z.string().optional(),
    }).parse(val));
  };

  return z.custom<UserInfo>(isUserInfo).parse(await response.json());
}

export async function updateUserInfo(userId: string, userInfo: UserInfo) {
  const patches = Object.entries(userInfo)
    .filter(([key, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({ op: 'replace', path: `/${key}`, value: value }));

  if (patches.length > 0) {
    await fetch(`https://api.example.com/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(patches),
    });
  }
}
