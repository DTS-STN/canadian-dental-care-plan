import { act, render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KillswitchDialog } from '~/components/killswitch-dialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    /**
     * Implementation of the t() function that will add stringify any options that are passed.
     */
    t: (key?: string | string[], options?: Record<string, unknown>) => {
      const i18nKey = Array.isArray(key) ? key.join('.') : key;
      return options ? JSON.stringify({ key: i18nKey, options }) : i18nKey;
    },
  }),
}));

describe('KillswitchDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render nothing if timeoutSecs is 0', () => {
    render(<KillswitchDialog timeoutSecs={0} />);
    expect(screen.queryByText('killswitch.title')).not.toBeInTheDocument();
  });

  it('should render the dialog if timeoutSecs is greater than 0', () => {
    render(<KillswitchDialog timeoutSecs={600} />);
    expect(screen.queryByText('killswitch.title')).toBeInTheDocument();
  });

  it('should decrement the remaining time every second', () => {
    render(<KillswitchDialog timeoutSecs={300} />);
    expect(screen.queryByText('{"key":"killswitch.remaining-time","options":{"mins":5,"secs":0}}')).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.queryByText('{"key":"killswitch.remaining-time","options":{"mins":4,"secs":59}}')).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.queryByText('{"key":"killswitch.remaining-time","options":{"mins":4,"secs":58}}')).toBeInTheDocument();
  });

  it('should hide the dialog when the timer reaches zero', () => {
    render(<KillswitchDialog timeoutSecs={300} />);
    expect(screen.queryByText('killswitch.title')).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(300_000));
    expect(screen.queryByText('killswitch.title')).not.toBeInTheDocument();
  });
});
