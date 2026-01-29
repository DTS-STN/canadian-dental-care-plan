import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import type { Step } from '~/components/stepper';
import { Stepper } from '~/components/stepper';

describe('Stepper', () => {
  const defaultSteps: Step[] = [
    { id: '1', label: 'Step 1' },
    { id: '2', label: 'Step 2' },
    { id: '3', label: 'Step 3' },
  ];

  it('renders correctly with active step 1', () => {
    const { container } = render(<Stepper steps={defaultSteps} activeStep={1} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders correctly with active step 2', () => {
    const { container } = render(<Stepper steps={defaultSteps} activeStep={2} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders correctly when all steps are completed', () => {
    const { container } = render(<Stepper steps={defaultSteps} activeStep={-1} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
