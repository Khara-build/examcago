-- Migration: 20260907_token_atomicity_rpcs.sql
-- Description: Provides atomic database RPC functions for token daily claims,
-- admin grants, and ledger reconciliation to guarantee ACID consistency and prevent race conditions.

-- 1. Atomic Daily Claim Function
CREATE OR REPLACE FUNCTION public.claim_daily_token(
  p_user_id UUID,
  p_claim_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_balance INT;
  v_last_claim DATE;
  v_new_balance INT;
BEGIN
  -- Lock row FOR UPDATE to prevent race conditions / duplicate claims
  SELECT balance, last_daily_claim_date INTO v_balance, v_last_claim
  FROM public.token_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token account not found.');
  END IF;

  -- Validate whether already claimed today
  IF v_last_claim = p_claim_date THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already claimed your free token for today. Please check back tomorrow!');
  END IF;

  -- Update token balance and last claim date atomically
  UPDATE public.token_accounts
  SET balance = balance + 1,
      last_daily_claim_date = p_claim_date,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction in authoritative ledger
  INSERT INTO public.token_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, 1, 'daily_claim', 'Daily free token claimed for ' || p_claim_date::text || ' (BD Local Time)');

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomic Admin Grant Function
CREATE OR REPLACE FUNCTION public.grant_admin_tokens(
  p_target_user_id UUID,
  p_amount INT,
  p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance INT;
BEGIN
  -- Lock row FOR UPDATE
  SELECT balance INTO v_new_balance
  FROM public.token_accounts
  WHERE user_id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.token_accounts (user_id, balance)
    VALUES (p_target_user_id, GREATEST(0, p_amount))
    RETURNING balance INTO v_new_balance;
  ELSE
    UPDATE public.token_accounts
    SET balance = GREATEST(0, balance + p_amount),
        updated_at = NOW()
    WHERE user_id = p_target_user_id
    RETURNING balance INTO v_new_balance;
  END IF;

  -- Record transaction in authoritative ledger
  INSERT INTO public.token_transactions (user_id, amount, transaction_type, description)
  VALUES (p_target_user_id, p_amount, 'admin_grant', COALESCE(p_description, 'Admin promotional grant'));

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Authoritative Ledger Reconciliation Function
CREATE OR REPLACE FUNCTION public.reconcile_token_balance(
  p_user_id UUID
)
RETURNS INT AS $$
DECLARE
  v_ledger_sum INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_ledger_sum
  FROM public.token_transactions
  WHERE user_id = p_user_id;

  UPDATE public.token_accounts
  SET balance = GREATEST(0, v_ledger_sum),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN GREATEST(0, v_ledger_sum);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
