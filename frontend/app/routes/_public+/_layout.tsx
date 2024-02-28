import type { ComponentProps, MouseEvent, ReactNode } from 'react';

import { Link, Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { LanguageSwitcher } from '~/components/language-switcher';
import { PageTitle } from '~/components/page-title';
import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const handle = { i18nNamespaces } as const satisfies RouteHandleData;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      // TODO :: GjB :: handle other status codes
      default:
        return <ServerError error={error} />;
    }
  }

  return <ServerError error={error} />;
}

export default function PublicLayout() {
  return (
    <ApplicationLayout>
      <Outlet />
    </ApplicationLayout>
  );
}

/**
 * Application page template.
 */
function ApplicationLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <AppPageTitle />
        {children}
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

function PageHeader() {
  const { i18n, t } = useTranslation(i18nNamespaces);

  /**
   * handleOnSkipLinkClick is the click event handler for the anchor link.
   * It prevents the default anchor link behavior, scrolls to and focuses
   * on the target element specified by 'anchorElementId', and invokes
   * the optional 'onClick' callback.
   */
  function handleOnSkipLinkClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    scrollAndFocusFromAnchorLink(e.currentTarget.href);
  }

  return (
    <>
      <div id="skip-to-content">
        {[
          { to: '#wb-cont', children: t('gcweb:nav.skip-to-content') },
          { to: '#wb-info', children: t('gcweb:nav.skip-to-about') },
        ].map(({ to, children }) => (
          <ButtonLink key={to} to={to} onClick={handleOnSkipLinkClick} variant="primary" className="absolute z-10 mx-2 -translate-y-full transition-all focus:mt-2 focus:translate-y-0">
            {children}
          </ButtonLink>
        ))}
      </div>
      <header>
        <div id="wb-bnr" className="border border-b border-gray-200 bg-gray-50">
          <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
            <div property="publisher" typeof="GovernmentOrganization">
              <Link to={t('gcweb:header.govt-of-canada.href')} property="url">
                <img className="h-8 w-auto" src={`/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb:header.govt-of-canada.text')} property="logo" width="300" height="28" decoding="async" />
              </Link>
              <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
              <meta property="areaServed" typeof="Country" content="Canada" />
              <link property="logo" href="/assets/wmms-blk.svg" />
            </div>
            <section id="wb-lng">
              <h2 className="sr-only">{t('gcweb:header.language-selection')}</h2>
              <LanguageSwitcher>
                <span className="hidden md:block">{t('gcweb:language-switcher.alt-lang')}</span>
                <abbr title={t('gcweb:language-switcher.alt-lang')} className="cursor-help uppercase md:hidden">
                  {t('gcweb:language-switcher.alt-lang-abbr')}
                </abbr>
              </LanguageSwitcher>
            </section>
          </div>
        </div>
        <section className="bg-gray-700 text-white">
          <div className="sm:container">
            <div className="flex flex-col items-stretch justify-between sm:flex-row sm:items-center">
              <h2 className="p-4 font-lato text-xl font-semibold sm:p-0 sm:text-2xl md:py-3">
                <Link to="/" className="hover:underline">
                  {t('gcweb:header.application-title')}
                </Link>
              </h2>
            </div>
          </div>
        </section>
      </header>
      <Breadcrumbs />
    </>
  );
}

function AppPageTitle(props: Omit<ComponentProps<typeof PageTitle>, 'children'>) {
  const { t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();

  return pageTitleI18nKey && <PageTitle {...props}>{t(pageTitleI18nKey)}</PageTitle>;
}

function PageDetails() {
  const buildInfo = useBuildInfo() ?? {
    buildDate: '2000-01-01T00:00:00Z',
    buildVersion: '0.0.0-00000000-0000',
  };

  const pageIdentifier = usePageIdentifier();

  const { t } = useTranslation(i18nNamespaces);

  return (
    <section className="mb-8 mt-16">
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <dl id="wb-dtmd" className="space-y-1 text-sm text-gray-500">
        {!!pageIdentifier && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.screen-id')}</dt>
            <dd>
              <span property="identifier">{pageIdentifier}</span>
            </dd>
          </div>
        )}
        {!!buildInfo.buildDate && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.date-modfied')}</dt>
            <dd>
              <time property="dateModified">{buildInfo.buildDate.slice(0, 10)}</time>
            </dd>
          </div>
        )}
        {!!buildInfo.buildVersion && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.version')}</dt>
            <dd>
              <span property="version">{buildInfo.buildVersion}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function PageFooter() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <footer id="wb-info" className="border-t bg-stone-50 py-7">
      <div className="container">
        <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
        <div className=" flex items-center justify-between gap-4">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="sr-only">
              {t('gcweb:footer.gc-corporate')}
            </h3>
            <div className="flex flex-col items-start gap-2 text-sm leading-6 sm:flex-row sm:items-center sm:gap-4">
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.terms-conditions.href')}>
                {t('gcweb:footer.terms-conditions.text')}
              </Link>
              <div className="hidden size-0 rounded-full border-[3px] border-slate-700 sm:block"></div>
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.privacy.href')}>
                {t('gcweb:footer.privacy.text')}
              </Link>
            </div>
          </nav>
          <div>
            <img src="/assets/wmms-blk.svg" alt={t('gcweb:footer.gc-symbol')} width={300} height={71} className="h-10 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function Breadcrumb({ children, to }: { children: ReactNode; to?: string }) {
  // prettier-ignore
  return to === undefined
    ? <span property="name">{children}</span>
    : <InlineLink to={to} property="item" typeof="WebPage"><span property="name">{children}</span></InlineLink>;
}

function Breadcrumbs() {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs" className="sr-only">
        {t('gcweb:breadcrumbs.you-are-here')}
      </h2>
      <div className="container mt-4">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1" typeof="BreadcrumbList">
          <li property="itemListElement" typeof="ListItem">
            <Breadcrumb to={breadcrumbs.length !== 0 ? '/' : undefined}>{t('gcweb:breadcrumbs.home')}</Breadcrumb>
          </li>
          {breadcrumbs.map(({ labelI18nKey, to }) => {
            return (
              <li key={labelI18nKey} property="itemListElement" typeof="ListItem" className="flex items-center">
                <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />
                <Breadcrumb to={to}>{t(labelI18nKey)}</Breadcrumb>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

interface ServerErrorProps {
  error: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ServerError({ error }: ServerErrorProps) {
  const { t } = useTranslation(i18nNamespaces);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <InlineLink to="/" />;

  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle>
          {t('gcweb:server-error.page-title')}
          &#32;<small className="block text-2xl font-normal text-neutral-500">{t('gcweb:server-error.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:server-error.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>{t('gcweb:server-error.option-01')}</li>
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:server-error.option-02" components={{ home }} />
          </li>
        </ul>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}
