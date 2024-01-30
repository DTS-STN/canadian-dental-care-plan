import { redirect } from '@remix-run/node';

import { action, loader } from '~/routes/_gcweb-app.personal-information.address.edit';
import { addressValidationService } from '~/services/address-validation-service.server';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

vi.mock('~/services/address-validation-service.server', () => ({
  addressValidationService: {
    isValidAddress: vi.fn(),
  },
}));

vi.mock('~/services/session-service.server', () => ({
  sessionService: {
    getSession: vi.fn().mockReturnValue({
      set: vi.fn(),
    }),
    commitSession: vi.fn(),
  },
}));

vi.mock('~/services/user-service.server', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
  },
}));

describe('_gcweb-app.personal-information.address.edit', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo object if userInfo is found', async () => {
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', firstName: 'John', lastName: 'Maverick' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/address/edit'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        userInfo: { id: 'some-id', firstName: 'John', lastName: 'Maverick' },
      });
    });

    it('should throw 404 response if userInfo is not found', async () => {
      vi.mocked(userService.getUserInfo).mockResolvedValue(null);

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/address/edit'),
          context: {},
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });

  describe('action()', () => {
    it('should redirect to confirm page if validation is successful', async () => {
      vi.mocked(addressValidationService.isValidAddress).mockResolvedValue(true);
      vi.mocked(sessionService.commitSession).mockResolvedValue('some-set-cookie-header');

      const formData = new FormData();
      formData.append('homeAddress', '123 Fake Home St.');
      formData.append('mailingAddress', '456 Fake Mailing St.');

      const response = await action({
        request: new Request('http://localhost:3000/personal-information/address/edit', { method: 'POST', body: formData }),
        context: {},
        params: {},
      });

      expect(response).toEqual(redirect('/personal-information/address/confirm', { headers: { 'Set-Cookie': 'some-set-cookie-header' } }));
    });

    it('should return validation errors if validation is unsuccessful', async () => {
      vi.mocked(addressValidationService.isValidAddress).mockResolvedValue(false);

      const response = await action({
        request: new Request('http://localhost:3000/personal-information/address/edit', { method: 'POST', body: new FormData() }),
        context: {},
        params: {},
      });

      const errors = (await response.json()).errors;
      expect(errors.fieldErrors.homeAddress?.[0]).toBeTruthy();
      expect(errors.fieldErrors.mailingAddress?.[0]).toBeTruthy();
    });
  });
});
