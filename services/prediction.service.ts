import { supabase } from '@/lib/supabase';
import type { 
  Prediction, 
  PredictionDetail,
  CheckinPoint, 
  Checkin, 
  Referee,
  CreatePredictionParams,
  CreateCheckinParams,
  CheckinProgress,
} from '@/types';
import { nanoid } from 'nanoid/non-secure';

// ============================================
// 预测管理
// ============================================

/**
 * 创建预测（会自动生成打卡点）
 */
export async function createPrediction(params: CreatePredictionParams): Promise<Prediction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 计算奖励分配 (50:50)
  const checkinReward = Math.floor(params.total_stake / 2);
  const resultReward = params.total_stake - checkinReward;

  // 生成监督码
  const refereeCode = nanoid(8).toUpperCase();

  // 创建预测（触发器会自动生成打卡点）
  const { data, error } = await supabase
    .from('predictions')
    .insert({
      user_id: user.id,
      title: params.title,
      description: params.description || null,
      start_date: new Date().toISOString().split('T')[0],
      deadline: params.deadline.toISOString().split('T')[0],
      total_stake: params.total_stake,
      checkin_reward: checkinReward,
      result_reward: resultReward,
      checkin_point_count: params.checkin_point_count,
      referee_code: refereeCode,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  // 扣除用户积分
  const { error: deductError } = await supabase
    .from('user_profiles')
    .update({ 
      credits: supabase.rpc('', {}), // 使用 SQL 直接减
    })
    .eq('id', user.id);

  // 直接执行扣款
  const { error: creditError } = await supabase.rpc('deduct_user_credits', {
    p_user_id: user.id,
    p_amount: params.total_stake,
    p_prediction_id: data.id,
  });

  if (creditError) {
    // 回滚：删除预测
    await supabase.from('predictions').delete().eq('id', data.id);
    throw new Error('Insufficient credits');
  }

  return data as Prediction;
}

/**
 * 获取预测详情（包含打卡点、打卡记录、裁判）
 */
export async function getPredictionDetail(predictionId: string): Promise<PredictionDetail | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      checkin_points (
        id, point_index, due_date, reward_amount, status, completed_at, created_at
      ),
      checkins (
        id, content, image_url, checkin_point_id, created_at
      ),
      referees (
        id, user_id, vote, comment, voted_at, created_at,
        user:user_profiles (id, display_name, avatar_url)
      )
    `)
    .eq('id', predictionId)
    .single();

  if (error) {
    console.error('Failed to get prediction detail:', error);
    return null;
  }

  return data as PredictionDetail;
}

/**
 * 获取用户当前进行中的预测
 */
export async function getCurrentPrediction(): Promise<PredictionDetail | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      checkin_points (
        id, point_index, due_date, reward_amount, status, completed_at, created_at
      ),
      checkins (
        id, content, image_url, checkin_point_id, created_at
      ),
      referees (
        id, user_id, vote, comment, voted_at, created_at
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'judging'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to get current prediction:', error);
    return null;
  }

  return data as PredictionDetail | null;
}

/**
 * 获取用户的预测历史
 */
export async function getUserPredictions(): Promise<Prediction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get user predictions:', error);
    return [];
  }

  return data as Prediction[];
}

/**
 * 通过监督码获取预测
 */
export async function getPredictionByRefereeCode(code: string): Promise<PredictionDetail | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      checkin_points (
        id, point_index, due_date, reward_amount, status, completed_at
      ),
      checkins (
        id, content, image_url, checkin_point_id, created_at
      ),
      referees (
        id, user_id, vote, comment, voted_at
      ),
      user:user_profiles!predictions_user_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .eq('referee_code', code.toUpperCase())
    .single();

  if (error) {
    console.error('Failed to get prediction by referee code:', error);
    return null;
  }

  return data as PredictionDetail;
}

// ============================================
// 打卡点管理
// ============================================

/**
 * 获取预测的打卡点列表
 */
export async function getCheckinPoints(predictionId: string): Promise<CheckinPoint[]> {
  const { data, error } = await supabase
    .from('checkin_points')
    .select('*')
    .eq('prediction_id', predictionId)
    .order('point_index', { ascending: true });

  if (error) {
    console.error('Failed to get checkin points:', error);
    return [];
  }

  return data as CheckinPoint[];
}

/**
 * 计算打卡进度
 */
export function calculateCheckinProgress(points: CheckinPoint[]): CheckinProgress {
  const total = points.length;
  const completed = points.filter(p => p.status === 'completed').length;
  const missed = points.filter(p => p.status === 'missed').length;
  const pending = points.filter(p => p.status === 'pending').length;
  
  const earnedReward = points
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.reward_amount, 0);
  
  const lostReward = points
    .filter(p => p.status === 'missed')
    .reduce((sum, p) => sum + p.reward_amount, 0);
  
  // 找到下一个待完成的打卡点（按日期排序）
  const nextPoint = points
    .filter(p => p.status === 'pending')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] || null;

  return {
    total,
    completed,
    missed,
    pending,
    earnedReward,
    lostReward,
    nextPoint,
  };
}

/**
 * 检查今天是否有需要完成的打卡点
 */
export function getTodayCheckinPoint(points: CheckinPoint[]): CheckinPoint | null {
  const today = new Date().toISOString().split('T')[0];
  return points.find(p => p.due_date === today && p.status === 'pending') || null;
}

// ============================================
// 打卡记录管理
// ============================================

/**
 * 创建打卡（如果指定打卡点，会完成该打卡点）
 */
export async function createCheckin(params: CreateCheckinParams): Promise<Checkin> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 验证内容长度
  if (params.content.length < 10) {
    throw new Error('Checkin content must be at least 10 characters');
  }

  // 创建打卡记录
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      prediction_id: params.prediction_id,
      user_id: user.id,
      content: params.content,
      image_url: params.image_url || null,
      checkin_point_id: params.checkin_point_id || null,
    })
    .select()
    .single();

  if (error) throw error;

  // 如果指定了打卡点，更新打卡点状态
  if (params.checkin_point_id) {
    const { error: pointError } = await supabase
      .from('checkin_points')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.checkin_point_id)
      .eq('status', 'pending');  // 只更新待完成的

    if (pointError) {
      console.error('Failed to complete checkin point:', pointError);
    }
  }

  return data as Checkin;
}

/**
 * 获取预测的所有打卡记录
 */
export async function getCheckins(predictionId: string): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('prediction_id', predictionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get checkins:', error);
    return [];
  }

  return data as Checkin[];
}

/**
 * 上传打卡图片
 */
export async function uploadCheckinImage(
  predictionId: string,
  imageUri: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileName = `${user.id}/${predictionId}/${Date.now()}.jpg`;

  // 读取图片
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('checkins')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
    });

  if (error) throw error;

  // 获取公开URL
  const { data: urlData } = supabase.storage
    .from('checkins')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ============================================
// 裁判管理
// ============================================

/**
 * 获取预测的裁判列表
 */
export async function getReferees(predictionId: string): Promise<Referee[]> {
  const { data, error } = await supabase
    .from('referees')
    .select(`
      *,
      user:user_profiles (id, display_name, avatar_url)
    `)
    .eq('prediction_id', predictionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get referees:', error);
    return [];
  }

  return data as Referee[];
}

/**
 * 加入成为裁判
 */
export async function joinAsReferee(predictionId: string): Promise<Referee> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 检查是否已经是裁判
  const { data: existing } = await supabase
    .from('referees')
    .select('id')
    .eq('prediction_id', predictionId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    throw new Error('You are already a referee for this prediction');
  }

  // 检查是否是预测创建者
  const { data: prediction } = await supabase
    .from('predictions')
    .select('user_id')
    .eq('id', predictionId)
    .single();

  if (prediction?.user_id === user.id) {
    throw new Error('You cannot be a referee for your own prediction');
  }

  const { data, error } = await supabase
    .from('referees')
    .insert({
      prediction_id: predictionId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Referee;
}

/**
 * 裁判投票
 */
export async function submitVote(
  predictionId: string, 
  vote: 'success' | 'failure',
  comment?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('referees')
    .update({
      vote,
      comment: comment || null,
      voted_at: new Date().toISOString(),
    })
    .eq('prediction_id', predictionId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ============================================
// 状态管理
// ============================================

/**
 * 触发评审（用户主动或到期）
 */
export async function triggerJudging(predictionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('predictions')
    .update({
      status: 'judging',
      updated_at: new Date().toISOString(),
    })
    .eq('id', predictionId)
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) throw error;
}

/**
 * 取消预测（5分钟内）
 */
export async function cancelPrediction(predictionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 获取预测
  const { data: prediction, error: fetchError } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', predictionId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !prediction) throw new Error('Prediction not found');

  // 检查是否在5分钟内
  const createdAt = new Date(prediction.created_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

  if (diffMinutes > 5) {
    throw new Error('Cancellation period has expired');
  }

  // 删除预测（会级联删除打卡点等）
  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', predictionId);

  if (error) throw error;

  // 退还押注
  await supabase
    .from('user_profiles')
    .update({
      credits: supabase.sql`credits + ${prediction.total_stake}`,
    })
    .eq('id', user.id);
}
