-- ============================================
-- Aura 2.0 - 完整数据库迁移（打卡点激励系统）
-- ⚠️ 此脚本替代旧的 001、002、003、004、005
-- 创建日期: 2026-01-18
-- ============================================

-- ============================================
-- 0. 清理旧表（如果存在）
-- ============================================
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.checkins CASCADE;
DROP TABLE IF EXISTS public.checkin_points CASCADE;
DROP TABLE IF EXISTS public.referees CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 删除旧系统的表（如果存在）
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.recoveries CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 删除旧的类型
DROP TYPE IF EXISTS prediction_status CASCADE;
DROP TYPE IF EXISTS vote_type CASCADE;
DROP TYPE IF EXISTS recovery_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;

-- ============================================
-- 1. 用户资料表 (user_profiles)
-- ============================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 1000, -- 新用户默认1000积分（测试用）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 预测表 (predictions)
-- ============================================
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- 基本信息
  title TEXT NOT NULL,
  description TEXT,
  
  -- 时间设置
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE NOT NULL,
  
  -- 金额分配 (50:50)
  total_stake INTEGER NOT NULL CHECK (total_stake >= 10 AND total_stake <= 1000),
  checkin_reward INTEGER NOT NULL, -- 打卡奖励总额 (50%)
  result_reward INTEGER NOT NULL,  -- 结果奖励总额 (50%)
  
  -- 打卡点设置
  checkin_point_count INTEGER NOT NULL CHECK (checkin_point_count >= 1),
  
  -- 裁判系统
  referee_code TEXT NOT NULL UNIQUE,
  
  -- 状态: active -> judging -> settled
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'judging', 'settled')),
  
  -- 结算结果
  earned_checkin_reward INTEGER NOT NULL DEFAULT 0,
  earned_result_reward INTEGER NOT NULL DEFAULT 0,
  final_result TEXT CHECK (final_result IN ('success', 'failure', NULL)),
  settled_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT valid_deadline CHECK (deadline >= start_date),
  CONSTRAINT valid_reward_split CHECK (checkin_reward + result_reward = total_stake)
);

-- ============================================
-- 3. 打卡点表 (checkin_points)
-- 边际递减奖励：越早的点奖励越高
-- ============================================
CREATE TABLE public.checkin_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  
  point_index INTEGER NOT NULL,     -- 第几个打卡点 (1, 2, 3...)
  due_date DATE NOT NULL,           -- 截止日期
  reward_amount INTEGER NOT NULL,   -- 该点的奖励
  
  -- 状态: pending -> completed/missed
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (prediction_id, point_index)
);

-- ============================================
-- 4. 打卡记录表 (checkins)
-- ============================================
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL CHECK (char_length(content) >= 10), -- 至少10字
  image_url TEXT,
  
  -- 关联的打卡点
  checkin_point_id UUID REFERENCES public.checkin_points(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. 裁判表 (referees)
-- ============================================
CREATE TABLE public.referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  vote TEXT CHECK (vote IN ('success', 'failure', NULL)),
  comment TEXT,
  voted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (prediction_id, user_id)
);

-- ============================================
-- 6. 积分交易表 (credit_transactions)
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'stake',           -- 押注扣除
    'checkin_reward',  -- 打卡奖励
    'result_reward',   -- 结果奖励
    'checkin_missed',  -- 打卡错过
    'purchase',        -- 购买积分
    'forfeit',         -- 结果失败
    'refund'           -- 退款
  )),
  
  amount INTEGER NOT NULL, -- 正=获得，负=扣除
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. 索引
-- ============================================
CREATE INDEX idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX idx_predictions_status ON public.predictions(status);
CREATE INDEX idx_predictions_referee_code ON public.predictions(referee_code);
CREATE INDEX idx_predictions_deadline ON public.predictions(deadline);

CREATE INDEX idx_checkin_points_prediction_id ON public.checkin_points(prediction_id);
CREATE INDEX idx_checkin_points_due_date ON public.checkin_points(due_date);
CREATE INDEX idx_checkin_points_status ON public.checkin_points(status);

