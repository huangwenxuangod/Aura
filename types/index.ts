/**
 * Aura 2.0 类型定义
 * 适配新的打卡点激励系统
 */

// ============================================
// 用户相关
// ============================================

/**
 * 用户资料 (对应 user_profiles 表)
 */
export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// 预测相关
// ============================================

/**
 * 预测状态
 */
export type PredictionStatus = 'active' | 'judging' | 'settled';

/**
 * 预测 (对应 predictions 表)
 */
export interface Prediction {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  
  // 时间设置
  start_date: string;
  deadline: string;
  
  // 金额分配 (50:50)
  total_stake: number;
  checkin_reward: number;    // 打卡奖励总额
  result_reward: number;     // 结果奖励总额
  
  // 打卡点设置
  checkin_point_count: number;
  
  // 裁判系统
  referee_code: string;
  
  // 状态
  status: PredictionStatus;
  
  // 结算结果
  earned_checkin_reward: number;
  earned_result_reward: number;
  final_result: 'success' | 'failure' | null;
  settled_at: string | null;
  
  created_at: string;
  updated_at: string;
  
  // 关联数据（可选，join 时填充）
  checkin_points?: CheckinPoint[];
  checkins?: Checkin[];
  referees?: Referee[];
}

// ============================================
// 打卡点相关
// ============================================

/**
 * 打卡点状态
 */
export type CheckinPointStatus = 'pending' | 'completed' | 'missed';

/**
 * 打卡点 (对应 checkin_points 表)
 */
export interface CheckinPoint {
  id: string;
  prediction_id: string;
  point_index: number;       // 第几个打卡点
  due_date: string;          // 截止日期
  reward_amount: number;     // 该点的奖励（边际递减）
  status: CheckinPointStatus;
  completed_at: string | null;
  created_at: string;
}

// ============================================
// 打卡记录相关
// ============================================

/**
 * 打卡记录 (对应 checkins 表)
 */
export interface Checkin {
  id: string;
  prediction_id: string;
  user_id: string;
  content: string;           // 打卡内容（最少10字）
  image_url: string | null;  // 可选图片
  checkin_point_id: string | null;  // 关联的打卡点
  created_at: string;
}

/**
 * 创建打卡的参数
 */
export interface CreateCheckinParams {
  prediction_id: string;
  content: string;
  image_url?: string;
  checkin_point_id?: string;  // 如果是完成打卡点
}

// ============================================
// 裁判相关
// ============================================

/**
 * 裁判投票
 */
export type RefereeVote = 'success' | 'failure' | null;

/**
 * 裁判 (对应 referees 表)
 */
export interface Referee {
  id: string;
  prediction_id: string;
  user_id: string;
  vote: RefereeVote;
  comment: string | null;
  voted_at: string | null;
  created_at: string;
  
  // 关联数据
  user?: User;
}

// ============================================
// 交易相关
// ============================================

/**
 * 交易类型
 */
export type CreditTransactionType = 
  | 'stake'           // 押注扣除
  | 'checkin_reward'  // 打卡奖励
  | 'result_reward'   // 结果奖励
  | 'purchase'        // 购买积分
  | 'forfeit';        // 损失

/**
 * 积分交易记录 (对应 credit_transactions 表)
 */
export interface CreditTransaction {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;            // 正数=获得，负数=扣除
  prediction_id: string | null;
  description: string | null;
  created_at: string;
}

// ============================================
// 创建预测参数
// ============================================

/**
 * 创建预测的参数
 */
export interface CreatePredictionParams {
  title: string;
  description?: string;
  deadline: Date;
  total_stake: number;
  checkin_point_count: number;  // 打卡点数量
}

// ============================================
// 工具类型
// ============================================

/**
 * 预测详情（包含所有关联数据）
 */
export interface PredictionDetail extends Prediction {
  checkin_points: CheckinPoint[];
  checkins: Checkin[];
  referees: Referee[];
  user?: User;
}

/**
 * 打卡点进度信息
 */
export interface CheckinProgress {
  total: number;             // 总打卡点数
  completed: number;         // 已完成
  missed: number;            // 已错过
  pending: number;           // 待完成
  earnedReward: number;      // 已获得奖励
  lostReward: number;        // 已损失奖励
  nextPoint: CheckinPoint | null;  // 下一个待完成的打卡点
}
