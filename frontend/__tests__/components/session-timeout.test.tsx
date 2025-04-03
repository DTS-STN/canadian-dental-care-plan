import { act, fireEvent, render, screen } from '@testing-library/react';

import { createRoutesStub } from 'react-router';

import { useTranslation } from 'react-i18next';
import { useIdleTimer } from 'react-idle-timer';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionTimeoutProps } from '~/components/session-timeout';
import SessionTimeout from '~/components/session-timeout';

vi.mock('react-idle-timer');

describe('SessionTimeout', () => {
  const mockActivate = vi.fn();
  const mockIsPrompted = vi.fn();
  const mockGetRemainingTime = vi.fn();

  beforeEach(() => {
    (useIdleTimer as Mock).mockReturnValue({
      activate: mockActivate,
      isPrompted: mockIsPrompted,
      getRemainingTime: mockGetRemainingTime,
    });

    (useTranslation as Mock).mockReturnValue({
      t: (key: string, options?: { [key: string]: string | number }) => key + (options ? JSON.stringify(options) : ''),
    });
  });

  const setup = (props: Partial<SessionTimeoutProps> = {}) => {
    const defaultProps = {
      promptBeforeIdle: 30000,
      timeout: 60000,
      onSessionEnd: vi.fn(),
      onSessionExtend: vi.fn(),
    };

    const RoutesStub = createRoutesStub([
      {
        Component: () => <SessionTimeout {...defaultProps} {...props} />,
        path: '/',
      },
    ]);

    return render(<RoutesStub />);
  };

  it('should render the session timeout dialog when prompted', () => {
    mockIsPrompted.mockReturnValue(true);

    setup();

    expect(screen.getByText('session-timeout.header')).toBeInTheDocument();
    expect(screen.getByText('session-timeout.end-session')).toBeInTheDocument();
    expect(screen.getByText('session-timeout.continue-session')).toBeInTheDocument();
  });

  it('should call `onSessionEnd` when the "End Session" button is clicked', () => {
    const onSessionEnd = vi.fn();
    mockIsPrompted.mockReturnValue(true);

    setup({ onSessionEnd });

    const endSessionButton = screen.getByText('session-timeout.end-session');

    act(() => {
      fireEvent.click(endSessionButton);
    });

    expect(onSessionEnd).toHaveBeenCalled();
  });

  it('should call `onSessionExtend` when the "Continue Session" button is clicked', () => {
    const onSessionExtend = vi.fn();
    mockIsPrompted.mockReturnValue(true);

    setup({ onSessionExtend });

    const continueSessionButton = screen.getByText('session-timeout.continue-session');

    act(() => {
      fireEvent.click(continueSessionButton);
    });

    expect(onSessionExtend).toHaveBeenCalled();
  });

  it('should activate the IdleTimer on location change', () => {
    mockIsPrompted.mockReturnValue(false);

    setup();

    expect(mockActivate).toHaveBeenCalled();
  });

  it('should update the remaining time every second', () => {
    mockIsPrompted.mockReturnValue(true);
    mockGetRemainingTime.mockReturnValue(50000);

    vi.useFakeTimers({ shouldAdvanceTime: true });

    setup();

    expect(screen.getByText(`session-timeout.description{"timeRemaining":"0:50"}`)).toBeInTheDocument();

    act(() => {
      mockGetRemainingTime.mockReturnValue(49000);
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(`session-timeout.description{"timeRemaining":"0:49"}`)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
