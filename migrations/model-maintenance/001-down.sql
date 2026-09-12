-- Pre-use rollback only; operational evidence and retirement plans must not be discarded.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM ai_model_checks) OR EXISTS(SELECT 1 FROM ai_catalog_runs)
 OR EXISTS(SELECT 1 FROM ai_free_access_policies) OR EXISTS(SELECT 1 FROM ai_model_health)
 OR EXISTS(SELECT 1 FROM ai_provider_health) OR EXISTS(SELECT 1 FROM ai_maintenance_events)
 OR EXISTS(SELECT 1 FROM ai_models WHERE retirement_at IS NOT NULL OR replacement_model_id IS NOT NULL OR require_free_access)
 THEN RAISE EXCEPTION 'Maintenance evidence or configuration exists; use forward-fix'; END IF;
END $$;
DROP TABLE ai_notice_snapshots,ai_maintenance_events,ai_free_access_policies,ai_probe_budgets,ai_maintenance_jobs,ai_catalog_runs,ai_model_checks,ai_provider_health,ai_model_health;
ALTER TABLE ai_models DROP COLUMN replacement_model_id,DROP COLUMN retirement_at,DROP COLUMN retirement_reason,DROP COLUMN retirement_source_url,DROP COLUMN require_free_access,DROP COLUMN promotion_blocked;
