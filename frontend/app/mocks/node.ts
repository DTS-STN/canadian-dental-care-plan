import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  // prettier-ignore
  http.get('https://api.example.com/users/*', () => {
    return HttpResponse.json({
      firstName: 'John',
      lastName: 'Maverick',
      phoneNumber: '(555) 555-5555',
      homeAddress: '123 Home Street',
      mailingAddress: '123 Mailing Street',
      preferredLanguage: 'fr'
    })
  }),

  http.patch('https://api.example.com/users/*', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

export const server = setupServer(...handlers);
