import { redirect } from '@remix-run/node';

import { action, loader } from '~/routes/_gcweb-app.personal-information.address.confirm';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

vi.mock('~/services/session-service.server', () => ({
  sessionService: {
    getSession: vi.fn().mockReturnValue({
      get: vi.fn(),
    }),
  },
}));

vi.mock('~/services/user-service.server', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
    updateUserInfo: vi.fn(),
  },
}));

describe('_gcweb-app.personal-information.address.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo and newAddress objects', async () => {
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });
      vi.mocked((await sessionService.getSession()).get).mockResolvedValue({ homeAddress: '123 Fake Home St.', mailingAddress: '456 Fake Mailing St.' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/address/confirm'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        userInfo: { id: 'some-id', firstName: 'John', lastName: 'Maverick' },
        newAddress: { homeAddress: '123 Fake Home St.', mailingAddress: '456 Fake Mailing St.' },
      });
    });
  });

  describe('action()', () => {
    it('should redirect to personal information page when updating user info is successful', async () => {
      const response = await action({
        request: new Request('http://localhost:3000/personal-information/address/confirm', { method: 'POST' }),
        context: {},
        params: {},
      });

      expect(response).toEqual(redirect('/personal-information'));
    });
  });
});
