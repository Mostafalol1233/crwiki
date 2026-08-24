-- Correct the weapon-identification questions so every option belongs to the
-- weapon family named in the prompt. The visible label is deliberately neutral;
-- the real weapon name remains in value/label_en for answer validation and image
-- enrichment from the live weapons catalogue.

UPDATE competition_questions
SET
  question_en = 'Which image shows the West Journey to the West Desert Eagle variant?',
  question_ar = 'أي صورة تُظهر نسخة Desert Eagle الغربية من مجموعة Journey to the West؟',
  options = '[
    {"value":"Desert Eagle-Journey to the West","label_en":"Desert Eagle-Journey to the West","label_ar":"Desert Eagle-Journey to the West","display_label_en":"Option A"},
    {"value":"Desert Eagle-Silver","label_en":"Desert Eagle-Silver","label_ar":"Desert Eagle-Silver","display_label_en":"Option B"},
    {"value":"Desert Eagle-Black","label_en":"Desert Eagle-Black","label_ar":"Desert Eagle-Black","display_label_en":"Option C"},
    {"value":"Desert Eagle-Blue Crystal","label_en":"Desert Eagle-Blue Crystal","label_ar":"Desert Eagle-Blue Crystal","display_label_en":"Option D"}
  ]'::jsonb,
  correct_option = 'Desert Eagle-Journey to the West',
  image_url = NULL,
  source_note = 'Corrected visual-identification question: all four options are single Desert Eagle variants from the live weapons catalogue; the Journey to the West entry is the correct option. Visible labels are neutral so the answer is identified from the image.',
  updated_at = now()
WHERE id = 'f1000001-0000-4000-8000-000000000018';

UPDATE competition_questions
SET
  question_en = 'Which image shows the West Journey to the West Barrett M82A1 variant?',
  question_ar = 'أي صورة تُظهر نسخة Barrett M82A1 الغربية من مجموعة Journey to the West؟',
  options = '[
    {"value":"Barrett M82A1-Journey to the West","label_en":"Barrett M82A1-Journey to the West","label_ar":"Barrett M82A1-Journey to the West","display_label_en":"Option A"},
    {"value":"Barrett M82A1-5th Anniversary","label_en":"Barrett M82A1-5th Anniversary","label_ar":"Barrett M82A1-5th Anniversary","display_label_en":"Option B"},
    {"value":"Barrett M82A1-Abyssal Dragon","label_en":"Barrett M82A1-Abyssal Dragon","label_ar":"Barrett M82A1-Abyssal Dragon","display_label_en":"Option C"},
    {"value":"Barrett M82A1-All Spark","label_en":"Barrett M82A1-All Spark","label_ar":"Barrett M82A1-All Spark","display_label_en":"Option D"}
  ]'::jsonb,
  correct_option = 'Barrett M82A1-Journey to the West',
  image_url = NULL,
  source_note = 'Corrected visual-identification question: all four options are Barrett M82A1 variants from the live weapons catalogue; the Journey to the West entry is the correct option. Visible labels are neutral so the answer is identified from the image.',
  updated_at = now()
WHERE id = 'f1000001-0000-4000-8000-000000000019';

UPDATE competition_questions
SET
  question_en = 'Which image shows the West Journey to the West Dragon Blade variant?',
  question_ar = 'أي صورة تُظهر نسخة Dragon Blade الغربية من مجموعة Journey to the West؟',
  options = '[
    {"value":"Dragon Blade-Journey to the West","label_en":"Dragon Blade-Journey to the West","label_ar":"Dragon Blade-Journey to the West","display_label_en":"Option A"},
    {"value":"Dragon Blade","label_en":"Dragon Blade","label_ar":"Dragon Blade","display_label_en":"Option B"},
    {"value":"Dragon Blade-Silver","label_en":"Dragon Blade-Silver","label_ar":"Dragon Blade-Silver","display_label_en":"Option C"},
    {"value":"Dragon Blade-Fury Beast","label_en":"Dragon Blade-Fury Beast","label_ar":"Dragon Blade-Fury Beast","display_label_en":"Option D"}
  ]'::jsonb,
  correct_option = 'Dragon Blade-Journey to the West',
  image_url = NULL,
  source_note = 'Corrected visual-identification question: all four options are Dragon Blade variants from the live weapons catalogue; the Journey to the West entry is the correct option. Visible labels are neutral so the answer is identified from the image.',
  updated_at = now()
WHERE id = 'f1000001-0000-4000-8000-000000000020';

UPDATE competition_questions
SET
  question_en = 'Which image shows the West Rank Match Event flashbang variant?',
  question_ar = 'أي صورة تُظهر نسخة Flashbang الخاصة بفعالية Rank Match في نسخة الغرب؟',
  options = '[
    {"value":"Flashbang-Rank Match Event West","label_en":"Flashbang-Rank Match Event West","label_ar":"Flashbang-Rank Match Event West","display_label_en":"Option A"},
    {"value":"Flashbang-Journey to the West","label_en":"Flashbang-Journey to the West","label_ar":"Flashbang-Journey to the West","display_label_en":"Option B"},
    {"value":"Flashbang-Halloween","label_en":"Flashbang-Halloween","label_ar":"Flashbang-Halloween","display_label_en":"Option C"},
    {"value":"Flashbang-Modern","label_en":"Flashbang-Modern","label_ar":"Flashbang-Modern","display_label_en":"Option D"}
  ]'::jsonb,
  correct_option = 'Flashbang-Rank Match Event West',
  image_url = NULL,
  source_note = 'Corrected visual-identification question: all four options are Flashbang variants from the live weapons catalogue; the West Rank Match Event entry is the correct option. Visible labels are neutral so the answer is identified from the image.',
  updated_at = now()
WHERE id = 'f1000001-0000-4000-8000-000000000021';

UPDATE competition_questions
SET
  question_en = 'Which image shows the West Rank Match Event grenade variant?',
  question_ar = 'أي صورة تُظهر نسخة Grenade الخاصة بفعالية Rank Match في نسخة الغرب؟',
  options = '[
    {"value":"Grenade-Rank Match Event West","label_en":"Grenade-Rank Match Event West","label_ar":"Grenade-Rank Match Event West","display_label_en":"Option A"},
    {"value":"Grenade","label_en":"Grenade","label_ar":"Grenade","display_label_en":"Option B"},
    {"value":"Grenade-Gold","label_en":"Grenade-Gold","label_ar":"Grenade-Gold","display_label_en":"Option C"},
    {"value":"Grenade-Silver","label_en":"Grenade-Silver","label_ar":"Grenade-Silver","display_label_en":"Option D"}
  ]'::jsonb,
  correct_option = 'Grenade-Rank Match Event West',
  image_url = NULL,
  source_note = 'Corrected visual-identification question: all four options are Grenade variants from the live weapons catalogue; the West Rank Match Event entry is the correct option. Visible labels are neutral so the answer is identified from the image.',
  updated_at = now()
WHERE id = 'f1000001-0000-4000-8000-000000000022';
