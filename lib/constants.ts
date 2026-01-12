import { Region } from './region';

/**
 * 充值档位 - 国际版 (USD)
 */
export const RECHARGE_TIERS_INTL = [
  { price: 1, credits: 10, bonus: 0 },      // $1 = 10 credits
  { price: 10, credits: 150, bonus: 50 },   // $10 = 150 credits (+50% bonus)
  { price: 100, credits: 2000, bonus: 1000 }, // $100 = 2000 credits (+100% bonus)
];

/**
 * 充值档位 - 国内版 (CNY)
 */
export const RECHARGE_TIERS_CN = [
  { price: 6, credits: 6, bonus: 0 },       // ¥6 = 6 credits
  { price: 68, credits: 100, bonus: 32 },   // ¥68 = 100 credits (+47% bonus)
  { price: 648, credits: 1300, bonus: 652 }, // ¥648 = 1300 credits (+100% bonus)
];

/**
 * 根据区域获取充值档位
 */
export function getRechargeTiers(region: Region) {
  return region === 'CN' ? RECHARGE_TIERS_CN : RECHARGE_TIERS_INTL;
}

/**
 * 兼容旧代码
 */
export const RECHARGE_TIERS = RECHARGE_TIERS_INTL;

/**
 * 押注限制
 */
export const STAKE = {
  MIN: 10,
  MAX: 10000,
  DEFAULT: 100,
};

/**
 * 超时设置
 */
export const TIMEOUT = {
  CANCEL_WINDOW: 5 * 60 * 1000, // 5分钟取消窗口
  JUDGING_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时投票超时
  POLLING_INTERVAL: 30 * 1000, // 30秒轮询间隔
};

/**
 * 快捷截止时间选项
 */
export const QUICK_DEADLINES = {
  ONE_DAY: 1,
  SEVEN_DAYS: 7,
  ONE_MONTH: 30,
};

/**
 * 恢复模式
 */
export const RECOVERY = {
  REQUIRED_SUCCESSES: 2, // 需要连续成功2次才能恢复
};

/**
 * 汇率
 */
export const EXCHANGE_RATE = {
  USD_TO_CREDITS: 10, // $1 = 10 credits
  CNY_TO_CREDITS: 1,  // ¥1 = 1 credit
};

/**
 * 验证规则
 */
export const VALIDATION = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CHECK_IN_MAX_LENGTH: 500,
};
