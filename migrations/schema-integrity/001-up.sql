-- Schema declarations previously wrapped primaryKey() in an object inside an array,
-- so new installations could omit these keys. Never delete duplicate data silently.
DO $$ DECLARE item record; BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('credit_daily_events','user_id,event_date'),
  ('workflow_presets','workflow_id,preset_id'),
  ('preset_purchases','preset_id,buyer_id'),
  ('preset_tags','preset_id,tag')
 ) AS keys(table_name,column_names) LOOP
  IF to_regclass('public.'||item.table_name) IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('public.'||item.table_name) AND contype='p'
  ) THEN EXECUTE format('ALTER TABLE %I ADD PRIMARY KEY (%s)',item.table_name,item.column_names); END IF;
 END LOOP;
END $$;
