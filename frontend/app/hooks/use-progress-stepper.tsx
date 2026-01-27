import { useTranslation } from 'react-i18next';

import type { ApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';

export type StepStatus = 'completed' | 'active' | 'inactive';

export type StepId = 'marital-status' | 'contact-information' | 'dental-insurance' | 'submit' | 'parent-or-guardian' | 'childrens-application';

export type FlowId = ExtractStrict<ApplicationFlow, 'full-adult' | 'full-children' | 'full-family' | 'simplified-adult' | 'simplified-children' | 'simplified-family'>;

export interface StepInfo {
  id: StepId;
  status: StepStatus;
  description: string;
}

export interface FlowConfig {
  steps: StepId[]; // Array of step IDs in order
}

export function useProgressStepper(flowId: FlowId, currentStepId: StepId) {
  const { t } = useTranslation('application');

  const flows: Record<FlowId, FlowConfig> = {
    'full-adult': {
      steps: ['marital-status', 'contact-information', 'dental-insurance', 'submit'],
    },
    'full-children': {
      steps: ['parent-or-guardian', 'childrens-application', 'submit'],
    },
    'full-family': {
      steps: ['marital-status', 'contact-information', 'dental-insurance', 'childrens-application', 'submit'],
    },
    'simplified-adult': {
      steps: ['contact-information', 'dental-insurance', 'submit'],
    },
    'simplified-children': {
      steps: ['parent-or-guardian', 'childrens-application', 'submit'],
    },
    'simplified-family': {
      steps: ['contact-information', 'dental-insurance', 'childrens-application', 'submit'],
    },
  };

  const flow = flows[flowId];
  const currentStepIndex = flow.steps.indexOf(currentStepId);
  const steps: StepInfo[] = flow.steps.map((stepId, index) => {
    const isCurrent = stepId === currentStepId;
    const isPreviousToCurrent = index < currentStepIndex;
    // eslint-disable-next-line unicorn/no-nested-ternary
    const status = isCurrent ? 'active' : isPreviousToCurrent ? 'completed' : 'inactive';

    return {
      id: stepId,
      status,
      description: t(`progress-stepper.${stepId}`),
    };
  });

  return {
    steps,
    currentStep: currentStepIndex,
  };
}
