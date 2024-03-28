import type { ComponentProps } from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '~/utils/tw-utils';

export function NewTabIndicator({ className, ...props }: Omit<ComponentProps<'span'>, 'children'>) {
  const { t } = useTranslation('gcweb');
  return (
    <span className={cn('sr-only', className)} {...props}>
      &#32;({t('screen-reader.new-tab')})
    </span>
  );
}
