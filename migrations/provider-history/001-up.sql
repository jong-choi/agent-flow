-- Server-only serialized provider messages. Public chat queries explicitly omit this field.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS model_messages jsonb;
