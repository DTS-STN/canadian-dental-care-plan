import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ProgressStepper } from '~/components/progress-stepper';

describe('ProgressStepper', () => {
  const defaultSteps = [
    { id: 'first-step', label: 'First Step' },
    { id: 'second-step', label: 'Second Step' },
    { id: 'third-step', label: 'Third Step' },
  ];

  it('renders correctly with the first step active', () => {
    const { container } = render(<ProgressStepper steps={defaultSteps} activeStep="first-step" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders correctly with the second step active', () => {
    const { container } = render(<ProgressStepper steps={defaultSteps} activeStep="second-step" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders correctly with the last step active', () => {
    const { container } = render(<ProgressStepper steps={defaultSteps} activeStep="third-step" />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders correctly when all steps are completed (activeStep not found)', () => {
    const { container } = render(<ProgressStepper steps={defaultSteps} activeStep="confirmation" />);
    expect(container).toMatchSnapshot('expected html');
  });
});
