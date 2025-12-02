import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

function ApplicantCard({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="applicant-card" className={cn('flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-slate-50', className)} {...props} />;
}

function ApplicantCardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="applicant-card-header" className={cn('flex flex-row items-center justify-between p-6', className)} {...props} />;
}

function ApplicantCardBody({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="applicant-card-body" className={cn('px-6 pb-6', className)} {...props} />;
}

function ApplicantCardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="applicant-card-footer" className={cn('border-t border-slate-300 bg-slate-200 px-6 py-2', className)} {...props} />;
}

function ApplicantCardTitle({ className, children, ...props }: ComponentProps<'h3'>) {
  return (
    <h3 data-slot="applicant-card-title" className={cn('font-lato text-2xl leading-8 font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

export { ApplicantCard, ApplicantCardHeader, ApplicantCardBody, ApplicantCardFooter, ApplicantCardTitle };
