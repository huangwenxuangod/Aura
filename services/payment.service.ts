import { supabase } from '@/lib/supabase';
import { Linking } from 'react-native';

// Stripe SDK（仅在 Development Build 中可用）
let stripeModule: any = null;

async function initStripe() {
  try {
    stripeModule = await import('@stripe/stripe-react-native');
    await stripeModule.initStripe({
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      merchantIdentifier: 'merchant.com.aura.app',
    });
    return true;
  } catch (error) {
    console.log('Stripe not available (Expo Go)');
    return false;
  }
}

/**
 * 检查 Stripe 是否可用
 */
export async function isStripeAvailable(): Promise<boolean> {
  return await initStripe();
}

/**
 * 创建 Stripe Checkout 会话并处理支付
 */
export async function createStripeCheckout(
  amount: number,
  credits: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const stripeAvailable = await initStripe();

  // 调用 Edge Function 创建 Payment Intent
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      amount: amount * 100, // 转换为分
      credits,
      userId: user.id,
    },
  });

  if (error) throw error;

  const { clientSecret } = data;

  if (stripeAvailable && stripeModule) {
    // 使用原生 Stripe SDK
    const { error: initError } = await stripeModule.initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Aura',
      appearance: {
        colors: {
          primary: '#8B5CF6',
          background: '#18181B',
          componentBackground: '#27272A',
          componentText: '#FFFFFF',
          secondaryText: '#A1A1AA',
          placeholderText: '#71717A',
        },
      },
    });

    if (initError) throw new Error(initError.message);

    const { error: presentError } = await stripeModule.presentPaymentSheet();

    if (presentError) {
      if (presentError.code === 'Canceled') {
        throw new Error('Payment cancelled');
      }
      throw new Error(presentError.message);
    }
  } else {
    // Expo Go 模式：模拟支付成功（仅用于测试）
    throw new Error(
      'Stripe payments require a Development Build.\n\n' +
      'For testing in Expo Go, credits will be added manually via Supabase dashboard.'
    );
  }
}

/**
 * 手动添加测试 Credits（仅用于开发测试）
 */
export async function addTestCredits(amount: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 直接调用 RPC 添加 credits
  const { error } = await supabase.rpc('add_credits', {
    p_user_id: user.id,
    p_amount: amount,
  });

  if (error) throw error;

  // 记录交易
  await supabase.from('credit_transactions').insert({
    user_id: user.id,
    type: 'purchase',
    amount,
    description: 'Test credits (development)',
  });
}

/**
 * 获取交易历史
 */
export async function getTransactions(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}
