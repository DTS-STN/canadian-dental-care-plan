import type { ReactNode } from 'react';

import type { Params } from 'react-router';

import { faCheck, faCirclePlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { AppLink } from './app-link';

export type ApplicantCardStatus = 'complete' | 'new';

export interface ApplicantCardProps {
  title: ReactNode;
  status?: ApplicantCardStatus;
  children: ReactNode;
  footerAction?: {
    type: 'add' | 'edit';
    routeId: string;
    params?: Params;
    text: string;
  };
}

export function ApplicantCard({ title, status, children, footerAction }: ApplicantCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
      <div className="flex flex-row items-center justify-between p-6">
        <h3 className="font-lato text-2xl leading-8 font-semibold">{title}</h3>

        {status && <StatusTag status={status} />}
      </div>

      <div className="px-6 pb-6">{children}</div>

      {footerAction && (
        <div className="border-t border-slate-300 bg-slate-200 px-6 py-4">
          <FooterAction type={footerAction.type} routeId={footerAction.routeId} params={footerAction.params} text={footerAction.text} />
        </div>
      )}
    </div>
  );
}

interface StatusTagProps {
  status: 'complete' | 'new';
}

function StatusTag({ status }: StatusTagProps) {
  const { t } = useTranslation();

  switch (status) {
    case 'complete': {
      return (
        <div className="flex items-center gap-2 rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
          <FontAwesomeIcon icon={faCheck} className="size-4" />
          <span>{t('common:status.complete')}</span>
        </div>
      );
    }

    case 'new': {
      return (
        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          <span>{t('common:status.new')}</span>
        </div>
      );
    }

    default: {
      return null;
    }
  }
}

interface FooterActionProps {
  type: 'add' | 'edit';
  routeId: string;
  params?: Params;
  text: string;
}

function FooterAction({ type, routeId, params, text }: FooterActionProps) {
  const icon = type === 'add' ? faCirclePlus : faEdit;

  return (
    <AppLink routeId={routeId} params={params} className="inline-flex items-center gap-2 font-semibold text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-800">
      <FontAwesomeIcon icon={icon} className="size-4" />
      <span>{text}</span>
    </AppLink>
  );
}
