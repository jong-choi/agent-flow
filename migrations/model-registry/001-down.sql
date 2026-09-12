-- Safe pre-use rollback only. Once new providers/execution history exist, use forward-fix.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM ai_model_executions) OR EXISTS (SELECT 1 FROM ai_models WHERE model_id <> upstream_model_id) THEN
  RAISE EXCEPTION 'Registry has new models or execution history; rollback would lose information. Use forward-fix.';
 END IF;
END $$;
UPDATE workflow_nodes AS node SET value=model.model_id FROM ai_models AS model
WHERE node.type='chatNode' AND node.value=model.id::text;
DROP TABLE ai_model_executions;
DROP INDEX ai_models_provider_upstream_unique;
ALTER TABLE ai_models DROP CONSTRAINT ai_models_price_nonnegative;
ALTER TABLE ai_models DROP CONSTRAINT ai_models_app_limits_positive;
ALTER TABLE ai_models DROP CONSTRAINT ai_models_lifecycle_valid;
ALTER TABLE ai_models DROP CONSTRAINT ai_models_entitlement_valid;
ALTER TABLE ai_models DROP CONSTRAINT ai_models_health_valid;
ALTER TABLE ai_models DROP COLUMN upstream_model_id, DROP COLUMN description, DROP COLUMN lifecycle,
 DROP COLUMN entitlement, DROP COLUMN health, DROP COLUMN catalog_metadata, DROP COLUMN catalog_checked_at,
 DROP COLUMN app_max_input_tokens, DROP COLUMN app_max_output_tokens, DROP COLUMN updated_at;
ALTER TABLE ai_models ALTER COLUMN is_active SET DEFAULT true;
