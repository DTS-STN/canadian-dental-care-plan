import { useEffect, useState } from 'react';

import { useFetchers, useLocation, useNavigation } from 'react-router';

import { useTranslation } from 'react-i18next';
import type { IIdleTimerProps } from 'react-idle-timer';
import { useIdleTimer } from 'react-idle-timer';

import { Button } from '~/components/buttons';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export interface SessionTimeoutProps extends Required<Pick<IIdleTimerProps, 'promptBeforeIdle' | 'timeout'>> {
  /**
   * Function to call when the session end is triggered.
   */
  onSessionEnd: () => Promise<void> | void;

  /**
   * Function to call when the session extend is triggered.
   */
  onSessionExtend: () => Promise<void> | void;
}

/**
 * SessionTimeout component to handle user session timeout prompts.
 * This component uses the `react-IdleTimer` library to manage idle time and prompt the user
 * before the session expires. It integrates with Remix's to activate the IdleTimer on route changes,
 * fetcher submissions, and form submissions.
 */
const SessionTimeout = ({ promptBeforeIdle, timeout, onSessionEnd, onSessionExtend }: SessionTimeoutProps) => {
  const { t } = useTranslation(i18nNamespaces);
  const [timeRemaining, setTimeRemaining] = useState('');

  const { activate, isPrompted, getRemainingTime } = useIdleTimer({
    // Disable default event listeners; The IdleTimer should only activate during route navigation and form
    // submissions, as these actions will interact with the session and extend its lifespan.
    events: [],
    onIdle: () => {
      // Trigger the session end function when the user becomes idle.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      endSession();
    },
    promptBeforeIdle,
    timeout,
  });

  // Track the current location and its key for detecting navigation changes.
  const location = useLocation();
  const locationKey = location.key;

  useEffect(() => {
    // Activate the IdleTimer whenever the location changes (indicating a route navigation).
    activate();
  }, [locationKey, activate]);

  // Track fetcher states to activate the IdleTimer during submissions.
  const fetchers = useFetchers();
  const fetcherSubmitting = fetchers.filter(({ state }) => state === 'submitting').length > 0;

  useEffect(() => {
    // Activate the IdleTimer if any fetcher is submitting.
    if (fetcherSubmitting) {
      activate();
    }
  }, [fetcherSubmitting, activate]);

  // Track Remix's <Form> submission state to activate the IdleTimer during <Form> submissions.
  const navigation = useNavigation();
  const formSubmitting = navigation.state === 'submitting';

  useEffect(() => {
    // Activate the IdleTimer if a <Form> is submitting.
    if (formSubmitting) {
      activate();
    }
  }, [formSubmitting, activate]);

  /**
   * Function to end the session.
   */
  async function endSession() {
    await onSessionEnd();
  }

  /**
   * Function to extend the session.
   */
  async function extendSession() {
    await onSessionExtend();
  }

  /**
   * Handler for when the dialog open state changes.
   * If the dialog is closed, the session is extended.
   */
  async function handleOnDialogOpenChange(open: boolean) {
    if (!open) {
      await extendSession();
    }
  }

  /**
   * Handler for when the "End Session" button is clicked.
   */
  async function handleOnEndSessionButtonClick() {
    await endSession();
  }

  /**
   * Handler for when the "Continue Session" button is clicked.
   */
  async function handleOnExtendSessionButtonClick() {
    await extendSession();
  }

  useEffect(() => {
    const updateRemainingTime = () => {
      const remainingTime = getRemainingTime();
      const minutes = Math.floor(remainingTime / 60_000);
      const seconds = Math.floor((remainingTime % 60_000) / 1_000);
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
    };

    const interval = setInterval(updateRemainingTime, 1000);
    updateRemainingTime(); // Initial call to set the time immediately

    return () => {
      clearInterval(interval);
    };
  }, [getRemainingTime]);

  return (
    <Dialog open={isPrompted()} onOpenChange={handleOnDialogOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('session-timeout.header')}</DialogTitle>
        </DialogHeader>
        {t('session-timeout.description', { timeRemaining })}
        <DialogFooter>
          <Button id="end-session-button" variant="default" size="sm" onClick={handleOnEndSessionButtonClick} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:End session now">
            {t('session-timeout.end-session')}
          </Button>
          <Button id="continue-session-button" variant="primary" size="sm" onClick={handleOnExtendSessionButtonClick} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue session">
            {t('session-timeout.continue-session')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeout;
