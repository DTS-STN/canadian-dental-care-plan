import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ProgressStepper, ProgressStepperHorizontal, ProgressStepperVertical } from '~/components/progress-stepper';

describe('ProgressStepper', () => {
  const mockSteps = [
    {
      id: 'personal',
      status: 'completed' as const,
      description: 'Personal Information',
    },
    {
      id: 'contact',
      status: 'active' as const,
      description: 'Contact Details',
    },
    {
      id: 'preferences',
      status: 'inactive' as const,
      description: 'Preferences',
    },
    {
      id: 'review',
      status: 'inactive' as const,
      description: 'Review & Submit',
    },
  ];

  describe('ProgressStepperHorizontal', () => {
    it('should render the horizontal stepper with all steps', () => {
      const { container } = render(<ProgressStepperHorizontal steps={mockSteps} currentStep={1} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the horizontal stepper with different current step', () => {
      const { container } = render(<ProgressStepperHorizontal steps={mockSteps} currentStep={2} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the horizontal stepper with single step', () => {
      const singleStep = [mockSteps[0]];
      const { container } = render(<ProgressStepperHorizontal steps={singleStep} currentStep={0} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('ProgressStepperVertical', () => {
    it('should render the vertical stepper with all steps', () => {
      const { container } = render(<ProgressStepperVertical steps={mockSteps} currentStep={1} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the vertical stepper with different current step', () => {
      const { container } = render(<ProgressStepperVertical steps={mockSteps} currentStep={2} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the vertical stepper with single step', () => {
      const singleStep = [mockSteps[0]];
      const { container } = render(<ProgressStepperVertical steps={singleStep} currentStep={0} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('ProgressStepper (Responsive)', () => {
    it('should render the responsive stepper wrapper', () => {
      const { container } = render(<ProgressStepper steps={mockSteps} currentStep={1} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the responsive stepper with different current step', () => {
      const { container } = render(<ProgressStepper steps={mockSteps} currentStep={2} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the responsive stepper with all completed steps', () => {
      const completedSteps = mockSteps.map((step) => ({
        ...step,
        status: 'completed' as const,
      }));
      const { container } = render(<ProgressStepper steps={completedSteps} currentStep={3} />);
      expect(container).toMatchSnapshot();
    });

    it('should render the responsive stepper with all inactive steps', () => {
      const inactiveSteps = mockSteps.map((step) => ({
        ...step,
        status: 'inactive' as const,
      }));
      const { container } = render(<ProgressStepper steps={inactiveSteps} currentStep={0} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      const { container } = render(<ProgressStepperHorizontal steps={[]} currentStep={0} />);
      expect(container).toMatchSnapshot();
    });

    it('should handle currentStep out of bounds', () => {
      const { container } = render(<ProgressStepperHorizontal steps={mockSteps} currentStep={10} />);
      expect(container).toMatchSnapshot();
    });

    it('should handle negative currentStep', () => {
      const { container } = render(<ProgressStepperHorizontal steps={mockSteps} currentStep={-1} />);
      expect(container).toMatchSnapshot();
    });
  });
});
