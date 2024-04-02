import type { ReactNode } from 'react';

import { faCheckCircle, faCircleInfo, faExclamationCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { cn } from '~/utils/tw-utils';

export interface ContextualAlertProps {
  children: ReactNode;
  type: 'warning' | 'success' | 'danger' | 'info';
}

export function ContextualAlert(props: ContextualAlertProps) {
  const { children, type } = props;

  const alertColor = type === 'warning' ? 'border-l-amber-700' : type === 'danger' ? 'border-l-red-700' : type === 'info' ? 'border-l-cyan-700' : 'border-l-green-700';

  return (
    <div className="relative my-4 pl-4 sm:pl-6">
      <div className="absolute left-1.5 top-3 bg-white pt-1 sm:left-3.5">
        <Icon type={type} />
      </div>
      <div className={cn('overflow-auto border-l-4 pb-2.5 pl-6 pt-4', alertColor)}>{children}</div>
    </div>
  );
}

function Icon({ type }: { type: string }) {
  switch (type) {
    case 'warning':
      return <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-amber-700" data-testid="warning" />;
    case 'success':
      return <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-700" data-testid="success" />;
    case 'danger':
      return <FontAwesomeIcon icon={faExclamationCircle} className="h-6 w-6 text-red-700" data-testid="danger" />;
    case 'info':
      return <FontAwesomeIcon icon={faCircleInfo} className="h-6 w-6 text-cyan-700" data-testid="info" />;
    default:
      break;
  }
}
