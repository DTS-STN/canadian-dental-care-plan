export type UserInfo = { phoneNumber: string };

export async function getUserInfo(userId: string) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return (await response.json()) as UserInfo;
}

export async function updateUserInfo(userId: string, userInfo: UserInfo) {
  await fetch(`https://api.example.com/users/${userId}`, {
    method: 'patch',
    body: JSON.stringify({
      op: 'replace',
      path: '/phoneNumber',
      value: userInfo.phoneNumber,
    }),
  });
}
