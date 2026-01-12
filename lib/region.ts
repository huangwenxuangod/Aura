import AsyncStorage from '@react-native-async-storage/async-storage';

export type Region = 'CN' | 'INTL';

export interface RegionConfig {
  region: Region;
  language: 'zh' | 'en';
  currency: '¥' | '$';
  currencyCode: 'CNY' | 'USD';
  brandName: string;
  authMethods: ('google' | 'email' | 'wechat' | 'phone')[];
  paymentMethods: ('stripe' | 'wechat_pay')[];
  creditsPerUnit: number; // 1单位货币 = 多少 credits
}

// 区域配置
export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  CN: {
    region: 'CN',
    language: 'zh',
    currency: '¥',
    currencyCode: 'CNY',
    brandName: '诺值',
    authMethods: ['wechat', 'phone'],
    paymentMethods: ['wechat_pay'],
    creditsPerUnit: 1, // ¥1 = 1 credit
  },
  INTL: {
    region: 'INTL',
    language: 'en',
    currency: '$',
    currencyCode: 'USD',
    brandName: 'Aura',
    authMethods: ['google', 'email'],
    paymentMethods: ['stripe'],
    creditsPerUnit: 10, // $1 = 10 credits
  },
};

const REGION_STORAGE_KEY = 'user_region';
const REGION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

interface CachedRegion {
  region: Region;
  timestamp: number;
}

/**
 * 通过 IP 检测用户区域
 */
export async function detectRegion(): Promise<Region> {
  try {
    // 先检查缓存
    const cached = await getCachedRegion();
    if (cached) {
      return cached;
    }

    // 调用 IP 检测 API
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('IP detection failed');
    }

    const data = await response.json();
    const countryCode = data.country_code;

    // 判断是否为中国
    const region: Region = countryCode === 'CN' ? 'CN' : 'INTL';

    // 缓存结果
    await cacheRegion(region);

    return region;
  } catch (error) {
    console.error('Region detection error:', error);
    // 默认返回国际版
    return 'INTL';
  }
}

/**
 * 获取缓存的区域
 */
async function getCachedRegion(): Promise<Region | null> {
  try {
    const cached = await AsyncStorage.getItem(REGION_STORAGE_KEY);
    if (!cached) return null;

    const { region, timestamp }: CachedRegion = JSON.parse(cached);
    
    // 检查是否过期
    if (Date.now() - timestamp > REGION_CACHE_DURATION) {
      return null;
    }

    return region;
  } catch {
    return null;
  }
}

/**
 * 缓存区域
 */
async function cacheRegion(region: Region): Promise<void> {
  try {
    const data: CachedRegion = {
      region,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache region:', error);
  }
}

/**
 * 手动设置区域（用于测试或用户手动切换）
 */
export async function setRegion(region: Region): Promise<void> {
  await cacheRegion(region);
}

/**
 * 清除区域缓存
 */
export async function clearRegionCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REGION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear region cache:', error);
  }
}

/**
 * 获取区域配置
 */
export function getRegionConfig(region: Region): RegionConfig {
  return REGION_CONFIGS[region];
}

/**
 * 格式化价格
 */
export function formatPrice(amount: number, region: Region): string {
  const config = REGION_CONFIGS[region];
  return `${config.currency}${amount}`;
}

/**
 * 计算 Credits
 */
export function calculateCredits(amount: number, region: Region): number {
  const config = REGION_CONFIGS[region];
  return amount * config.creditsPerUnit;
}
