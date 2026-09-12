ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS replacement_model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS retirement_at timestamp;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS retirement_reason text;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS retirement_source_url text;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS require_free_access boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS ai_model_health(model_id uuid PRIMARY KEY REFERENCES ai_models(id) ON DELETE CASCADE,state jsonb NOT NULL,updated_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_provider_health(provider text PRIMARY KEY,credential_version text NOT NULL,state jsonb NOT NULL,updated_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_model_checks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,provider text NOT NULL,source text NOT NULL,ok integer NOT NULL,category text,code text,checked_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ai_checks_provider_time ON ai_model_checks(provider,checked_at);
CREATE TABLE IF NOT EXISTS ai_catalog_runs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),provider text NOT NULL,accepted integer NOT NULL,reason text,model_ids jsonb NOT NULL,created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_maintenance_jobs(key text PRIMARY KEY,next_run_at timestamp NOT NULL,lease_owner text,lease_until timestamp,last_finished_at timestamp,last_error text);
CREATE TABLE IF NOT EXISTS ai_probe_budgets(provider text NOT NULL,day text NOT NULL,used integer NOT NULL DEFAULT 0,PRIMARY KEY(provider,day));
CREATE TABLE IF NOT EXISTS ai_free_access_policies(provider text PRIMARY KEY,credential_version text NOT NULL,model_ids jsonb NOT NULL,source_url text NOT NULL,expires_at timestamp NOT NULL,verified_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_maintenance_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL,provider text,model_id uuid,details jsonb NOT NULL,created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_notice_snapshots(provider text PRIMARY KEY,digest text NOT NULL,checked_at timestamp NOT NULL DEFAULT now());

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='ai_models' AND column_name='promotion_blocked') THEN
  ALTER TABLE ai_models ADD COLUMN promotion_blocked boolean NOT NULL DEFAULT false;
  UPDATE ai_models SET promotion_blocked=true WHERE is_active=false;
 END IF;
END $$;

ALTER TABLE ai_model_checks ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'provider';
