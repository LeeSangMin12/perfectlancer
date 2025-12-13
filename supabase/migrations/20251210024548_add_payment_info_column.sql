-- Ensure expert_requests has payment_info column for project payment submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expert_requests'
      AND column_name = 'payment_info'
  ) THEN
    ALTER TABLE public.expert_requests
      ADD COLUMN payment_info jsonb;

    COMMENT ON COLUMN public.expert_requests.payment_info
      IS 'Deposit info (depositor_name, bank, account_number, etc.)';
  END IF;
END $$;

-- Refresh PostgREST schema cache to surface the new column immediately
NOTIFY pgrst, 'reload schema';
