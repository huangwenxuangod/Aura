import { supabase } from '@/lib/supabase';
import type { Prediction, Referee, CheckIn } from '@/types';
import { nanoid } from 'nanoid/non-secure';

interface CreatePredictionParams {
  title: string;
  description?: string;
  deadline: string;
  stake: number;
  isRecovery?: boolean;
}

/**
 * 创建预测
 */
export async function createPrediction(params: CreatePredictionParams): Promise<Prediction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 生成监督码
  const refereeCode = nanoid(8).toUpperCase();

  const { data, error } = await supabase
    .from('predictions')
    .insert({
      user_id: user.id,
      title: params.title,
      description: params.description,
      deadline: params.deadline,
      stake: params.stake,
      referee_code: refereeCode,
      status: 'ACTIVE',
      is_recovery: params.isRecovery || false,
    })
    .select()
    .single();

  if (error) throw error;

  // 如果不是恢复模式，扣除用户余额
  if (!params.isRecovery && params.stake > 0) {
    const { error: balanceError } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: params.stake,
    });

    if (balanceError) {
      // 回滚预测创建
      await supabase.from('predictions').delete().eq('id', data.id);
      throw new Error('Failed to deduct credits');
    }
  }

  return data as Prediction;
}

/**
 * 获取预测详情
 */
export async function getPrediction(predictionId: string): Promise<Prediction | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', predictionId)
    .single();

  if (error) {
    console.error('Failed to get prediction:', error);
    return null;
  }

  return data as Prediction;
}

/**
 * 获取用户的预测历史
 */
export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get user predictions:', error);
    return [];
  }

  return data as Prediction[];
}

/**
 * 触发判定（用户主动或到期）
 */
export async function triggerJudging(predictionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('predictions')
    .update({
      status: 'JUDGING',
      judging_started_at: new Date().toISOString(),
    })
    .eq('id', predictionId)
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE');

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

  // 取消预测
  const { error } = await supabase
    .from('predictions')
    .update({ status: 'CANCELLED' })
    .eq('id', predictionId);

  if (error) throw error;

  // 退还押注（如果不是恢复模式）
  if (!prediction.is_recovery && prediction.stake > 0) {
    await supabase.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: prediction.stake,
    });
  }
}

/**
 * 通过监督码获取预测
 */
export async function getPredictionByRefereeCode(code: string): Promise<Prediction | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, users!predictions_user_id_fkey(display_name, avatar_url)')
    .eq('referee_code', code.toUpperCase())
    .single();

  if (error) {
    console.error('Failed to get prediction by referee code:', error);
    return null;
  }

  return data as Prediction;
}

/**
 * 获取预测的裁判列表
 */
export async function getReferees(predictionId: string): Promise<Referee[]> {
  const { data, error } = await supabase
    .from('referees')
    .select('*, users!referees_user_id_fkey(display_name, avatar_url)')
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
export async function submitVote(predictionId: string, vote: 'YES' | 'NO'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('referees')
    .update({
      vote,
      voted_at: new Date().toISOString(),
    })
    .eq('prediction_id', predictionId)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * 获取预测的打卡记录
 */
export async function getCheckIns(predictionId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('prediction_id', predictionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get check-ins:', error);
    return [];
  }

  return data as CheckIn[];
}

/**
 * 创建打卡
 */
export async function createCheckIn(
  predictionId: string,
  content?: string,
  imageUrl?: string
): Promise<CheckIn> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      prediction_id: predictionId,
      user_id: user.id,
      content,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;

  return data as CheckIn;
}

/**
 * 上传打卡图片
 */
export async function uploadCheckInImage(
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
    .from('check-ins')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
    });

  if (error) throw error;

  // 获取公开URL
  const { data: urlData } = supabase.storage
    .from('check-ins')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
