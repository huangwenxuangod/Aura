import { useState, useEffect } from 'react';
import { getTimeRemaining, padZero } from '@/lib/utils';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
  formatted: string;
}

/**
 * 倒计时 Hook
 * 格式: 2天 14:32:18
 */
export function useCountdown(deadline: Date | string | null): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>(() => {
    if (!deadline) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isExpired: true,
        formatted: '已截止',
      };
    }
    const result = getTimeRemaining(deadline);
    return {
      ...result,
      formatted: formatTime(result),
    };
  });

  useEffect(() => {
    if (!deadline) return;

    const timer = setInterval(() => {
      const result = getTimeRemaining(deadline);
      setTimeLeft({
        ...result,
        formatted: formatTime(result),
      });

      if (result.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  return timeLeft;
}

function formatTime(time: ReturnType<typeof getTimeRemaining>): string {
  if (time.isExpired) {
    return '已截止';
  }

  const timeStr = `${padZero(time.hours)}:${padZero(time.minutes)}:${padZero(time.seconds)}`;

  if (time.days > 0) {
    return `${time.days}天 ${timeStr}`;
  }

  return timeStr;
}
