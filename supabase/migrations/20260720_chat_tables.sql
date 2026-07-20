-- CrossFire Wiki — Chat tables migration
-- Run this in your Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste → Run

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT,
  type            TEXT DEFAULT 'direct' CHECK (type IN ('direct','group','channel')),
  participants    TEXT[] NOT NULL DEFAULT '{}',
  last_message    TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  avatar          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_username   TEXT NOT NULL,
  content           TEXT NOT NULL,
  type              TEXT DEFAULT 'text' CHECK (type IN ('text','image','system')),
  reply_to_id       UUID,
  reply_to_content  TEXT,
  reply_to_sender   TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast participant lookups and message ordering
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);

-- Row-level security (permissive — auth is handled by the app layer)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations' AND policyname='conversations_all') THEN
    CREATE POLICY conversations_all ON conversations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages' AND policyname='messages_all') THEN
    CREATE POLICY messages_all ON messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Helper function used by the Vite startup plugin to auto-migrate
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE query; END;
$$;
