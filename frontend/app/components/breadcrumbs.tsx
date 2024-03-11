import { ReactNode } from 'react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import type { To } from 'react-router';

import { InlineLink } from './inline-link';

export interface BreadcrumbsProps {
  items: Array<{ content: string; to?: To }>;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation(['gcweb']);
  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs" className="sr-only">
        {t('gcweb:breadcrumbs.you-are-here')}
      </h2>
      <div className="container mt-4">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1" typeof="BreadcrumbList">
          {items.map(({ content, to }, idx) => {
            return (
              <li key={content} property="itemListElement" typeof="ListItem" className="flex items-center">
                {idx !== 0 && <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />}
                <Breadcrumb to={to}>{content}</Breadcrumb>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function Breadcrumb({ children, to }: { children: ReactNode; to?: To }) {
  // prettier-ignore
  return to === undefined
    ? <span property="name">{children}</span>
    : <InlineLink to={to} property="item" typeof="WebPage"><span property="name">{children}</span></InlineLink>;
}
