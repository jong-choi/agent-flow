-- Run inside one transaction. Existing model IDs and all graph edges are preserved.
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS upstream_model_id text;
UPDATE ai_models SET upstream_model_id=model_id WHERE upstream_model_id IS NULL;
ALTER TABLE ai_models ALTER COLUMN upstream_model_id SET NOT NULL;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS lifecycle text NOT NULL DEFAULT 'active';
ALTER TABLE ai_models ALTER COLUMN lifecycle SET DEFAULT 'candidate';
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS entitlement text NOT NULL DEFAULT 'unknown';
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS health text NOT NULL DEFAULT 'healthy';
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS catalog_metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS catalog_checked_at timestamp;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS app_max_input_tokens integer NOT NULL DEFAULT 8000;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS app_max_output_tokens integer;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();
ALTER TABLE ai_models ALTER COLUMN is_active SET DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_upstream_unique ON ai_models(provider, upstream_model_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ai_models_price_nonnegative' AND conrelid='ai_models'::regclass) THEN
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_price_nonnegative CHECK (price IS NULL OR price >= 0);
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_app_limits_positive CHECK (app_max_input_tokens > 0 AND (app_max_output_tokens IS NULL OR app_max_output_tokens > 0));
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_lifecycle_valid CHECK (lifecycle IN ('candidate','active','deprecated','retired'));
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_entitlement_valid CHECK (entitlement IN ('unknown','free_confirmed','paid','blocked'));
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_health_valid CHECK (health IN ('healthy','cooldown','probing','suspended'));
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS ai_model_executions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), model_registry_id uuid NOT NULL REFERENCES ai_models(id),
 provider text NOT NULL, upstream_model_id text NOT NULL, credits integer NOT NULL,
 input_limit integer NOT NULL, output_limit integer NOT NULL, thread_id text, node_id text,
 status text NOT NULL DEFAULT 'running', created_at timestamp NOT NULL DEFAULT now(), completed_at timestamp
);
ALTER TABLE ai_model_executions ADD COLUMN IF NOT EXISTS user_id text;
UPDATE workflow_nodes AS node SET value=model.id::text
FROM ai_models AS model WHERE node.type='chatNode' AND node.value=model.model_id;
