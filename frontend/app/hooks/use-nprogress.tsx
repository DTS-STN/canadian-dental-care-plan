import { useNavigation, useFetchers } from 'react-router';
import { useEffect, useRef } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function useNProgress(delay: number = 300) {
  const navigation = useNavigation();
  const fetchers = useFetchers();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef = useRef(false);

  // Configure NProgress once per hook instance
  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      // You can add more options here like minimum, easing, speed, etc.
    });
  }, []);

  useEffect(() => {
    const fetchersIdle = fetchers.every((f) => f.state === 'idle');

    if (navigation.state === 'idle' && fetchersIdle) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (startedRef.current) {
        NProgress.done();
        startedRef.current = false;
      }
    } else {
      timerRef.current ??= setTimeout(() => {
        NProgress.start();
        startedRef.current = true;
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [navigation.state, fetchers, delay]);

  // Also cleanup on unmount
  useEffect(() => {
    return () => {
      NProgress.done();
    };
  }, []);
}
