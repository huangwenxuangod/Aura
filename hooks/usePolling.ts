import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { TIMEOUT } from '@/lib/constants';

/**
 * 轮询 Hook
 * 在 App 活跃时定时执行回调
 */
export function usePolling(
  callback: () => void | Promise<void>,
  interval: number = TIMEOUT.POLLING_INTERVAL,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  const appState = useRef(AppState.currentState);

  // 保存最新的 callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: NodeJS.Timeout | null = null;

    const tick = () => {
      if (appState.current === 'active') {
        savedCallback.current();
      }
    };

    // 立即执行一次
    tick();

    // 设置定时器
    timer = setInterval(tick, interval);

    // 监听 App 状态变化
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App 从后台回到前台，立即执行一次
        tick();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (timer) clearInterval(timer);
      subscription.remove();
    };
  }, [interval, enabled]);
}

/**
 * 手动刷新 Hook
 */
export function useRefresh(callback: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await callback();
    } finally {
      setIsRefreshing(false);
    }
  }, [callback]);

  return { isRefreshing, onRefresh };
}
