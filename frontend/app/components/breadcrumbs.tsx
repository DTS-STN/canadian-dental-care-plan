import type { ReactNode } from 'react';

import { useParams } from 'react-router';
import type { To } from 'react-router';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { InlineLink } from './inline-link';

export interface BreadcrumbsProps {
  className?: string;
  items: Array<{ content: string; routeId?: string; to?: To }>;
}

export function Breadcrumbs({ className, items }: BreadcrumbsProps) {
  const { t } = useTranslation(['gcweb']);

  return (
    <nav id="wb-bc" className={className} property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs" className="sr-only">
        {t('gcweb:breadcrumbs.you-are-here')}
      </h2>
      <div className="container">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1" typeof="BreadcrumbList">
          {items.map(({ content, routeId, to }, idx) => {
            return (
              <li key={content} property="itemListElement" typeof="ListItem" className="flex items-center">
                {idx !== 0 && <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />}
                <Breadcrumb routeId={routeId} to={to}>
                  {content}
                </Breadcrumb>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function Breadcrumb({ children, routeId, to }: { children: ReactNode; routeId?: string; to?: To }) {
  const params = useParams();

  // prettier-ignore
  return routeId === undefined && to === undefined
    ? <span property="name">{children}</span>
    : <InlineLink routeId={routeId} params={params} to={to} property="item" typeof="WebPage"><span property="name">{children}</span></InlineLink>;
}
