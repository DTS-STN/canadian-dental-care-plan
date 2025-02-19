import { render, screen, waitFor } from '@testing-library/react';

import { Outlet, createRoutesStub } from 'react-router';

import { describe, expect, it } from 'vitest';

import type { Breadcrumbs, BuildInfo, RouteHandleData } from '~/utils/route-utils';
import { coalesce, useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey, useTransformAdobeAnalyticsUrl } from '~/utils/route-utils';

/*
 * @vitest-environment jsdom
 */

describe('coalesce<T> reducer', () => {
  it('expect undefined from two undefined values', () => {
    expect(coalesce(undefined, undefined)).toBeUndefined();
  });

  it('expect previous from previous and undefined', () => {
    expect(coalesce('previous', undefined)).toBe('previous');
  });

  it('expect current from undefined and current', () => {
    expect(coalesce(undefined, 'current')).toBe('current');
  });

  it('expect current from previous and current', () => {
    expect(coalesce('previous', 'current')).toBe('current');
  });
});

describe('useBreadcrumbs()', () => {
  it('expect no breadcrumbs from useBreadcrumbs() if the loaders do not provide data', async () => {
    const RoutesStub = createRoutesStub([
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

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('[]');
  });

  it('expect correctly coalesced breadcrumbs from useBreadcrumbs() if the loaders provide data', async () => {
    const breadcrumbs: Breadcrumbs = [
      { labelI18nKey: 'gcweb:breadcrumbs.canada-ca', to: 'canada.ca' },
      { labelI18nKey: 'gcweb:breadcrumbs.home', to: '/home' },
      { labelI18nKey: 'gcweb:breadcrumbs.benefits', to: '/benefits' },
    ];

    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: {
          breadcrumbs: [{ labelI18nKey: 'gcweb:breadcrumbs.home' }],
        } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useBreadcrumbs())}</div>,
            handle: { breadcrumbs } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual(JSON.stringify(breadcrumbs));
  });
});

describe('useBuildInfo()', () => {
  it('expect no build info from useBuildInfo() if the loaders do not provide data', async () => {
    const RoutesStub = createRoutesStub([
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

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced build info from useBuildInfo() if the loaders provide data', async () => {
    interface DataBuildInfo {
      buildInfo: BuildInfo;
    }

    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        loader: () => ({
          buildInfo: {
            buildDate: '0000-00-00T00:00:00Z',
            buildId: '0000',
            buildRevision: '00000000',
            buildVersion: '0.0.0-00000000-0000',
          },
        }),
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useBuildInfo())}</div>,
            loader: () => {
              return {
                buildInfo: {
                  buildDate: '2000-01-01T00:00:00Z',
                  buildId: '6969',
                  buildRevision: '69696969',
                  buildVersion: '0.0.0-69696969-6969',
                },
              } satisfies DataBuildInfo;
            },
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('{"buildDate":"2000-01-01T00:00:00Z","buildId":"6969","buildRevision":"69696969","buildVersion":"0.0.0-69696969-6969"}');
  });
});

describe('useI18nNamespaces()', () => {
  it('expect no i18n namespaces from useI18nNamespaces() if the loaders do not provide data', async () => {
    const RoutesStub = createRoutesStub([
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

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('[]');
  });

  it('expect correctly flattened i18n namespaces from useI18nNamespaces() if the loaders provide data', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: { i18nNamespaces: ['apply'] } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useI18nNamespaces())}</div>,
            handle: { i18nNamespaces: ['gcweb'] } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('["apply","gcweb"]');
  });
});

describe('useTransformAdobeAnalyticsUrl()', () => {
  it('expect no transform url function from useTransformAdobeAnalyticsUrl() if the loaders do not provide data', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify({ transformAdobeAnalyticsUrl: useTransformAdobeAnalyticsUrl() ? true : false })}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('{"transformAdobeAnalyticsUrl":false}');
  });

  it('expect correctly coalesced transform url from useTransformAdobeAnalyticsUrl() if the loaders provide data', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: {} satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify({ transformAdobeAnalyticsUrl: useTransformAdobeAnalyticsUrl() ? true : false })}</div>,
            handle: { transformAdobeAnalyticsUrl: () => new URL('https//example.com') } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('{"transformAdobeAnalyticsUrl":true}');
  });
});

describe('usePageIdentifier()', () => {
  it('expect no page identifier from usePageIdentifier() if the loaders do not provide data', async () => {
    const RoutesStub = createRoutesStub([
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

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced page identifier from usePageIdentifier() if the loaders provide data', async () => {
    const RoutesStub = createRoutesStub([
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

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('"CDCP-0001"');
  });
});

describe('usePageTitle()', () => {
  it('expect no page title from usePageTitle() if the loaders do not provide data', async () => {
    const RoutesStub = createRoutesStub([
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

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('');
  });

  it('expect correctly coalesced page title from usePageTitle() if the loaders provide data', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: { pageTitleI18nKey: 'apply:index.page-title' } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(usePageTitleI18nKey())}</div>,
            handle: { pageTitleI18nKey: 'apply:index.page-title' } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('"apply:index.page-title"');
  });
});
