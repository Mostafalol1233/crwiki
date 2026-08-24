-- Private owner-preview competition test data.
-- Public competition remains inactive; the application exposes this only to a
-- verified super-admin token on non-production Vercel deployments.

ALTER TABLE competition_config
  ADD COLUMN IF NOT EXISTS preview_only BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE competition_config
  ADD COLUMN IF NOT EXISTS preview_owner_username TEXT;

UPDATE competition_config
SET active = false,
    preview_only = true,
    preview_owner_username = 'super_admin',
    invite_required = true,
    leaderboard_published = false,
    updated_at = now()
WHERE id = 'default';

INSERT INTO competition_invite_codes (id, label, code_hash, max_uses, uses_count, active, created_by)
VALUES (
  '9a0d72fa-7af1-4df4-8b9f-7b1e3296a0a1',
  'Owner preview test',
  '0e20037e2862952a2ec5cab94483534f23b622ddc120b264ca5b0d48f4e78a9e',
  5,
  0,
  true,
  'super_admin'
)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  code_hash = EXCLUDED.code_hash,
  max_uses = EXCLUDED.max_uses,
  active = EXCLUDED.active,
  created_by = EXCLUDED.created_by;

INSERT INTO competition_questions (id, kind, question_en, question_ar, options, correct_option, accepted_answers, points, source_note, status, sort_order)
VALUES
(
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1001',
  'multiple_choice',
  'Which CrossFire Wiki section is used to browse the weapon catalogue?',
  'أي قسم في CrossFire Wiki يُستخدم لتصفح كتالوج الأسلحة؟',
  '[{"value":"weapons","label_en":"Weapons","label_ar":"الأسلحة"},{"value":"maps","label_en":"Maps","label_ar":"الخرائط"},{"value":"modes","label_en":"Game modes","label_ar":"أوضاع اللعب"},{"value":"ranks","label_en":"Ranks","label_ar":"الرتب"}]'::jsonb,
  'weapons',
  '[]'::jsonb,
  5,
  'Verified against the CrossFire Wiki weapons route in the repository.',
  'published',
  10
),
(
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1002',
  'multiple_choice',
  'What category is assigned to 687 EELL Diamond Pigeon in the current weapon dataset?',
  'ما التصنيف المسجل لسلاح 687 EELL Diamond Pigeon في بيانات الأسلحة الحالية؟',
  '[{"value":"shotgun","label_en":"Shotgun","label_ar":"شوتغن"},{"value":"rifle","label_en":"Rifle","label_ar":"بندقية هجومية"},{"value":"sniper","label_en":"Sniper","label_ar":"قناصة"},{"value":"smg","label_en":"SMG","label_ar":"رشاش خفيف"}]'::jsonb,
  'shotgun',
  '[]'::jsonb,
  5,
  'Verified against the live weapons table row, where the category is Shotgun.',
  'published',
  20
),
(
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1003',
  'multiple_choice',
  'Which mode is categorized as Special in the current wiki dataset?',
  'أي وضع لعب مُصنف ضمن فئة Special في بيانات الويكي الحالية؟',
  '[{"value":"big_head","label_en":"Big Head Mode","label_ar":"وضع الرأس الكبير"},{"value":"bombing","label_en":"Bombing Mode","label_ar":"وضع القصف"},{"value":"bot","label_en":"BOT Mode","label_ar":"وضع الروبوتات"},{"value":"captain","label_en":"Captain Mode","label_ar":"وضع القائد"}]'::jsonb,
  'big_head',
  '[]'::jsonb,
  5,
  'Verified against the live modes table sample used for the preview test.',
  'published',
  30
),
(
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1004',
  'multiple_choice',
  'Which statement about competition proof submissions is correct?',
  'أي عبارة صحيحة عن إرسال إثباتات المسابقة؟',
  '[{"value":"optional","label_en":"Proofs are optional and require administrator approval for bonus points.","label_ar":"الإثباتات اختيارية وتحتاج موافقة المشرف لإضافة نقاط المكافأة."},{"value":"required","label_en":"A proof is required before the quiz can start.","label_ar":"يجب إرسال إثبات قبل بدء الاختبار."},{"value":"automatic","label_en":"Every proof receives automatic bonus points.","label_ar":"كل إثبات يحصل تلقائيًا على نقاط إضافية."},{"value":"public","label_en":"Proof files are publicly visible to everyone.","label_ar":"ملفات الإثبات ظاهرة للعامة."}]'::jsonb,
  'optional',
  '[]'::jsonb,
  5,
  'Verified against the competition page policy and proof-review flow in the repository.',
  'published',
  40
),
(
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1005',
  'essay',
  'In one or two sentences, explain one factor a new player should consider when choosing between a shotgun and a rifle.',
  'في جملة أو جملتين، اشرح عاملًا واحدًا يجب أن يراعيه اللاعب الجديد عند الاختيار بين الشوتغن والبندقية الهجومية.',
  '[]'::jsonb,
  NULL,
  '[]'::jsonb,
  10,
  'Preview-only manual-review question; no invented weapon statistics are required.',
  'published',
  50
)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind,
  question_en = EXCLUDED.question_en,
  question_ar = EXCLUDED.question_ar,
  options = EXCLUDED.options,
  correct_option = EXCLUDED.correct_option,
  accepted_answers = EXCLUDED.accepted_answers,
  points = EXCLUDED.points,
  source_note = EXCLUDED.source_note,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
