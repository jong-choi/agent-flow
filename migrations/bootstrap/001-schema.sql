CREATE TYPE "public"."sidebar_content_type" AS ENUM('select', 'dialog');
CREATE TYPE "public"."sidebar_node_type" AS ENUM('startNode', 'splitNode', 'promptNode', 'chatNode', 'searchNode', 'documentNode', 'mergeNode', 'endNode');
CREATE TYPE "public"."sidebar_options_source" AS ENUM('ai_models');
CREATE TYPE "public"."credit_transaction_category" AS ENUM('attendance', 'workflow', 'preset_sale', 'preset_purchase', 'manual_adjustment');
CREATE TYPE "public"."credit_transaction_type" AS ENUM('earn', 'spend');
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant', 'system');
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"displayName" text,
	"avatarHash" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "sidebar_node_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"type" "sidebar_content_type" NOT NULL,
	"value" text,
	"options_source" "sidebar_options_source",
	CONSTRAINT "sidebar_node_contents_node_id_unique" UNIQUE("node_id")
);

CREATE TABLE "sidebar_node_handles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"target_count" integer,
	"source_count" integer,
	CONSTRAINT "sidebar_node_handles_node_id_unique" UNIQUE("node_id")
);

CREATE TABLE "sidebar_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "sidebar_node_type" NOT NULL,
	"icon" text DEFAULT 'circle' NOT NULL,
	"background_color" text DEFAULT 'bg-neutral-800' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sidebar_nodes_type_unique" UNIQUE("type")
);

CREATE TABLE "ai_model_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_registry_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"upstream_model_id" text NOT NULL,
	"credits" integer NOT NULL,
	"input_limit" integer NOT NULL,
	"output_limit" integer NOT NULL,
	"user_id" text,
	"thread_id" text,
	"node_id" text,
	"status" text DEFAULT 'running' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"upstream_model_id" text NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"replacement_model_id" uuid,
	"retirement_at" timestamp,
	"retirement_reason" text,
	"retirement_source_url" text,
	"promotion_blocked" boolean DEFAULT false NOT NULL,
	"require_free_access" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"price" integer,
	"is_active" boolean DEFAULT false NOT NULL,
	"lifecycle" text DEFAULT 'candidate' NOT NULL,
	"entitlement" text DEFAULT 'unknown' NOT NULL,
	"health" text DEFAULT 'healthy' NOT NULL,
	"context_window" integer,
	"catalog_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"catalog_checked_at" timestamp,
	"app_max_input_tokens" integer DEFAULT 8000 NOT NULL,
	"app_max_output_tokens" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_models_model_id_unique" UNIQUE("model_id"),
	CONSTRAINT "ai_models_price_nonnegative" CHECK ("ai_models"."price" is null or "ai_models"."price" >= 0),
	CONSTRAINT "ai_models_app_limits_positive" CHECK ("ai_models"."app_max_input_tokens" > 0 and ("ai_models"."app_max_output_tokens" is null or "ai_models"."app_max_output_tokens" > 0)),
	CONSTRAINT "ai_models_lifecycle_valid" CHECK ("ai_models"."lifecycle" in ('candidate','active','deprecated','retired')),
	CONSTRAINT "ai_models_entitlement_valid" CHECK ("ai_models"."entitlement" in ('unknown','free_confirmed','paid','blocked')),
	CONSTRAINT "ai_models_health_valid" CHECK ("ai_models"."health" in ('healthy','cooldown','probing','suspended'))
);

CREATE TABLE "workflow_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"edge_id" text NOT NULL,
	"workflow_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"source" text NOT NULL,
	"target" text NOT NULL,
	"sourceHandle" text NOT NULL,
	"targetHandle" text NOT NULL
);

CREATE TABLE "workflow_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" text NOT NULL,
	"workflow_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"type" "sidebar_node_type" NOT NULL,
	"pos_x" integer NOT NULL,
	"pos_y" integer NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"value" text,
	"content_reference_id" text,
	"target_count" integer,
	"source_count" integer
);

CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "preset_purchases" (
	"preset_id" uuid NOT NULL,
	"buyer_id" text NOT NULL,
	"price" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preset_purchases_preset_id_buyer_id_pk" PRIMARY KEY("preset_id","buyer_id")
);

CREATE TABLE "preset_tags" (
	"preset_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preset_tags_preset_id_tag_pk" PRIMARY KEY("preset_id","tag")
);

CREATE TABLE "presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"chat_id" uuid,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"summary" text,
	"category" text,
	"price" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "workflow_presets" (
	"workflow_id" uuid NOT NULL,
	"preset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_presets_workflow_id_preset_id_pk" PRIMARY KEY("workflow_id","preset_id")
);

