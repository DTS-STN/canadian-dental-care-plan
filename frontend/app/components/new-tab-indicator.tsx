import type { ComponentProps } from 'react';

import { useTranslation } from 'react-i18next';
import { Except } from 'type-fest';

import { cn } from '~/utils/tw-utils';

export function NewTabIndicator({ className, ...props }: Except<ComponentProps<'span'>, 'children'>) {
  const { t } = useTranslation('gcweb');
  // Following whitespace is important to ensure the content's text is seperated for the screen-reader text
  return (
    <span className={cn('sr-only', className)} {...props}>
      {` (${t('screen-reader.new-tab')})`}
    </span>
  );
}