CREATE INDEX idx_checkins_prediction_id ON public.checkins(prediction_id);
CREATE INDEX idx_checkins_user_id ON public.checkins(user_id);

CREATE INDEX idx_referees_prediction_id ON public.referees(prediction_id);
CREATE INDEX idx_referees_user_id ON public.referees(user_id);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- ============================================
-- 8. RLS 启用
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS 策略
-- ============================================

-- user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- predictions (简化策略，允许查看所有预测，实际控制在应用层)
CREATE POLICY "Predictions are viewable" ON public.predictions
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- checkin_points
CREATE POLICY "Checkin points are viewable" ON public.checkin_points
  FOR SELECT USING (true);

-- checkins
CREATE POLICY "Checkins are viewable" ON public.checkins
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own checkins" ON public.checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- referees
CREATE POLICY "Referees are viewable" ON public.referees
  FOR SELECT USING (true);
CREATE POLICY "Users can join as referee" ON public.referees
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Referees can update own vote" ON public.referees
  FOR UPDATE USING (auth.uid() = user_id);

-- credit_transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 10. 触发器
-- ============================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 新用户自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User_' || LEFT(NEW.id::TEXT, 8)),
    1000
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 11. RPC 函数
-- ============================================

-- 扣除用户积分
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_prediction_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '押注扣除'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  SELECT credits INTO v_current_credits
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  UPDATE public.user_profiles
  SET credits = credits - p_amount, updated_at = NOW()
  WHERE id = p_user_id;
  
  INSERT INTO public.credit_transactions (user_id, type, amount, prediction_id, description)
  VALUES (p_user_id, 'stake', -p_amount, p_prediction_id, p_description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 计算边际递减奖励
CREATE OR REPLACE FUNCTION public.calculate_diminishing_rewards(
  p_total_reward INTEGER,
  p_point_count INTEGER
)
RETURNS INTEGER[] AS $$
DECLARE
  v_sum INTEGER;
  v_rewards INTEGER[];
  v_reward INTEGER;
  v_total INTEGER := 0;
  i INTEGER;
BEGIN
  v_sum := p_point_count * (p_point_count + 1) / 2;
  
  FOR i IN 1..p_point_count LOOP
    v_reward := ROUND(p_total_reward::FLOAT * (p_point_count - i + 1) / v_sum);
    v_rewards := array_append(v_rewards, v_reward);
    v_total := v_total + v_reward;
  END LOOP;
  
  IF v_total != p_total_reward THEN
    v_rewards[p_point_count] := v_rewards[p_point_count] + (p_total_reward - v_total);
  END IF;
  
  RETURN v_rewards;
END;
$$ LANGUAGE plpgsql;

-- 创建预测并生成打卡点
CREATE OR REPLACE FUNCTION public.create_prediction_with_checkin_points(
  p_title TEXT,
  p_description TEXT,
  p_deadline DATE,
  p_total_stake INTEGER,
  p_checkin_point_count INTEGER
)
RETURNS public.predictions AS $$
DECLARE
  v_user_id UUID;
  v_prediction public.predictions;
  v_checkin_reward INTEGER;
  v_result_reward INTEGER;
  v_referee_code TEXT;
  v_rewards INTEGER[];
  v_start_date DATE;
  v_days_between INTEGER;
  v_interval_days INTEGER;
  v_due_date DATE;
  i INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF char_length(p_title) < 5 THEN
    RAISE EXCEPTION 'Title must be at least 5 characters';
  END IF;
  
  IF p_deadline <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Deadline must be in the future';
  END IF;
  
  v_start_date := CURRENT_DATE;
  v_days_between := p_deadline - v_start_date;
  
  IF p_checkin_point_count > v_days_between THEN
    RAISE EXCEPTION 'Checkin points cannot exceed days';
  END IF;
  
  v_checkin_reward := p_total_stake / 2;
  v_result_reward := p_total_stake - v_checkin_reward;
  
  v_referee_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
  
  -- 扣款
  PERFORM public.deduct_user_credits(v_user_id, p_total_stake, NULL, '创建预测押注');
  
  -- 创建预测
  INSERT INTO public.predictions (
    user_id, title, description, start_date, deadline,
    total_stake, checkin_reward, result_reward,
    checkin_point_count, referee_code, status
  )
  VALUES (
    v_user_id, p_title, p_description, v_start_date, p_deadline,
    p_total_stake, v_checkin_reward, v_result_reward,
    p_checkin_point_count, v_referee_code, 'active'
  )
  RETURNING * INTO v_prediction;
  
  -- 更新交易的 prediction_id
  UPDATE public.credit_transactions
  SET prediction_id = v_prediction.id
  WHERE user_id = v_user_id AND prediction_id IS NULL AND type = 'stake'
    AND created_at >= NOW() - INTERVAL '10 seconds';
  
  -- 生成打卡点
  v_rewards := public.calculate_diminishing_rewards(v_checkin_reward, p_checkin_point_count);
  v_interval_days := GREATEST(1, v_days_between / p_checkin_point_count);
  
  FOR i IN 1..p_checkin_point_count LOOP
    v_due_date := v_start_date + (v_interval_days * i);
    IF v_due_date > p_deadline THEN
      v_due_date := p_deadline;
    END IF;
    
    INSERT INTO public.checkin_points (prediction_id, point_index, due_date, reward_amount, status)
    VALUES (v_prediction.id, i, v_due_date, v_rewards[i], 'pending');
  END LOOP;
  
  RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成打卡点
CREATE OR REPLACE FUNCTION public.complete_checkin_point(
  p_checkin_point_id UUID,
  p_content TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS public.checkins AS $$
DECLARE
  v_user_id UUID;
  v_point public.checkin_points;
  v_prediction public.predictions;
  v_checkin public.checkins;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF char_length(p_content) < 10 THEN
    RAISE EXCEPTION 'Content must be at least 10 characters';
  END IF;
  
  SELECT * INTO v_point FROM public.checkin_points WHERE id = p_checkin_point_id FOR UPDATE;
  IF v_point IS NULL THEN RAISE EXCEPTION 'Point not found'; END IF;
  
  SELECT * INTO v_prediction FROM public.predictions WHERE id = v_point.prediction_id;
  IF v_prediction.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_point.status != 'pending' THEN RAISE EXCEPTION 'Point already processed'; END IF;
  IF v_point.due_date < CURRENT_DATE THEN RAISE EXCEPTION 'Point expired'; END IF;
  
  -- 创建打卡
  INSERT INTO public.checkins (prediction_id, user_id, content, image_url, checkin_point_id)
  VALUES (v_prediction.id, v_user_id, p_content, p_image_url, p_checkin_point_id)
  RETURNING * INTO v_checkin;
  
  -- 更新打卡点状态
  UPDATE public.checkin_points SET status = 'completed', completed_at = NOW() WHERE id = p_checkin_point_id;
  
  -- 发放奖励
  UPDATE public.user_profiles SET credits = credits + v_point.reward_amount, updated_at = NOW() WHERE id = v_user_id;
  
  UPDATE public.predictions SET earned_checkin_reward = earned_checkin_reward + v_point.reward_amount, updated_at = NOW()
  WHERE id = v_prediction.id;
  
  INSERT INTO public.credit_transactions (user_id, type, amount, prediction_id, description)
  VALUES (v_user_id, 'checkin_reward', v_point.reward_amount, v_prediction.id, '打卡点 #' || v_point.point_index || ' 奖励');
  
  RETURN v_checkin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 普通打卡
CREATE OR REPLACE FUNCTION public.create_simple_checkin(
  p_prediction_id UUID,
  p_content TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS public.checkins AS $$
DECLARE
  v_user_id UUID;
  v_prediction public.predictions;
  v_checkin public.checkins;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF char_length(p_content) < 10 THEN RAISE EXCEPTION 'Content must be at least 10 characters'; END IF;
  
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id;
  IF v_prediction IS NULL THEN RAISE EXCEPTION 'Prediction not found'; END IF;
  IF v_prediction.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_prediction.status != 'active' THEN RAISE EXCEPTION 'Prediction not active'; END IF;
  
  INSERT INTO public.checkins (prediction_id, user_id, content, image_url)
  VALUES (p_prediction_id, v_user_id, p_content, p_image_url)
  RETURNING * INTO v_checkin;
  
  RETURN v_checkin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 加入成为裁判
CREATE OR REPLACE FUNCTION public.join_as_referee(p_referee_code TEXT)
RETURNS public.referees AS $$
DECLARE
  v_user_id UUID;
  v_prediction public.predictions;
  v_referee public.referees;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT * INTO v_prediction FROM public.predictions WHERE referee_code = UPPER(p_referee_code);
  IF v_prediction IS NULL THEN RAISE EXCEPTION 'Invalid referee code'; END IF;
  IF v_prediction.user_id = v_user_id THEN RAISE EXCEPTION 'Cannot referee own prediction'; END IF;
  
  IF EXISTS (SELECT 1 FROM public.referees WHERE prediction_id = v_prediction.id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Already a referee';
  END IF;
  
  INSERT INTO public.referees (prediction_id, user_id)
  VALUES (v_prediction.id, v_user_id)
  RETURNING * INTO v_referee;
  
  RETURN v_referee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 裁判投票
CREATE OR REPLACE FUNCTION public.cast_referee_vote(
  p_prediction_id UUID,
  p_vote TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS public.referees AS $$
DECLARE
  v_user_id UUID;
  v_prediction public.predictions;
  v_referee public.referees;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_vote NOT IN ('success', 'failure') THEN RAISE EXCEPTION 'Invalid vote'; END IF;
  
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id;
  IF v_prediction IS NULL THEN RAISE EXCEPTION 'Prediction not found'; END IF;
  IF v_prediction.status != 'judging' THEN RAISE EXCEPTION 'Not in judging status'; END IF;
  
  SELECT * INTO v_referee FROM public.referees WHERE prediction_id = p_prediction_id AND user_id = v_user_id FOR UPDATE;
  IF v_referee IS NULL THEN RAISE EXCEPTION 'Not a referee'; END IF;
  IF v_referee.vote IS NOT NULL THEN RAISE EXCEPTION 'Already voted'; END IF;
  
  UPDATE public.referees SET vote = p_vote, comment = p_comment, voted_at = NOW()
  WHERE id = v_referee.id RETURNING * INTO v_referee;
  
  PERFORM public.try_settle_prediction(p_prediction_id);
  
  RETURN v_referee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发评审
CREATE OR REPLACE FUNCTION public.trigger_prediction_judging(p_prediction_id UUID)
RETURNS public.predictions AS $$
DECLARE
  v_user_id UUID;
  v_prediction public.predictions;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id FOR UPDATE;
  IF v_prediction IS NULL THEN RAISE EXCEPTION 'Prediction not found'; END IF;
  IF v_prediction.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_prediction.status != 'active' THEN RAISE EXCEPTION 'Not active'; END IF;
  
  UPDATE public.predictions SET status = 'judging', updated_at = NOW()
  WHERE id = p_prediction_id RETURNING * INTO v_prediction;
  
  RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 尝试结算
CREATE OR REPLACE FUNCTION public.try_settle_prediction(p_prediction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prediction public.predictions;
  v_total INTEGER;
  v_voted INTEGER;
  v_success INTEGER;
BEGIN
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id FOR UPDATE;
  IF v_prediction IS NULL OR v_prediction.status != 'judging' THEN RETURN FALSE; END IF;
  
  SELECT COUNT(*), COUNT(vote), COUNT(CASE WHEN vote = 'success' THEN 1 END)
  INTO v_total, v_voted, v_success
  FROM public.referees WHERE prediction_id = p_prediction_id;
  
  IF v_total = 0 OR v_voted < v_total THEN RETURN FALSE; END IF;
  
  PERFORM public.settle_prediction(p_prediction_id, (v_success::FLOAT / v_total) > 0.5);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 结算
CREATE OR REPLACE FUNCTION public.settle_prediction(p_prediction_id UUID, p_is_success BOOLEAN)
RETURNS VOID AS $$
DECLARE
  v_prediction public.predictions;
  v_user_id UUID;
  v_reward INTEGER;
BEGIN
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id FOR UPDATE;
  IF v_prediction IS NULL THEN RETURN; END IF;
  
  v_user_id := v_prediction.user_id;
  
  IF p_is_success THEN
    v_reward := v_prediction.result_reward;
    
    UPDATE public.user_profiles SET credits = credits + v_reward, updated_at = NOW() WHERE id = v_user_id;
    
    INSERT INTO public.credit_transactions (user_id, type, amount, prediction_id, description)
    VALUES (v_user_id, 'result_reward', v_reward, p_prediction_id, '预测成功奖励');
    
    UPDATE public.predictions
    SET status = 'settled', final_result = 'success', earned_result_reward = v_reward, settled_at = NOW(), updated_at = NOW()
    WHERE id = p_prediction_id;
  ELSE
    INSERT INTO public.credit_transactions (user_id, type, amount, prediction_id, description)
    VALUES (v_user_id, 'forfeit', -v_prediction.result_reward, p_prediction_id, '预测失败');
    
    UPDATE public.predictions
    SET status = 'settled', final_result = 'failure', earned_result_reward = 0, settled_at = NOW(), updated_at = NOW()
    WHERE id = p_prediction_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12. 定时任务函数
-- ============================================

-- 处理过期打卡点
CREATE OR REPLACE FUNCTION public.process_expired_checkin_points()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_point RECORD;
BEGIN
  FOR v_point IN
    SELECT cp.*, p.user_id
    FROM public.checkin_points cp
    JOIN public.predictions p ON p.id = cp.prediction_id
    WHERE cp.status = 'pending' AND cp.due_date < CURRENT_DATE AND p.status = 'active'
  LOOP
    UPDATE public.checkin_points SET status = 'missed' WHERE id = v_point.id;
    
    INSERT INTO public.credit_transactions (user_id, type, amount, prediction_id, description)
    VALUES (v_point.user_id, 'checkin_missed', -v_point.reward_amount, v_point.prediction_id, 
            '打卡点 #' || v_point.point_index || ' 错过');
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 处理超时评审
CREATE OR REPLACE FUNCTION public.process_expired_judging()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_prediction RECORD;
  v_total INTEGER;
  v_success INTEGER;
BEGIN
  FOR v_prediction IN
    SELECT * FROM public.predictions
    WHERE status = 'judging' AND updated_at < NOW() - INTERVAL '24 hours'
  LOOP
    SELECT COUNT(*), COUNT(CASE WHEN vote = 'success' OR vote IS NULL THEN 1 END)
    INTO v_total, v_success
    FROM public.referees WHERE prediction_id = v_prediction.id;
    
    IF v_total = 0 THEN
      PERFORM public.settle_prediction(v_prediction.id, FALSE);
    ELSE
      PERFORM public.settle_prediction(v_prediction.id, (v_success::FLOAT / v_total) > 0.5);
    END IF;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 处理到期预测
CREATE OR REPLACE FUNCTION public.process_expired_predictions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.predictions
  SET status = 'judging', updated_at = NOW()
  WHERE status = 'active' AND deadline < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 完成
-- ============================================
COMMENT ON TABLE public.user_profiles IS 'Aura 2.0 用户资料';
COMMENT ON TABLE public.predictions IS 'Aura 2.0 预测（打卡点系统）';
COMMENT ON TABLE public.checkin_points IS 'Aura 2.0 打卡点（边际递减）';
COMMENT ON TABLE public.checkins IS 'Aura 2.0 打卡记录';
COMMENT ON TABLE public.referees IS 'Aura 2.0 裁判';
COMMENT ON TABLE public.credit_transactions IS 'Aura 2.0 积分交易';
