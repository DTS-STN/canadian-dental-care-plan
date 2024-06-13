import type { ComponentProps, MouseEvent } from 'react';

import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';

/**
 * AnchorLinkProps represents the properties for the AnchorLink component.
 * It extends the ComponentProps<'a'> type, omitting the 'href' property,
 * and adds the required 'anchorElementId' property.
 */
export interface AnchorLinkProps extends OmitStrict<ComponentProps<'a'>, 'href'> {
  anchorElementId: string;
}

/**
 * AnchorLink is a React component used to create anchor links that scroll
 * and focus on the specified target element when clicked.
 *
 * @param {AnchorLinkProps} props - The properties for the AnchorLink component.
 * @returns {JSX.Element} JSX element representing the anchor link.
 */
export function AnchorLink(props: AnchorLinkProps) {
  const { anchorElementId, children, onClick, ...restProps } = props;

  /**
   * handleOnSkipLinkClick is the click event handler for the anchor link.
   * It prevents the default anchor link behavior, scrolls to and focuses
   * on the target element specified by 'anchorElementId', and invokes
   * the optional 'onClick' callback.
   */
  function handleOnSkipLinkClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    scrollAndFocusFromAnchorLink(e.currentTarget.href);
    onClick?.(e);
  }

  return (
    <a href={`#${anchorElementId}`} onClick={handleOnSkipLinkClick} data-testid="anchor-link" {...restProps}>
      {children}
    </a>
  );
}
