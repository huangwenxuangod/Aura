-- ============================================
-- Aura 2.0 - 定时任务（可选）
-- ⚠️ 需要先在 Supabase Dashboard 启用 pg_cron 扩展
-- Dashboard → Database → Extensions → pg_cron → Enable
-- ============================================

-- 启用 pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 授权
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 每天凌晨 00:05 处理过期打卡点
SELECT cron.schedule(
  'aura-expired-checkin-points',
  '5 0 * * *',
  $$SELECT public.process_expired_checkin_points()$$
);

-- 每小时处理超时评审
SELECT cron.schedule(
  'aura-expired-judging',
  '0 * * * *',
  $$SELECT public.process_expired_judging()$$
);

-- 每天凌晨 00:10 触发到期预测评审
SELECT cron.schedule(
  'aura-expired-predictions',
  '10 0 * * *',
  $$SELECT public.process_expired_predictions()$$
);

-- 查看已创建的任务
-- SELECT * FROM cron.job;
-- 查看执行历史
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
