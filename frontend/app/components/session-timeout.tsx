import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import type { IIdleTimerProps } from 'react-idle-timer';
import { useIdleTimer } from 'react-idle-timer';

import { Button } from '~/components/buttons';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { getClientEnv } from '~/utils/env-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export interface SessionTimeoutProps extends Pick<IIdleTimerProps, 'promptBeforeIdle'>, Pick<IIdleTimerProps, 'timeout'> {}

const SessionTimeout = ({ promptBeforeIdle, timeout }: SessionTimeoutProps) => {
  const { t } = useTranslation(i18nNamespaces);
  const [modalOpen, setModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const { SESSION_TIMEOUT_SECONDS: timeoutParam } = getClientEnv();
  const { SESSION_TIMEOUT_PROMPT_SECONDS: timeoutPromptParam } = getClientEnv();
  const navigate = useNavigate();

  const handleOnIdle = () => {
    setModalOpen(false);
    navigate('/auth/logout');
  };

  const { reset, getRemainingTime } = useIdleTimer({
    onIdle: handleOnIdle,
    onPrompt: () => setModalOpen(true),
    promptBeforeIdle: promptBeforeIdle ?? timeoutPromptParam * 1000,
    timeout: timeout ?? timeoutParam * 1000,
  });

  const handleOnIdleContinueSession = async () => {
    await fetch('/api/refresh-session');
    setModalOpen(false);
    reset();
  };

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
    <div>
      <Dialog open={modalOpen && timeRemaining.length > 0}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('session-timeout.header')}</DialogTitle>
          </DialogHeader>
          {t('session-timeout.description', { timeRemaining })}
          <DialogFooter>
            <Button id="end-session-button" variant="default" size="sm" onClick={handleOnIdle}>
              {t('session-timeout.end-session')}
            </Button>
            <Button id="continue-session-button" variant="primary" size="sm" onClick={handleOnIdleContinueSession}>
              {t('session-timeout.continue-session')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p>{Math.ceil(getRemainingTime() / 1000)} seconds remaining</p>
    </div>
  );
};

export default SessionTimeout;
