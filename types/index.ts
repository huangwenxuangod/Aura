/**
 * 用户
 */
export interface User {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  credit_balance: number;
  consecutive_successes: number;
  created_at: string;
  updated_at: string;
}

/**
 * 预测状态
 */
export type PredictionStatus = 'ACTIVE' | 'JUDGING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

/**
 * 预测
 */
export interface Prediction {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string;
  stake: number;
  referee_code: string;
  status: PredictionStatus;
  is_recovery: boolean;
  judging_started_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 裁判投票
 */
export type VoteType = 'YES' | 'NO' | null;

/**
 * 裁判
 */
export interface Referee {
  id: string;
  prediction_id: string;
  user_id: string;
  vote: VoteType;
  voted_at: string | null;
  created_at: string;
}

/**
 * 打卡记录
 */
export interface CheckIn {
  id: string;
  prediction_id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

/**
 * 恢复状态
 */
export type RecoveryStatus = 'IN_PROGRESS' | 'RECOVERED' | 'FORFEITED';

/**
 * 恢复记录
 */
export interface Recovery {
  id: string;
  user_id: string;
  original_prediction_id: string;
  original_stake: number;
  success_count: number;
  status: RecoveryStatus;
  created_at: string;
  updated_at: string;
}

/**
 * 交易类型
 */
export type TransactionType = 'RECHARGE' | 'STAKE' | 'REFUND' | 'RECOVERY' | 'FORFEIT';

/**
 * 交易状态
 */
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * 交易记录
 */
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  stripe_payment_intent_id: string | null;
  prediction_id: string | null;
  description: string | null;
  created_at: string;
}
