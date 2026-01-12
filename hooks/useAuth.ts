import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import type { Session } from '@supabase/supabase-js';

/**
 * 认证状态 Hook
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { initialize, reset } = useUserStore();

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        initialize();
      }
      setIsLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          await initialize();
        } else if (event === 'SIGNED_OUT') {
          reset();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialize, reset]);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    user: session?.user,
  };
}

/**
 * 路由保护 Hook
 */
export function useProtectedRoute() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRefereeGroup = segments[0] === 'referee';
    
    // 裁判页面允许未登录访问（会引导登录）
    if (inRefereeGroup) return;
    
    if (!session && !inAuthGroup) {
      // 未登录且不在认证页面，跳转到登录
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // 已登录但在认证页面，跳转到首页
      router.replace('/');
    }
  }, [session, segments, isLoading, router]);

  return { isLoading };
}
