import { render, screen, waitFor } from '@testing-library/react';

import { Outlet, json } from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';

import type { BuildInfo } from '~/utils/route-utils';
import { coalesce, useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey } from '~/utils/route-utils';

describe('coalesce<T> reducer', () => {
  test('expect undefined from two undefined values', () => {
    expect(coalesce(undefined, undefined)).toBeUndefined();
  });

  test('expect previous from previous and undefined', () => {
    expect(coalesce('previous', undefined)).toBe('previous');
  });

  test('expect current from undefined and current', () => {
    expect(coalesce(undefined, 'current')).toBe('current');
  });

  test('expect current from previous and current', () => {
    expect(coalesce('previous', 'current')).toBe('current');
  });
});

describe('useBreadcrumbs()', () => {
  it('expect no breadcrumbs from useBreadcrumbs() if the loaders do not provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useBreadcrumbs())}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced breadcrumbs from useBreadcrumbs() if the loaders provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        handle: { breadcrumbs: [{ labelI18nKey: 'common:index.breadcrumbs.home' }] } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useBreadcrumbs())}</div>,
            handle: { breadcrumbs: [{ labelI18nKey: 'common:about.breadcrumbs.home', to: '/' }, { labelI18nKey: 'common:about.breadcrumbs.about' }] } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('[{"labelI18nKey":"common:about.breadcrumbs.home","to":"/"},{"labelI18nKey":"common:about.breadcrumbs.about"}]');
  });
});

describe('useBuildInfo()', () => {
  it('expect no build info from useBuildInfo() if the loaders do not provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useBuildInfo())}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced build info from useBuildInfo() if the loaders provide data', async () => {
    interface DataBuildInfo {
      buildInfo: BuildInfo;
    }

    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        loader: () => {
          return json<DataBuildInfo>({
            buildInfo: {
              buildDate: '0000-00-00T00:00:00Z',
              buildId: '0000',
              buildRevision: '00000000',
              buildVersion: '0.0.0+00000000-0000',
            },
          });
        },
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useBuildInfo())}</div>,
            loader: () => {
              return json<DataBuildInfo>({
                buildInfo: {
                  buildDate: '2000-01-01T00:00:00Z',
                  buildId: '6969',
                  buildRevision: '69696969',
                  buildVersion: '0.0.0+69696969-6969',
                },
              });
            },
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('{"buildDate":"2000-01-01T00:00:00Z","buildId":"6969","buildRevision":"69696969","buildVersion":"0.0.0+69696969-6969"}');
  });
});

describe('useI18nNamespaces()', () => {
  it('expect no i18n namespaces from useI18nNamespaces() if the loaders do not provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useI18nNamespaces())}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('[]');
  });

  it('expect correctly flattened i18n namespaces from useI18nNamespaces() if the loaders provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        handle: { i18nNamespaces: ['common'] } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useI18nNamespaces())}</div>,
            handle: { i18nNamespaces: ['gcweb'] } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('["common","gcweb"]');
  });
});

describe('usePageIdentifier()', () => {
  it('expect no page identifier from usePageIdentifier() if the loaders do not provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(usePageIdentifier())}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced page identifier from usePageIdentifier() if the loaders provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        handle: { pageIdentifier: 'CDCP-0000' } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(usePageIdentifier())}</div>,
            handle: { pageIdentifier: 'CDCP-0001' } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('"CDCP-0001"');
  });
});

describe('usePageTitle()', () => {
  it('expect no page title from usePageTitle() if the loaders do not provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(usePageTitleI18nKey())}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced page title from usePageTitle() if the loaders provide data', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <Outlet />,
        handle: { pageTitleI18nKey: 'common:index.page-title' } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(usePageTitleI18nKey())}</div>,
            handle: { pageTitleI18nKey: 'common:about.page-title' } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('data'));
    expect(element.textContent).toEqual('"common:about.page-title"');
  });
});
