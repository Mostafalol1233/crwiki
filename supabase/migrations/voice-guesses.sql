-- Voice Detective (مسابقة محقق الأصوات): community voice guesses.
-- Run once in Supabase SQL Editor. Public can INSERT; only service_role can read.
CREATE TABLE IF NOT EXISTS voice_guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clip TEXT NOT NULL DEFAULT '',
  guess_name TEXT NOT NULL DEFAULT '',
  user_id TEXT DEFAULT '',
  username TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS voice_guesses_clip_idx ON voice_guesses(clip);
ALTER TABLE voice_guesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit voice guess" ON voice_guesses;
CREATE POLICY "Anyone can submit voice guess" ON voice_guesses FOR INSERT WITH CHECK (true);
