import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Badge } from '~/components/badge';

interface StatusTagProps {
  status: 'complete' | 'new' | 'optional';
}

export function StatusTag({ status }: StatusTagProps) {
  const { t } = useTranslation(['common']);

  switch (status) {
    case 'complete': {
      return (
        <Badge variant="success">
          <FontAwesomeIcon icon={faCheck} />
          <span>{t('common:status.complete')}</span>
        </Badge>
      );
    }

    case 'new': {
      return <Badge variant="info">{t('common:status.new')}</Badge>;
    }

    case 'optional': {
      return <Badge variant="gray">{t('common:status.optional')}</Badge>;
    }

    default: {
      return null;
    }
  }
}
