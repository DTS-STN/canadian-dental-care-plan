import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import type { IIdleTimerProps } from 'react-idle-timer';
import { useIdleTimer } from 'react-idle-timer';

import { Button } from '~/components/buttons';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export interface SessionTimeoutProps extends Required<Pick<IIdleTimerProps, 'promptBeforeIdle' | 'timeout'>> {
  navigateTo: string;
}

const SessionTimeout = ({ promptBeforeIdle, timeout, navigateTo }: SessionTimeoutProps) => {
  const { t } = useTranslation(i18nNamespaces);
  const [modalOpen, setModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const navigate = useNavigate();

  const handleOnIdle = () => {
    setModalOpen(false);
    navigate(navigateTo);
  };

  const { reset, getRemainingTime } = useIdleTimer({
    onIdle: handleOnIdle,
    onPrompt: () => setModalOpen(true),
    promptBeforeIdle,
    timeout,
  });

  const handleOnIdleContinueSession = useCallback(async () => {
    await fetch('/api/refresh-session');
    setModalOpen(false);
    reset();
  }, [reset]);

  const handleOnDialogOpenChange = useCallback(
    async (open: boolean) => {
      if (!open) {
        await handleOnIdleContinueSession();
      }
    },
    [handleOnIdleContinueSession],
  );

  const tick = useCallback(() => {
    const minutes = Math.floor(getRemainingTime() / 60_000);
    const remainingSeconds = getRemainingTime() % 60_000;
    const seconds = Math.floor(remainingSeconds / 1_000);
    const formattedMinutes = minutes.toString().padStart(1, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    setTimeRemaining(`${formattedMinutes}:${formattedSeconds}`);
  }, [getRemainingTime]);

  useEffect(() => {
    setInterval(tick, 1000);
  }, [tick]);

  return (
    <Dialog open={modalOpen && timeRemaining.length > 0} onOpenChange={handleOnDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('session-timeout.header')}</DialogTitle>
        </DialogHeader>
        {t('session-timeout.description', { timeRemaining })}
        <DialogFooter>
          <Button id="end-session-button" variant="default" size="sm" onClick={handleOnIdle} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:End session now">
            {t('session-timeout.end-session')}
          </Button>
          <Button id="continue-session-button" variant="primary" size="sm" onClick={handleOnIdleContinueSession} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue session">
            {t('session-timeout.continue-session')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeout;
