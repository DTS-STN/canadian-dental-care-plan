import type { PropsWithChildren } from 'react';

import type { Options } from 'react-markdown';
import Markdown from 'react-markdown';

import { InlineLink } from './inline-link';

const markdownOptions: Options = {
  components: {
    a: ({ children, href }) => href && <ClientFriendlyStatusMarkdownLink href={href}>{children}</ClientFriendlyStatusMarkdownLink>,
    ul: ({ children }) => <ul className="list-disc space-y-1 pl-7">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal space-y-1 pl-7">{children}</ol>,
  },
};

/**
 * Renders markdown content with custom options.
 */
export function ClientFriendlyStatusMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      <Markdown {...markdownOptions}>{content}</Markdown>
    </div>
  );
}

/**
 * Props for ClientFriendlyStatusMarkdownLink component.
 */
interface ClientFriendlyStatusMarkdownLinkProps extends PropsWithChildren {
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
