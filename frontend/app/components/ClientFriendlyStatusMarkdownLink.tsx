import type { PropsWithChildren } from 'react';

import type { MarkdownToJSX } from 'markdown-to-jsx';
import Markdown from 'markdown-to-jsx';

import { InlineLink } from './inline-link';

const markdownOptions: MarkdownToJSX.Options = {
  wrapper: ClientFriendlyStatusMarkdownWrapper,
  overrides: {
    a: {
      component: ClientFriendlyStatusMarkdownLink,
    },
  },
};

/**
 * Renders markdown content with custom options.
 */
export function ClientFriendlyStatusMarkdown({ content }: { content: string }) {
  return <Markdown options={markdownOptions}>{content}</Markdown>;
}

/**
 * Props for ClientFriendlyStatusMarkdownLink component.
 */
export interface ClientFriendlyStatusMarkdownLinkProps extends PropsWithChildren {
  href: string;
}

/**
 * Renders a link with custom styles and opens it in a new tab.
 */
export function ClientFriendlyStatusMarkdownLink({ children, href }: ClientFriendlyStatusMarkdownLinkProps) {
  return (
    <InlineLink to={href} className="external-link" newTabIndicator target="_blank">
      {children}
    </InlineLink>
  );
}

/**
 * Wraps the content in a div with custom styles.
 */
export function ClientFriendlyStatusMarkdownWrapper({ children }: PropsWithChildren) {
  return <div className="space-y-4">{children}</div>;
}
