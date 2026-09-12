DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM ai_execution_billing) THEN RAISE EXCEPTION 'Billing evidence exists; retain schema and roll forward'; END IF;
END $$;
DROP TABLE ai_execution_billing;
