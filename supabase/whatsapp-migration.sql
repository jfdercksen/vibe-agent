-- WhatsApp AI Agent Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cfkovdyvmbnnyzihqanp/sql/new

-- ── WhatsApp Conversations ─────────────────────────────────────────────────
-- One conversation per unique phone number per client
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phone_number   TEXT        NOT NULL,
  contact_name   TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, phone_number)
);

-- ── WhatsApp Messages ─────────────────────────────────────────────────────
-- Individual messages within a conversation
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages      ENABLE ROW LEVEL SECURITY;

-- Service role (used by API routes) can do everything
CREATE POLICY "service_role_all_whatsapp_conversations"
  ON whatsapp_conversations TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_whatsapp_messages"
  ON whatsapp_messages TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users (dashboard) can read
CREATE POLICY "auth_read_whatsapp_conversations"
  ON whatsapp_conversations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "auth_read_whatsapp_messages"
  ON whatsapp_messages FOR SELECT TO authenticated
  USING (true);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_client_id
  ON whatsapp_conversations(client_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message_at
  ON whatsapp_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id
  ON whatsapp_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at
  ON whatsapp_messages(created_at);

-- ── Enable Realtime ───────────────────────────────────────────────────────
-- Go to Supabase → Table Editor → whatsapp_conversations → Enable Realtime
-- Go to Supabase → Table Editor → whatsapp_messages → Enable Realtime
-- (Or run the following if your Supabase version supports it via SQL:)
-- ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
