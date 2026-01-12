import { supabase } from '@/lib/supabase';
import type { Referee, Vote } from '@/types';

export const refereeService = {
  /**
   * 加入成为裁判
   */
  async join(refereeCode: string): Promise<Referee> {
    const { data, error } = await supabase.rpc('join_as_referee', {
      p_referee_code: refereeCode.toUpperCase(),
    });

    if (error) {
      if (error.message.includes('not found')) {
        throw new Error('无效的裁判码');
      }
      if (error.message.includes('your own prediction')) {
        throw new Error('不能给自己的预测当裁判');
      }
      if (error.message.includes('Already a referee')) {
        throw new Error('你已经是裁判了');
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * 投票
   */
  async vote(predictionId: string, vote: Vote): Promise<Referee> {
    const { data, error } = await supabase.rpc('cast_vote', {
      p_prediction_id: predictionId,
      p_vote: vote,
    });

    if (error) {
      if (error.message.includes('not in judging')) {
        throw new Error('预测不在判定阶段');
      }
      if (error.message.includes('Not a referee')) {
        throw new Error('你不是裁判');
      }
      if (error.message.includes('Already voted')) {
        throw new Error('你已经投过票了');
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * 获取我作为裁判的预测列表
   */
  async getMyRefereeList(): Promise<Array<{ prediction_id: string; vote: Vote | null }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('referees')
      .select('prediction_id, vote')
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * 检查是否已是裁判
   */
  async isReferee(predictionId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('referees')
      .select('id')
      .eq('prediction_id', predictionId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw new Error(error.message);
    }

    return !!data;
  },

  /**
   * 获取我在某预测的投票状态
   */
  async getMyVote(predictionId: string): Promise<Vote | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('referees')
      .select('vote')
      .eq('prediction_id', predictionId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data?.vote || null;
  },
};

