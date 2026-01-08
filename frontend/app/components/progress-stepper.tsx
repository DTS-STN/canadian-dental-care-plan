import { faCircleCheck, faCircleDot } from '@fortawesome/free-regular-svg-icons';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger } from './stepper';

import { cn } from '~/utils/tw-utils';

interface ProgressStepperProps {
  steps: Array<{
    id: string;
    status: 'completed' | 'active' | 'inactive';
    description: string;
  }>;
  currentStep: number;
}

const getStepState = (stepStatus: string) => {
  return { completed: stepStatus === 'completed', state: stepStatus };
};

const indicators = {
  completed: <FontAwesomeIcon icon={faCircleCheck} size="xl" className="border-green-700 text-green-700" />,
  active: <FontAwesomeIcon icon={faCircleDot} size="xl" className="border-blue-700 text-blue-700" />,
  inactive: <FontAwesomeIcon icon={faBan} size="xl" flip="horizontal" className="border-slate-700 text-slate-700" />,
};

export function ProgressStepperHorizontal({ steps, currentStep }: ProgressStepperProps) {
  return (
    <Stepper value={currentStep + 1} orientation="horizontal" indicators={indicators} className="w-full">
      <StepperNav>
        {steps.map((step, index) => {
          const { completed, state } = getStepState(step.status);

          return (
            <StepperItem key={step.id} step={index + 1} completed={completed} className="relative flex-1 items-start">
              <StepperTrigger asChild className="flex cursor-default flex-col items-center gap-2.5">
                <StepperIndicator className="size-8 bg-transparent!" />
                <StepperTitle className={cn('max-w-24 text-center text-sm font-medium text-slate-700', state === 'active' && currentStep < steps.length && 'text-blue-700')}>{step.description}</StepperTitle>
              </StepperTrigger>

              {steps.length > index + 1 && (
                <StepperSeparator
                  className={cn(
                    'absolute top-4 left-[calc(50%+1rem)] m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem+0.125rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none',
                    state === 'completed' ? 'bg-green-700' : 'bg-slate-700',
                  )}
                />
              )}
            </StepperItem>
          );
        })}
      </StepperNav>
    </Stepper>
  );
}

export function ProgressStepperVertical({ steps, currentStep }: ProgressStepperProps) {
  return (
    <Stepper value={currentStep + 1} orientation="vertical" indicators={indicators} className="w-full">
      <StepperNav>
        {steps.map((step, index) => {
          const { completed, state } = getStepState(step.status);

          return (
            <StepperItem key={step.id} step={index + 1} completed={completed} className="relative items-start not-last:flex-1">
              <StepperTrigger asChild className="cursor-default items-center gap-2.5 pb-12 last:pb-0">
                <StepperIndicator className="size-8 bg-transparent!" />
                <StepperTitle className={cn('text-sm font-medium text-slate-700', state === 'active' && currentStep < steps.length && 'text-blue-700')}>{step.description}</StepperTitle>
              </StepperTrigger>

              {index < steps.length - 1 && (
                <StepperSeparator className={cn('absolute inset-y-0 top-8 left-4 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-2rem)]', state === 'completed' ? 'bg-green-700' : 'bg-slate-700')} />
              )}
            </StepperItem>
          );
        })}
      </StepperNav>
    </Stepper>
  );
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="print:hidden">
      <div className="hidden sm:block">
        <ProgressStepperHorizontal steps={steps} currentStep={currentStep} />
      </div>
      <div className="sm:hidden">
        <ProgressStepperVertical steps={steps} currentStep={currentStep} />
      </div>
    </div>
  );
}
