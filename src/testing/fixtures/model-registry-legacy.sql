CREATE TABLE ai_models (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), model_id text NOT NULL UNIQUE, name text NOT NULL, "order" integer NOT NULL DEFAULT 0, provider text NOT NULL, context_window integer, price integer, is_active boolean NOT NULL DEFAULT true, metadata jsonb, created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE workflows (id uuid PRIMARY KEY, title text NOT NULL);
CREATE TABLE workflow_nodes (id uuid PRIMARY KEY, workflow_id uuid REFERENCES workflows(id), type text NOT NULL, value text, pos_x integer, pos_y integer);
CREATE TABLE workflow_edges (id uuid PRIMARY KEY, workflow_id uuid REFERENCES workflows(id), source uuid REFERENCES workflow_nodes(id), target uuid REFERENCES workflow_nodes(id));
CREATE TABLE presets (id uuid PRIMARY KEY, workflow_id uuid REFERENCES workflows(id));
CREATE TABLE chats (id uuid PRIMARY KEY, workflow_id uuid REFERENCES workflows(id));
INSERT INTO ai_models (id, model_id, name, provider, price, metadata) VALUES ('11111111-1111-4111-8111-111111111111','openai/gpt-oss-20b','GPT OSS20B','groq',15,'{"maxOutputTokens":2048}');
INSERT INTO workflows VALUES ('22222222-2222-4222-8222-222222222222','Existing workflow');
INSERT INTO workflow_nodes VALUES
 ('33333333-3333-4333-8333-333333333331','22222222-2222-4222-8222-222222222222','chatNode','openai/gpt-oss-20b',12,34),
 ('33333333-3333-4333-8333-333333333332','22222222-2222-4222-8222-222222222222','chatNode','already-removed-model',56,78),
 ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','promptNode','openai/gpt-oss-20b',90,12);
INSERT INTO workflow_edges VALUES ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333331','33333333-3333-4333-8333-333333333332');
INSERT INTO presets VALUES ('55555555-5555-4555-8555-555555555555','22222222-2222-4222-8222-222222222222');
INSERT INTO chats VALUES ('66666666-6666-4666-8666-666666666666','22222222-2222-4222-8222-222222222222');
