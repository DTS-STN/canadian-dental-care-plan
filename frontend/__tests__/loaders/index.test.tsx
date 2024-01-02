import { loader } from '~/routes/_index';

describe('Loader for _index in english', () => {
  test('gets page title', async () => {
    let request = new Request('http://localhost:3000/?lang=en');
    expect((await (await loader({ request, params: {}, context: {} })).json())?.pageTitle).toBe('Canadian Dental Care Plan');
  });
});

describe('Loader for _index in french', () => {
  test('gets page title', async () => {
    let request = new Request('http://localhost:3000/?lang=fr');
    expect((await (await loader({ request, params: {}, context: {} })).json())?.pageTitle).toBe('Régime canadien de soins dentaires');
  });
});
