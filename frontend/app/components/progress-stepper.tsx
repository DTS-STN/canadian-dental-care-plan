import { Stepper as StepperUnstable } from './stepper';

interface ProgressStepperProps {
  steps: Array<{
    id: string;
    description: string;
  }>;
  currentStep: number;
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="print:hidden">
      <StepperUnstable steps={steps.map(({ description }) => ({ label: description }))} activeStep={currentStep + 1} />
    </div>
  );
}
