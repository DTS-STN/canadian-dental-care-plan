import { useEffect, useState } from 'react';

import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';

type KillswitchProps = {
  /**
   * How long the killswitch should be visible for.
   */
  timeout: number;
};

export function Killswitch({ timeout }: KillswitchProps) {
  const [remainingTime, setRemainingTime] = useState(timeout);
  const { t } = useTranslation(['common']);

  const hasTimeRemaining = remainingTime > 0;

  useEffect(() => {
    if (hasTimeRemaining) {
      const timerId = globalThis.setInterval(() => {
        setRemainingTime((prevTime) => prevTime - 1);
      }, 1000);

      // clear the timer when the component unmounts (or when the timeout changes)
      return () => globalThis.clearInterval(timerId);
    }
  }, [hasTimeRemaining, timeout]);

  if (hasTimeRemaining) {
    const { mins, secs } = formatTime(remainingTime);

    return (
      <Dialog open={true}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              <FontAwesomeIcon icon={faExclamationTriangle} className="inline" />
              <span> {t('killswitch.title')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p>{t('killswitch.overloaded')}</p>
            <p>{t('killswitch.dont-worry-be-happy')}</p>
          </div>
          <DialogFooter>{t('killswitch.remaining-time', { mins, secs })}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}

function formatTime(totalSeconds: number) {
  const time = totalSeconds < 0 ? 0 : totalSeconds;
  return { mins: Math.floor(time / 60), secs: time % 60 };
}
