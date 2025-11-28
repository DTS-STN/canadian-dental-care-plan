import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

export type StatusTagStatus = 'complete' | 'new';

interface StatusTagProps {
  status: StatusTagStatus;
}

export function StatusTag({ status }: StatusTagProps) {
  const { t } = useTranslation('common');

  switch (status) {
    case 'complete': {
      return (
        <div className="flex items-center gap-2 rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
          <FontAwesomeIcon icon={faCheck} className="size-4" />
          <span>{t('status.complete')}</span>
        </div>
      );
    }

    case 'new': {
      return (
        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          <span>{t('status.new')}</span>
        </div>
      );
    }

    default: {
      return null;
    }
  }
}
