import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Prediction, Recovery } from '@/types';

interface UserState {
  // State
  user: User | null;
  currentPrediction: Prediction | null;
  recovery: Recovery | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchCurrentPrediction: () => Promise<void>;
  fetchRecovery: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateCreditBalance: (balance: number) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial State
  user: null,
  currentPrediction: null,
  recovery: null,
  isLoading: false,
  isInitialized: false,

  // Initialize
  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ isLoading: true });
    try {
      await get().fetchUser();
      await get().fetchCurrentPrediction();
      await get().fetchRecovery();
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  // 获取用户信息
  fetchUser: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      set({ user: null });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Failed to fetch user:', error);
      return;
    }

    set({ user: data as User });
  },

  // 获取当前预测
  fetchCurrentPrediction: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      set({ currentPrediction: null });
      return;
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', authUser.id)
      .in('status', ['ACTIVE', 'JUDGING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch current prediction:', error);
      set({ currentPrediction: null });
      return;
    }

    set({ currentPrediction: data as Prediction | null });
  },

  // 获取恢复状态
  fetchRecovery: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      set({ recovery: null });
      return;
    }

    const { data, error } = await supabase
      .from('recoveries')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('status', 'IN_PROGRESS')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch recovery:', error);
      set({ recovery: null });
      return;
    }

    set({ recovery: data as Recovery | null });
  },

  // 设置用户
  setUser: (user) => set({ user }),

  // 更新余额
  updateCreditBalance: (balance) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, credit_balance: balance } });
  },

  // 重置状态
  reset: () => set({
    user: null,
    currentPrediction: null,
    recovery: null,
    isLoading: false,
    isInitialized: false,
  }),
}));
