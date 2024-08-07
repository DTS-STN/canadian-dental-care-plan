import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import type { IIdleTimerProps } from 'react-idle-timer';
import { useIdleTimer } from 'react-idle-timer';

import { Button } from '~/components/buttons';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export interface SessionTimeoutProps extends Required<Pick<IIdleTimerProps, 'promptBeforeIdle' | 'timeout'>> {
  onSessionEnd: () => Promise<void> | void;
  onSessionExtend: () => Promise<void> | void;
}

const SessionTimeout = ({ promptBeforeIdle, timeout, onSessionEnd, onSessionExtend }: SessionTimeoutProps) => {
  const { t } = useTranslation(i18nNamespaces);
  const [modalOpen, setModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const { activate, getRemainingTime } = useIdleTimer({
    onIdle: () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      endSession();
    },
    onPrompt: () => {
      setModalOpen(true);
    },
    promptBeforeIdle,
    timeout,
  });

  async function endSession() {
    await onSessionEnd();
    setModalOpen(false);
    activate();
  }

  async function extendSession() {
    await onSessionExtend();
    setModalOpen(false);
    activate();
  }

  async function handleOnDialogOpenChange(open: boolean) {
    if (!open) {
      await extendSession();
    }
  }

  async function handleOnEndSessionButtonClick() {
    await endSession();
  }

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
    <Dialog open={modalOpen} onOpenChange={handleOnDialogOpenChange}>
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
