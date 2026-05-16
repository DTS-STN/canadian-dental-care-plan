import { render, screen, waitFor } from '@testing-library/react';

import { Outlet, createRoutesStub } from 'react-router';

import { describe, expect, it } from 'vitest';

import type { BuildInfo, RouteHandleData } from '~/utils/route-utils';
import { coalesce, useBuildInfo, useI18nNamespaces, useLayoutOptions, usePageIdentifier, useTransformAdobeAnalyticsUrl } from '~/utils/route-utils';

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
        handle: { i18nNamespaces: ['common'] } satisfies RouteHandleData,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useI18nNamespaces())}</div>,
            handle: { i18nNamespaces: 'gcweb' } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('["common","gcweb"]');
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

describe('useLayoutOptions()', () => {
  it('returns default layout options from useLayoutOptions() when no handle provides data', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => <div data-testid="data">{JSON.stringify(useLayoutOptions())}</div>,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('{}');
  });

  it('returns parent layoutOptions from useLayoutOptions() when leaf does not provide data', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: {
          layoutOptions: { breadcrumbs: <span>parent breadcrumbs</span> },
        } satisfies RouteHandleData,
        children: [
          {
            Component: () => {
              const { breadcrumbs } = useLayoutOptions();
              return <div data-testid="data">{breadcrumbs}</div>;
            },
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    await waitFor(async () => await screen.findByTestId('data'));
    expect(screen.getByText('parent breadcrumbs')).toBeInTheDocument();
  });

  it('expect leaf layoutOptions to override parent layoutOptions', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: {
          layoutOptions: { breadcrumbs: <span>parent breadcrumbs</span> },
        } satisfies RouteHandleData,
        children: [
          {
            Component: () => {
              const { breadcrumbs } = useLayoutOptions();
              return <div data-testid="data">{breadcrumbs}</div>;
            },
            handle: {
              layoutOptions: { breadcrumbs: <span>child breadcrumbs</span> },
            } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    await waitFor(async () => await screen.findByTestId('data'));
    expect(screen.queryByText('parent breadcrumbs')).not.toBeInTheDocument();
    expect(screen.getByText('child breadcrumbs')).toBeInTheDocument();
  });

  it('expect merged layoutOptions when leaf provides a subset of properties', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        handle: {
          layoutOptions: { breadcrumbs: <span>parent breadcrumbs</span> },
        } satisfies RouteHandleData,
        children: [
          {
            Component: () => {
              const { breadcrumbs } = useLayoutOptions();
              return <div data-testid="data">{breadcrumbs}</div>;
            },
            handle: { layoutOptions: {} } satisfies RouteHandleData,
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    await waitFor(async () => await screen.findByTestId('data'));
    expect(screen.getByText('parent breadcrumbs')).toBeInTheDocument();
  });

  it('returns undefined breadcrumbs from useLayoutOptions() when no handle provides layoutOptions', async () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <Outlet />,
        children: [
          {
            Component: () => {
              const { breadcrumbs } = useLayoutOptions();
              return <div data-testid="data">{breadcrumbs == null ? 'no-breadcrumbs' : 'has-breadcrumbs'}</div>;
            },
            path: '/',
          },
        ],
      },
    ]);

    render(<RoutesStub />);

    const element = await waitFor(async () => await screen.findByTestId('data'));
    expect(element.textContent).toEqual('no-breadcrumbs');
  });
});
