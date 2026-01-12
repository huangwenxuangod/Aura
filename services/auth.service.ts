import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

// Google Sign-In 配置（仅在 Development Build 中可用）
let GoogleSignin: any = null;

async function initGoogleSignIn() {
  try {
    const module = await import('@react-native-google-signin/google-signin');
    GoogleSignin = module.GoogleSignin;
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
    return true;
  } catch (error) {
    console.log('Google Sign-In not available (Expo Go)');
    return false;
  }
}

/**
 * Google 登录（仅 Development Build）
 */
export async function signInWithGoogle(): Promise<User | null> {
  const available = await initGoogleSignIn();
  
  if (!available || !GoogleSignin) {
    throw new Error('Google Sign-In is not available in Expo Go. Please use Email login.');
  }

  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.idToken) {
      throw new Error('No ID token returned from Google');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: userInfo.idToken,
    });

    if (error) throw error;
    
    if (data.user) {
      await ensureUserExists(data.user.id, {
        email: data.user.email,
        display_name: userInfo.user.name || undefined,
        avatar_url: userInfo.user.photo || undefined,
      });
    }

    return await getCurrentUser();
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * 邮箱密码注册
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    await ensureUserExists(data.user.id, {
      email: data.user.email,
      display_name: displayName,
    });
  }

  return await getCurrentUser();
}

/**
 * 邮箱密码登录
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return await getCurrentUser();
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  // 清除 Google 登录状态
  if (GoogleSignin) {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // 忽略 Google 登出错误
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('Failed to get user:', error);
    return null;
  }

  return data as User;
}

/**
 * 确保用户记录存在
 */
async function ensureUserExists(
  userId: string,
  userData: {
    email?: string | null;
    display_name?: string;
    avatar_url?: string;
  }
): Promise<void> {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingUser) {
    const { error } = await supabase.from('users').insert({
      id: userId,
      email: userData.email,
      display_name: userData.display_name || `User_${userId.slice(0, 8)}`,
      avatar_url: userData.avatar_url,
      credit_balance: 0,
      consecutive_successes: 0,
    });

    if (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }
}

/**
 * 重置密码
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

/**
 * 检查是否支持 Google 登录
 */
export async function isGoogleSignInAvailable(): Promise<boolean> {
  return await initGoogleSignIn();
}
