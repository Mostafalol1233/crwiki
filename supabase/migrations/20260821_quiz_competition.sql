-- CrossFire Wiki competition schema
-- Apply this migration in Supabase before enabling the public competition flow.

CREATE TABLE IF NOT EXISTS competition_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title_en TEXT NOT NULL DEFAULT 'CrossFire Wiki Competition',
  title_ar TEXT NOT NULL DEFAULT 'مسابقة CrossFire Wiki',
  intro_en TEXT,
  intro_ar TEXT,
  rules_en TEXT,
  rules_ar TEXT,
  score_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT false,
  invite_required BOOLEAN NOT NULL DEFAULT true,
  leaderboard_published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competition_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT,
  code_hash TEXT NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competition_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('multiple_choice', 'audio', 'weapon', 'scenario', 'essay')),
  question_en TEXT NOT NULL,
  question_ar TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option TEXT,
  accepted_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  points NUMERIC(8,2) NOT NULL DEFAULT 1,
  audio_url TEXT,
  weapon_id UUID,
  source_note TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competition_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  invite_code_id UUID REFERENCES competition_invite_codes(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  consent_contact BOOLEAN NOT NULL DEFAULT false,
  objective_score NUMERIC(8,2) NOT NULL DEFAULT 0,
  essay_score NUMERIC(8,2) NOT NULL DEFAULT 0,
  proof_bonus NUMERIC(8,2) NOT NULL DEFAULT 0,
  final_score NUMERIC(8,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'reviewed', 'withdrawn')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competition_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES competition_attempts(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('subscription', 'purchase_receipt', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bonus_points NUMERIC(8,2) NOT NULL DEFAULT 0,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS competition_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  availability_note_en TEXT,
  availability_note_ar TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS competition_questions_status_order_idx ON competition_questions(status, sort_order);
CREATE INDEX IF NOT EXISTS competition_attempts_score_idx ON competition_attempts(final_score DESC, submitted_at ASC);
CREATE INDEX IF NOT EXISTS competition_proofs_attempt_idx ON competition_proofs(attempt_id, status);

ALTER TABLE competition_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competition_config_public_select ON competition_config;
CREATE POLICY competition_config_public_select ON competition_config FOR SELECT USING (active = true);
DROP POLICY IF EXISTS competition_questions_public_select ON competition_questions;
CREATE POLICY competition_questions_public_select ON competition_questions FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS competition_prizes_public_select ON competition_prizes;
CREATE POLICY competition_prizes_public_select ON competition_prizes FOR SELECT USING (published = true);

-- Attempts and proofs are intentionally not publicly selectable. The authenticated
-- server API should validate the invite code, user identity, phone consent, and
-- upload policy before inserting or reading these records. The service key used
-- by the existing admin multiplexer bypasses RLS for administrative review.

INSERT INTO competition_config (id, title_en, title_ar, intro_en, intro_ar, active)
VALUES (
  'default',
  'CrossFire Wiki Competition',
  'مسابقة CrossFire Wiki',
  'A bilingual CrossFire knowledge competition. Registration opens when an administrator publishes the invitation policy.',
  'مسابقة ثنائية اللغة عن لعبة CrossFire. يفتح التسجيل بعد أن ينشر المشرف سياسة الدعوة والاشتراك.',
  false
)
ON CONFLICT (id) DO NOTHING;
