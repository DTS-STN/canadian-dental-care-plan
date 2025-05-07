import type { MouseEvent } from 'react';

import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';

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

export function SkipNavigationLinks() {
  const { t } = useTranslation(['gcweb']);
  return (
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
  );
}
