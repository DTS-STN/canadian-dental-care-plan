import { type ReactNode } from 'react';
import { Link } from '@remix-run/react';
export interface LandingPageLinkProps extends Omit<React.ComponentProps<typeof Link>, 'children'> {
    children: ReactNode;
    description: string;
    title: string;
}
export function LandingPageLink(props: LandingPageLinkProps) {
    const { className, children, description, title, ...linkProps } = props;
    return (
        <div className="rounded-lg border p-6 shadow">
            <h2 className="mt-0">{title}</h2>
            <p>{description}</p>
            <Link {...linkProps}>{children}</Link>
        </div>
    );
}