CREATE TABLE "credit_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "credit_daily_events" (
	"user_id" text NOT NULL,
	"event_date" date NOT NULL,
	"reward" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_daily_events_user_id_event_date_pk" PRIMARY KEY("user_id","event_date")
);

CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"category" "credit_transaction_category" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"model_messages" jsonb,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workflow_id" uuid NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "user_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"secret_hash" text NOT NULL,
	"preview" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "user_secrets_secret_hash_unique" UNIQUE("secret_hash")
);

CREATE TABLE "workflow_api_ids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"canvas_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "workflow_api_ids_workflow_id_unique" UNIQUE("workflow_id"),
	CONSTRAINT "workflow_api_ids_canvas_id_unique" UNIQUE("canvas_id")
);

CREATE TABLE "ai_catalog_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"accepted" integer NOT NULL,
	"reason" text,
	"model_ids" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_free_access_policies" (
	"provider" text PRIMARY KEY NOT NULL,
	"credential_version" text NOT NULL,
	"model_ids" jsonb NOT NULL,
	"source_url" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_maintenance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"provider" text,
	"model_id" uuid,
	"details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_maintenance_jobs" (
	"key" text PRIMARY KEY NOT NULL,
	"next_run_at" timestamp NOT NULL,
	"lease_owner" text,
	"lease_until" timestamp,
	"last_finished_at" timestamp,
	"last_error" text
);

CREATE TABLE "ai_model_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid,
	"provider" text NOT NULL,
	"source" text NOT NULL,
	"ok" integer NOT NULL,
	"scope" text DEFAULT 'provider' NOT NULL,
	"category" text,
	"code" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_model_health" (
	"model_id" uuid PRIMARY KEY NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_notice_snapshots" (
	"provider" text PRIMARY KEY NOT NULL,
	"digest" text NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_probe_budgets" (
	"provider" text NOT NULL,
	"day" text NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_probe_budgets_provider_day_pk" PRIMARY KEY("provider","day")
);

CREATE TABLE "ai_provider_health" (
	"provider" text PRIMARY KEY NOT NULL,
	"credential_version" text NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ai_execution_billing" (
	"execution_id" uuid PRIMARY KEY NOT NULL,
	"execution_key" text NOT NULL,
	"status" text NOT NULL,
	"result" jsonb,
	"transaction_id" uuid,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_execution_billing_execution_key_unique" UNIQUE("execution_key"),
	CONSTRAINT "ai_execution_billing_transaction_id_unique" UNIQUE("transaction_id"),
	CONSTRAINT "ai_execution_billing_status_check" CHECK ("ai_execution_billing"."status" in ('reserved','settled','released'))
);

ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sidebar_node_contents" ADD CONSTRAINT "sidebar_node_contents_node_id_sidebar_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."sidebar_nodes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sidebar_node_handles" ADD CONSTRAINT "sidebar_node_handles_node_id_sidebar_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."sidebar_nodes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_model_executions" ADD CONSTRAINT "ai_model_executions_model_registry_id_ai_models_id_fk" FOREIGN KEY ("model_registry_id") REFERENCES "public"."ai_models"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_replacement_model_id_ai_models_id_fk" FOREIGN KEY ("replacement_model_id") REFERENCES "public"."ai_models"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "preset_purchases" ADD CONSTRAINT "preset_purchases_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "preset_purchases" ADD CONSTRAINT "preset_purchases_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "preset_tags" ADD CONSTRAINT "preset_tags_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "presets" ADD CONSTRAINT "presets_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "presets" ADD CONSTRAINT "presets_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "presets" ADD CONSTRAINT "presets_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_presets" ADD CONSTRAINT "workflow_presets_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_presets" ADD CONSTRAINT "workflow_presets_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."presets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "credit_daily_events" ADD CONSTRAINT "credit_daily_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chats" ADD CONSTRAINT "chats_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_secrets" ADD CONSTRAINT "user_secrets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_api_ids" ADD CONSTRAINT "workflow_api_ids_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_model_checks" ADD CONSTRAINT "ai_model_checks_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ai_model_health" ADD CONSTRAINT "ai_model_health_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_execution_billing" ADD CONSTRAINT "ai_execution_billing_execution_id_ai_model_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."ai_model_executions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ai_execution_billing" ADD CONSTRAINT "ai_execution_billing_transaction_id_credit_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."credit_transactions"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "ai_models_provider_upstream_unique" ON "ai_models" USING btree ("provider","upstream_model_id");
CREATE INDEX "ai_execution_billing_expiry" ON "ai_execution_billing" USING btree ("expires_at") WHERE "ai_execution_billing"."status"='reserved';
