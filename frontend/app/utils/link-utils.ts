/**
 * Scrolls and focuses on the element identified by the anchor link's hash.
 *
 * @param {string} href - The anchor link URL.
 */
export function scrollAndFocusFromAnchorLink(href: string): void {
  if (!URL.canParse(href)) return;

  const { hash } = new URL(href);
  if (!hash) return;

  const targetElement = document.querySelector<HTMLElement>(hash);
  if (!targetElement) return;

  targetElement.scrollIntoView({ behavior: 'smooth' });
  targetElement.focus();
}
