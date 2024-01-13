import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  // prettier-ignore
  http.get('https://api.example.com/user/*', () => HttpResponse.json({ firstName: 'John', lastName: 'Maverick' })),
];

export const server = setupServer(...handlers);
