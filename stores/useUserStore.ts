import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateCredits: (credits: number) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial State
  user: null,
  isLoading: false,
  isInitialized: false,

  // Initialize
  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ isLoading: true });
    try {
      await get().fetchUser();
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  // 获取用户信息（如果不存在则自动创建）
  fetchUser: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      set({ user: null });
      return;
    }

    // 使用 maybeSingle 避免空结果报错
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch user:', error);
      set({ user: null });
      return;
    }

    // 如果用户 profile 不存在，自动创建
    if (!data) {
      const newUser = {
        id: authUser.id,
        email: authUser.email || null,
        display_name: authUser.user_metadata?.name || 
                      authUser.email?.split('@')[0] || 
                      `User_${authUser.id.substring(0, 8)}`,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        credits: 1000, // 默认积分
      };

      const { data: createdUser, error: createError } = await supabase
        .from('user_profiles')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError);
        set({ user: null });
        return;
      }

      set({ user: createdUser as User });
      return;
    }

    set({ user: data as User });
  },

  // 设置用户
  setUser: (user) => set({ user }),

  // 更新积分
  updateCredits: (credits) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, credits } });
  },

  // 重置状态
  reset: () => set({
    user: null,
    isLoading: false,
    isInitialized: false,
  }),
}));
