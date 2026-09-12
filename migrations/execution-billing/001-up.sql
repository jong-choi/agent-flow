CREATE TABLE IF NOT EXISTS ai_execution_billing (
 execution_id uuid PRIMARY KEY REFERENCES ai_model_executions(id),
 execution_key text NOT NULL UNIQUE,
 status text NOT NULL CHECK(status IN ('reserved','settled','released')),
 result jsonb,
 transaction_id uuid UNIQUE REFERENCES credit_transactions(id),
 expires_at timestamp NOT NULL,
 updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_execution_billing_expiry ON ai_execution_billing(expires_at) WHERE status='reserved';
