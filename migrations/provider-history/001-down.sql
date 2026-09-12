DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM chat_messages WHERE model_messages IS NOT NULL) THEN
  RAISE EXCEPTION 'Provider history exists. Use forward-fix to avoid losing signatures.';
 END IF;
END $$;
ALTER TABLE chat_messages DROP COLUMN model_messages;
