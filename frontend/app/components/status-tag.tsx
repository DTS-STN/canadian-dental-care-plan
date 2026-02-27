import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Badge } from '~/components/badge';

interface StatusTagProps {
  status: 'complete' | 'new' | 'optional';
  ariaLabel?: string;
}

export function StatusTag({ status, ariaLabel }: StatusTagProps) {
  const { t } = useTranslation(['common']);

  switch (status) {
    case 'complete': {
      return (
        <Badge variant="success" role="status" aria-label={ariaLabel}>
          <FontAwesomeIcon icon={faCheck} />
          <span>{t('common:status.complete')}</span>
        </Badge>
      );
    }

    case 'new': {
      return (
        <Badge variant="info" role="status" aria-label={ariaLabel}>
          {t('common:status.new')}
        </Badge>
      );
    }

    case 'optional': {
      return (
        <Badge variant="gray" role="status" aria-label={ariaLabel}>
          {t('common:status.optional')}
        </Badge>
      );
    }

    default: {
      return null;
    }
  }
}
