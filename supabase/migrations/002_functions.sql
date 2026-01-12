-- Add credits to user
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET credit_balance = credit_balance + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduct credits from user
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT credit_balance INTO current_balance FROM users WHERE id = p_user_id;
  
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  UPDATE users
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process prediction result
CREATE OR REPLACE FUNCTION process_prediction_result(p_prediction_id UUID)
RETURNS VOID AS $$
DECLARE
  v_prediction predictions%ROWTYPE;
  v_yes_votes INTEGER;
  v_total_votes INTEGER;
  v_is_success BOOLEAN;
  v_recovery recoveries%ROWTYPE;
BEGIN
  -- Get prediction
  SELECT * INTO v_prediction FROM predictions WHERE id = p_prediction_id;
  
  IF v_prediction.status != 'JUDGING' THEN
    RAISE EXCEPTION 'Prediction is not in JUDGING status';
  END IF;
  
  -- Count votes (no vote after 24h = YES)
  SELECT 
    COUNT(*) FILTER (WHERE vote = 'YES' OR (vote IS NULL AND NOW() - created_at > INTERVAL '24 hours')),
    COUNT(*)
  INTO v_yes_votes, v_total_votes
  FROM referees
  WHERE prediction_id = p_prediction_id;
  
  -- Determine success (>50% YES)
  v_is_success := v_yes_votes > v_total_votes / 2;
  
  IF v_is_success THEN
    -- Success
    UPDATE predictions SET status = 'SUCCESS' WHERE id = p_prediction_id;
    
    IF v_prediction.is_recovery THEN
      -- Update recovery progress
      SELECT * INTO v_recovery FROM recoveries 
      WHERE user_id = v_prediction.user_id AND status = 'IN_PROGRESS'
      ORDER BY created_at DESC LIMIT 1;
      
      IF FOUND THEN
        IF v_recovery.success_count + 1 >= 2 THEN
          -- Recovery complete
          UPDATE recoveries SET status = 'RECOVERED', success_count = success_count + 1 WHERE id = v_recovery.id;
          -- Return original stake
          PERFORM add_credits(v_prediction.user_id, v_recovery.original_stake);
          -- Record transaction
          INSERT INTO transactions (user_id, type, amount, status, prediction_id)
          VALUES (v_prediction.user_id, 'RECOVERY', v_recovery.original_stake, 'COMPLETED', p_prediction_id);
        ELSE
          UPDATE recoveries SET success_count = success_count + 1 WHERE id = v_recovery.id;
        END IF;
      END IF;
    ELSE
      -- Return stake
      PERFORM add_credits(v_prediction.user_id, v_prediction.stake);
      -- Update consecutive successes
      UPDATE users SET consecutive_successes = consecutive_successes + 1 WHERE id = v_prediction.user_id;
    END IF;
  ELSE
    -- Failed
    UPDATE predictions SET status = 'FAILED' WHERE id = p_prediction_id;
    
    IF v_prediction.is_recovery THEN
      -- Forfeit original stake
      SELECT * INTO v_recovery FROM recoveries 
      WHERE user_id = v_prediction.user_id AND status = 'IN_PROGRESS'
      ORDER BY created_at DESC LIMIT 1;
      
      IF FOUND THEN
        UPDATE recoveries SET status = 'FORFEITED' WHERE id = v_recovery.id;
        -- Record forfeit transaction
        INSERT INTO transactions (user_id, type, amount, status, prediction_id)
        VALUES (v_prediction.user_id, 'FORFEIT', v_recovery.original_stake, 'COMPLETED', p_prediction_id);
      END IF;
    ELSE
      -- Enter recovery mode
      INSERT INTO recoveries (user_id, original_prediction_id, original_stake)
      VALUES (v_prediction.user_id, p_prediction_id, v_prediction.stake);
    END IF;
    
    -- Reset consecutive successes
    UPDATE users SET consecutive_successes = 0 WHERE id = v_prediction.user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and process expired predictions
CREATE OR REPLACE FUNCTION check_expired_predictions()
RETURNS VOID AS $$
DECLARE
  v_prediction predictions%ROWTYPE;
BEGIN
  -- Find expired ACTIVE predictions with at least 1 referee
  FOR v_prediction IN
    SELECT p.* FROM predictions p
    WHERE p.status = 'ACTIVE'
    AND p.deadline < NOW()
    AND EXISTS (SELECT 1 FROM referees r WHERE r.prediction_id = p.id)
  LOOP
    -- Move to JUDGING status
    UPDATE predictions 
    SET status = 'JUDGING', judging_started_at = NOW()
    WHERE id = v_prediction.id;
  END LOOP;
  
  -- Process JUDGING predictions where voting period ended (24h)
  FOR v_prediction IN
    SELECT * FROM predictions
    WHERE status = 'JUDGING'
    AND judging_started_at < NOW() - INTERVAL '24 hours'
  LOOP
    PERFORM process_prediction_result(v_prediction.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if all referees have voted
CREATE OR REPLACE FUNCTION check_voting_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_prediction predictions%ROWTYPE;
  v_pending_votes INTEGER;
BEGIN
  -- Get prediction
  SELECT * INTO v_prediction FROM predictions WHERE id = NEW.prediction_id;
  
  IF v_prediction.status != 'JUDGING' THEN
    RETURN NEW;
  END IF;
  
  -- Count pending votes
  SELECT COUNT(*) INTO v_pending_votes
  FROM referees
  WHERE prediction_id = NEW.prediction_id AND vote IS NULL;
  
  -- If all voted, process result
  IF v_pending_votes = 0 THEN
    PERFORM process_prediction_result(NEW.prediction_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_voting_complete_trigger
  AFTER UPDATE OF vote ON referees
  FOR EACH ROW
  WHEN (NEW.vote IS NOT NULL)
  EXECUTE FUNCTION check_voting_complete();

-- Schedule cron job for checking expired predictions (requires pg_cron extension)
-- SELECT cron.schedule('check-expired-predictions', '*/5 * * * *', 'SELECT check_expired_predictions()');
