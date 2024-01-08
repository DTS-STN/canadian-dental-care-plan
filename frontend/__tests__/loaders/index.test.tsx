import { loader } from '~/routes/_gcweb-app._index';

describe('Loader for _index in english', () => {
  test('gets page title', async () => {
    let request = new Request('http://localhost:3000/?lang=en');
    expect((await (await loader({ request, params: {}, context: {} })).json())?.pageTitle).toBe('Home');
  });
});

describe('Loader for _index in french', () => {
  test('gets page title', async () => {
    let request = new Request('http://localhost:3000/?lang=fr');
    expect((await (await loader({ request, params: {}, context: {} })).json())?.pageTitle).toBe('Accueil');
  });
});
