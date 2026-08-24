-- Competition question bank v2.
-- Source: /home/ubuntu/upload/quizofcrossfirewiki.rar and verified local/live wiki data.
-- Public competition remains inactive; these rows are published only for the
-- administrator preview gate already implemented in the application.

ALTER TABLE competition_questions
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Retire the five generic preview questions from the previous test bank.
UPDATE competition_questions
SET status = 'archived', updated_at = now()
WHERE id IN (
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1001',
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1002',
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1003',
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1004',
  '3e7f8c4f-4d5d-4f64-8cd1-5e9c3a1c1005'
);

INSERT INTO competition_questions (
  id, kind, question_en, question_ar, options, correct_option,
  accepted_answers, points, audio_url, image_url, source_note, status, sort_order
)
VALUES
(
  'f1000001-0000-4000-8000-000000000001', 'audio',
  'Listen to the clip. Which CrossFire mode is represented by this boss-battle theme?',
  'استمع إلى المقطع. إلى أي وضع في CrossFire ينتمي هذا اللحن الخاص بمعركة الزعيم؟',
  '[{"value":"boss_battle_mode","label_en":"Boss Battle Mode","label_ar":"وضع معركة الزعيم"},{"value":"zombie_mode","label_en":"Zombie Mode","label_ar":"وضع الزومبي"},{"value":"wave_mode","label_en":"Wave Mode","label_ar":"وضع الموجات"},{"value":"weapon_master_tdm","label_en":"Weapon Master TDM","label_ar":"Weapon Master بنمط مواجهات الفرق"}]'::jsonb,
  'boss_battle_mode', '[]'::jsonb, 4,
  '/assets/competition/audio/boss-battle.mp3',
  '/assets/competition/audio-reference/2593211734987944.webp',
  'Archive audio: CrossFire BGM Boss Battle music; image title: Boss Battle - Theme.',
  'published', 10
),
(
  'f1000001-0000-4000-8000-000000000002', 'audio',
  'Listen to the round intro. Which location label is identified by the archive reference?',
  'استمع إلى مقدمة الجولة. ما اسم الموقع الظاهر في مرجع الحزمة؟',
  '[{"value":"chicago","label_en":"Chicago - Round Intro","label_ar":"شيكاغو - مقدمة الجولة"},{"value":"western","label_en":"Western - Round Intro","label_ar":"الغرب - مقدمة الجولة"},{"value":"titan_citadel","label_en":"Titan Citadel - Dr. Haze Boss theme","label_ar":"Titan Citadel - لحن زعيم Dr. Haze"},{"value":"dinner_theater","label_en":"Dinner Theater - Piano","label_ar":"Dinner Theater - مقطوعة البيانو"}]'::jsonb,
  'chicago', '[]'::jsonb, 4,
  '/assets/competition/audio/elimination-chicago-round-intro.mp3',
  '/assets/competition/audio-reference/965521734987943.webp',
  'Archive audio: CrossFire BGM Elimination - Chicago (Round Intro); image title: Chicago - Round Intro.',
  'published', 20
),
(
  'f1000001-0000-4000-8000-000000000003', 'audio',
  'Listen to the round intro. Which location label is identified by the archive reference?',
  'استمع إلى مقدمة الجولة. ما اسم الموقع الظاهر في مرجع الحزمة؟',
  '[{"value":"western","label_en":"Western - Round Intro","label_ar":"الغرب - مقدمة الجولة"},{"value":"chicago","label_en":"Chicago - Round Intro","label_ar":"شيكاغو - مقدمة الجولة"},{"value":"arcadia","label_en":"Arcadia - Final Boss","label_ar":"Arcadia - الزعيم النهائي"},{"value":"devastated_city","label_en":"Devastated City - Blaze","label_ar":"Devastated City - Blaze"}]'::jsonb,
  'western', '[]'::jsonb, 4,
  '/assets/competition/audio/elimination-western-round-intro.mp3',
  '/assets/competition/audio-reference/1233141734987943.webp',
  'Archive audio: CrossFire BGM Elimination - Western (Round Intro); image title: Western - Round Intro.',
  'published', 30
),
(
  'f1000001-0000-4000-8000-000000000004', 'audio',
  'Listen to the clip. Which mode and moment does the archive identify?',
  'استمع إلى المقطع. ما الوضع واللحظة اللذان يحددهما مرجع الحزمة؟',
  '[{"value":"occupation_knife_overtime","label_en":"Occupation Knife Mode - Overtime","label_ar":"Occupation Knife Mode - الوقت الإضافي"},{"value":"capture_knife_mode","label_en":"Capture Knife Mode","label_ar":"Capture Knife Mode"},{"value":"weapon_master_ffa_lose","label_en":"Weapon Master FFA - Lose","label_ar":"Weapon Master بنمط الجميع ضد الجميع - خسارة"},{"value":"shadow_infection","label_en":"Shadow Mode - Infection","label_ar":"Shadow Mode - العدوى"}]'::jsonb,
  'occupation_knife_overtime', '[]'::jsonb, 4,
  '/assets/competition/audio/occupation-knife-overtime.mp3',
  '/assets/competition/audio-reference/4868771734987945.webp',
  'Archive audio: CrossFire BGM Occupation Knife Mode - Overtime music; image title: Occupation Knife Mode - Overtime.',
  'published', 40
),
(
  'f1000001-0000-4000-8000-000000000005', 'audio',
  'Listen to the clip. Which Shadow Mode variant is named by the archive reference?',
  'استمع إلى المقطع. أي نسخة من Shadow Mode يذكرها مرجع الحزمة؟',
  '[{"value":"shadow_infection","label_en":"Shadow Mode - Infection","label_ar":"Shadow Mode - العدوى"},{"value":"shadow_elimination","label_en":"Shadow Mode - Elimination","label_ar":"Shadow Mode - الإقصاء"},{"value":"zombie_mode","label_en":"Zombie Mode","label_ar":"وضع الزومبي"},{"value":"ghost_mode","label_en":"Ghost Mode","label_ar":"وضع الأشباح"}]'::jsonb,
  'shadow_infection', '[]'::jsonb, 4,
  '/assets/competition/audio/shadow-mode-infection.mp3',
  '/assets/competition/audio-reference/1875221734987943.webp',
  'Archive audio: CrossFire BGM Shadow Mode - Infection music; image title: Shadow Mode - Infection.',
  'published', 50
),
(
  'f1000001-0000-4000-8000-000000000006', 'audio',
  'Listen to the clip. Which Wave Mode moment is identified by the archive reference?',
  'استمع إلى المقطع. ما اللحظة المرتبطة بـ Wave Mode التي يحددها مرجع الحزمة؟',
  '[{"value":"wave_lobby","label_en":"Wave Mode - Lobby theme","label_ar":"Wave Mode - موسيقى الردهة"},{"value":"wave_complete","label_en":"Wave Mode - Complete","label_ar":"Wave Mode - إتمام الجولة"},{"value":"boss_battle_theme","label_en":"Boss Battle - Theme","label_ar":"معركة الزعيم - اللحن"},{"value":"emd_lab_bullet_time","label_en":"EMD Lab - Bullet Time","label_ar":"EMD Lab - Bullet Time"}]'::jsonb,
  'wave_complete', '[]'::jsonb, 4,
  '/assets/competition/audio/wave-mode-complete.mp3',
  '/assets/competition/audio-reference/7220351734987942.webp',
  'Archive audio: CrossFire BGM Wave Mode - Complete music; image title: Wave Mode - Lobby theme.',
  'published', 60
),
(
  'f1000001-0000-4000-8000-000000000007', 'audio',
  'Listen to the clip. Which Weapon Master match reference is shown in the archive?',
  'استمع إلى المقطع. ما مرجع مباراة Weapon Master الظاهر في الحزمة؟',
  '[{"value":"weapon_master_ffa_lose","label_en":"Weapon Master FFA - Lose","label_ar":"Weapon Master بنمط الجميع ضد الجميع - خسارة"},{"value":"weapon_master_tdm","label_en":"Weapon Master TDM","label_ar":"Weapon Master بنمط مواجهات الفرق"},{"value":"weapon_master_win","label_en":"Weapon Master - Win","label_ar":"Weapon Master - فوز"},{"value":"team_deathmatch","label_en":"Team Deathmatch","label_ar":"مواجهات الفرق"}]'::jsonb,
  'weapon_master_ffa_lose', '[]'::jsonb, 4,
  '/assets/competition/audio/weapon-master.mp3',
  '/assets/competition/audio-reference/6083651734987943.webp',
  'Archive audio: CrossFire BGM Weapon Master music; image title: Weapon Master FFA - Lose.',
  'published', 70
),
(
  'f1000001-0000-4000-8000-000000000008', 'audio',
  'Listen to the clip. Which Zombie Mode map is named by the final-boss reference?',
  'استمع إلى المقطع. ما خريطة Zombie Mode المذكورة في مرجع الزعيم النهائي؟',
  '[{"value":"arcadia","label_en":"Arcadia - Final Boss","label_ar":"Arcadia - الزعيم النهائي"},{"value":"titan_citadel","label_en":"Titan Citadel - Dr. Haze Boss theme","label_ar":"Titan Citadel - لحن زعيم Dr. Haze"},{"value":"emd_lab","label_en":"EMD Lab - Bullet Time","label_ar":"EMD Lab - Bullet Time"},{"value":"devastated_city","label_en":"Devastated City - Blaze","label_ar":"Devastated City - Blaze"}]'::jsonb,
  'arcadia', '[]'::jsonb, 4,
  '/assets/competition/audio/zombie-arcadia-final-boss.mp3',
  '/assets/competition/audio-reference/4022151734987942.webp',
  'Archive audio: CrossFire BGM Zombie Mode - Arcadia (Final Boss); image title: Zombie Mode - Arcadia (Final Boss).',
  'published', 80
),
(
  'f1000001-0000-4000-8000-000000000009', 'audio',
  'Listen to the clip. Which map and sequence are named by the archive reference?',
  'استمع إلى المقطع. ما الخريطة والمرحلة المذكورتان في مرجع الحزمة؟',
  '[{"value":"emd_lab","label_en":"EMD Lab - Bullet Time","label_ar":"EMD Lab - Bullet Time"},{"value":"arcadia","label_en":"Arcadia - Final Boss","label_ar":"Arcadia - الزعيم النهائي"},{"value":"titan_citadel","label_en":"Titan Citadel - Dr. Haze Boss theme","label_ar":"Titan Citadel - لحن زعيم Dr. Haze"},{"value":"dinner_theater","label_en":"Dinner Theater - Piano","label_ar":"Dinner Theater - مقطوعة البيانو"}]'::jsonb,
  'emd_lab', '[]'::jsonb, 4,
  '/assets/competition/audio/zombie-emd-lab.mp3',
  '/assets/competition/audio-reference/8565861734987941.webp',
  'Archive audio: CrossFire BGM Zombie Mode - EMD Lab music; image title: Symphony No. 1 - Johann Brahms (EMD Lab - Bullet Time).',
  'published', 90
),
(
  'f1000001-0000-4000-8000-000000000010', 'audio',
  'Listen to the clip. Which Zombie Mode map is named by the Dr. Haze boss theme?',
  'استمع إلى المقطع. ما خريطة Zombie Mode المذكورة في لحن زعيم Dr. Haze؟',
  '[{"value":"titan_citadel","label_en":"Titan Citadel - Dr. Haze Boss theme","label_ar":"Titan Citadel - لحن زعيم Dr. Haze"},{"value":"arcadia","label_en":"Arcadia - Final Boss","label_ar":"Arcadia - الزعيم النهائي"},{"value":"devastated_city","label_en":"Devastated City - Blaze","label_ar":"Devastated City - Blaze"},{"value":"emd_lab","label_en":"EMD Lab - Bullet Time","label_ar":"EMD Lab - Bullet Time"}]'::jsonb,
  'titan_citadel', '[]'::jsonb, 4,
  '/assets/competition/audio/zombie-titan-citadel-dr-haze.mp3',
  '/assets/competition/audio-reference/5155311734987941.webp',
  'Archive audio: CrossFire BGM Zombie Mode - Titan Citadel (Dr Haze Boss theme); image title: Titan Citadel - Dr. Haze Boss theme.',
  'published', 100
),
(
  'f1000001-0000-4000-8000-000000000011', 'audio',
  'Listen to the clip. Which Zombie Mode setting is named by the archive reference?',
  'استمع إلى المقطع. ما البيئة المرتبطة بـ Zombie Mode التي يحددها مرجع الحزمة؟',
  '[{"value":"devastated_city","label_en":"Devastated City - Blaze","label_ar":"Devastated City - Blaze"},{"value":"arcadia","label_en":"Arcadia - Final Boss","label_ar":"Arcadia - الزعيم النهائي"},{"value":"titan_citadel","label_en":"Titan Citadel - Dr. Haze Boss theme","label_ar":"Titan Citadel - لحن زعيم Dr. Haze"},{"value":"dinner_theater","label_en":"Dinner Theater - Piano","label_ar":"Dinner Theater - مقطوعة البيانو"}]'::jsonb,
  'devastated_city', '[]'::jsonb, 4,
  '/assets/competition/audio/zombie-devastated-city-atlas-blaze.mp3',
  '/assets/competition/audio-reference/8904881734987941.webp',
  'Archive audio: CrossFire BGM Zombie Mode - Devastated City music; image title: Devastated City - Blaze.',
  'published', 110
),
(
  'f1000001-0000-4000-8000-000000000012', 'audio',
  'Listen to the clip. Which map and musical reference are associated with Dinner Theater?',
  'استمع إلى المقطع. ما الخريطة والمرجع الموسيقي المرتبطان بـ Dinner Theater؟',
  '[{"value":"dinner_theater","label_en":"Dinner Theater - Piano","label_ar":"Dinner Theater - مقطوعة البيانو"},{"value":"emd_lab","label_en":"EMD Lab - Bullet Time","label_ar":"EMD Lab - Bullet Time"},{"value":"chicago","label_en":"Chicago - Round Intro","label_ar":"شيكاغو - مقدمة الجولة"},{"value":"western","label_en":"Western - Round Intro","label_ar":"الغرب - مقدمة الجولة"}]'::jsonb,
  'dinner_theater', '[]'::jsonb, 4,
  '/assets/competition/audio/zombie-dinner-theater.mp3',
  '/assets/competition/audio-reference/7637881734987754.webp',
  'Archive audio: CrossFire BGM Zombie Mode - Dinner Theater music; image title: Air on the G String - Johann Sebastian Bach (Dinner Theater - Piano).',
  'published', 120
),
(
  'f1000001-0000-4000-8000-000000000013', 'multiple_choice',
  'Which entry is the infection variant under the Shadow Mode family in the current modes table?',
  'أي إدخال يمثل نسخة العدوى ضمن عائلة Shadow Mode في جدول الأنماط الحالي؟',
  '[{"value":"Shadow Mode - Infection","label_en":"Shadow Mode - Infection","label_ar":"Shadow Mode - العدوى"},{"value":"Shadow Mode - Elimination","label_en":"Shadow Mode - Elimination","label_ar":"Shadow Mode - الإقصاء"},{"value":"Ghost Mode","label_en":"Ghost Mode","label_ar":"وضع الأشباح"},{"value":"Mutation Mode","label_en":"Mutation Mode","label_ar":"وضع التحور"}]'::jsonb,
  'Shadow Mode - Infection', '[]'::jsonb, 3, NULL, NULL,
  'Verified against the current Supabase modes table on 2026-08-24.',
  'published', 130
),
(
  'f1000001-0000-4000-8000-000000000014', 'multiple_choice',
  'Which current mode name combines Weapon Master with team deathmatch?',
  'أي اسم وضع حالي يجمع بين Weapon Master ومواجهات الفرق؟',
  '[{"value":"Weapon Master TDM","label_en":"Weapon Master TDM","label_ar":"Weapon Master بنمط مواجهات الفرق"},{"value":"Weapon Master Free For All","label_en":"Weapon Master Free For All","label_ar":"Weapon Master بنمط الجميع ضد الجميع"},{"value":"Team Deathmatch","label_en":"Team Deathmatch","label_ar":"مواجهات الفرق"},{"value":"Simulation TDM","label_en":"Simulation TDM","label_ar":"Simulation TDM"}]'::jsonb,
  'Weapon Master TDM', '[]'::jsonb, 3, NULL, NULL,
  'Verified against the current Supabase modes table on 2026-08-24.',
  'published', 140
),
(
  'f1000001-0000-4000-8000-000000000015', 'multiple_choice',
  'Which numbered entry is explicitly listed as the fourth Zombie Mode in the current modes table?',
  'أي إدخال مرقّم مسجل صراحةً بوصفه Zombie Mode 4 في جدول الأنماط الحالي؟',
  '[{"value":"Zombie Mode 4","label_en":"Zombie Mode 4","label_ar":"Zombie Mode 4"},{"value":"Zombie Mode 3","label_en":"Zombie Mode 3","label_ar":"Zombie Mode 3"},{"value":"Zombie Mode Extra","label_en":"Zombie Mode Extra","label_ar":"Zombie Mode Extra"},{"value":"Ranked Zombie Mode","label_en":"Ranked Zombie Mode","label_ar":"Ranked Zombie Mode"}]'::jsonb,
  'Zombie Mode 4', '[]'::jsonb, 3, NULL, NULL,
  'Verified against the current Supabase modes table on 2026-08-24.',
  'published', 150
),
(
  'f1000001-0000-4000-8000-000000000016', 'multiple_choice',
  'Which current modes-table entry is the plain team deathmatch label?',
  'أي إدخال في جدول الأنماط يمثل اسم مواجهات الفرق بصيغته الأساسية؟',
  '[{"value":"Team Deathmatch","label_en":"Team Deathmatch","label_ar":"مواجهات الفرق"},{"value":"Mass Team Deathmatch","label_en":"Mass Team Deathmatch","label_ar":"Mass Team Deathmatch"},{"value":"Simulation TDM","label_en":"Simulation TDM","label_ar":"Simulation TDM"},{"value":"Weapon Master TDM","label_en":"Weapon Master TDM","label_ar":"Weapon Master بنمط مواجهات الفرق"}]'::jsonb,
  'Team Deathmatch', '[]'::jsonb, 3, NULL, NULL,
  'Verified against the current Supabase modes table on 2026-08-24.',
  'published', 160
),
(
  'f1000001-0000-4000-8000-000000000017', 'multiple_choice',
  'Which listed mode is named as a coin-capture activity in the current modes table?',
  'أي وضع مسجل في جدول الأنماط باسم نشاط التقاط العملات؟',
  '[{"value":"Coin Capture","label_en":"Coin Capture","label_ar":"التقاط العملات"},{"value":"Capture Knife Mode","label_en":"Capture Knife Mode","label_ar":"Capture Knife Mode"},{"value":"Free For All","label_en":"Free For All","label_ar":"الجميع ضد الجميع"},{"value":"Supply TDM","label_en":"Supply TDM","label_ar":"Supply TDM"}]'::jsonb,
  'Coin Capture', '[]'::jsonb, 3, NULL, NULL,
  'Verified against the current Supabase modes table on 2026-08-24.',
  'published', 170
),
(
  'f1000001-0000-4000-8000-000000000018', 'weapon',
  'Which option is the West Journey to the West Desert Eagle variant?',
  'أي خيار هو نسخة Desert Eagle الغربية من مجموعة Journey to the West؟',
  '[{"value":"Desert Eagle-Journey to the West","label_en":"Desert Eagle-Journey to the West","label_ar":"Desert Eagle-Journey to the West"},{"value":"Barrett M82A1-Journey to the West","label_en":"Barrett M82A1-Journey to the West","label_ar":"Barrett M82A1-Journey to the West"},{"value":"Dragon Blade-Journey to the West","label_en":"Dragon Blade-Journey to the West","label_ar":"Dragon Blade-Journey to the West"},{"value":"Flashbang-Journey to the West","label_en":"Flashbang-Journey to the West","label_ar":"Flashbang-Journey to the West"}]'::jsonb,
  'Desert Eagle-Journey to the West', '[]'::jsonb, 3, NULL, NULL,
  'Verified by exact name match in weapons-all-data.json; West-labelled catalogue entry.',
  'published', 180
),
(
  'f1000001-0000-4000-8000-000000000019', 'weapon',
  'Which option is the West Journey to the West heavy sniper variant?',
  'أي خيار هو نسخة القناصة الثقيلة الغربية من مجموعة Journey to the West؟',
  '[{"value":"Barrett M82A1-Journey to the West","label_en":"Barrett M82A1-Journey to the West","label_ar":"Barrett M82A1-Journey to the West"},{"value":"Desert Eagle-Journey to the West","label_en":"Desert Eagle-Journey to the West","label_ar":"Desert Eagle-Journey to the West"},{"value":"Grenade-Rank Match Event West","label_en":"Grenade-Rank Match Event West","label_ar":"Grenade-Rank Match Event West"},{"value":"Flashbang-Rank Match Event West","label_en":"Flashbang-Rank Match Event West","label_ar":"Flashbang-Rank Match Event West"}]'::jsonb,
  'Barrett M82A1-Journey to the West', '[]'::jsonb, 3, NULL, NULL,
  'Verified by exact name match in weapons-all-data.json; West-labelled catalogue entry.',
  'published', 190
),
(
  'f1000001-0000-4000-8000-000000000020', 'weapon',
  'Which option names the West melee weapon from the Journey to the West set?',
  'أي خيار يسمي سلاح القتال القريب الغربي من مجموعة Journey to the West؟',
  '[{"value":"Dragon Blade-Journey to the West","label_en":"Dragon Blade-Journey to the West","label_ar":"Dragon Blade-Journey to the West"},{"value":"Flashbang-Journey to the West","label_en":"Flashbang-Journey to the West","label_ar":"Flashbang-Journey to the West"},{"value":"Desert Eagle-Journey to the West","label_en":"Desert Eagle-Journey to the West","label_ar":"Desert Eagle-Journey to the West"},{"value":"Grenade-Rank Match Event West","label_en":"Grenade-Rank Match Event West","label_ar":"Grenade-Rank Match Event West"}]'::jsonb,
  'Dragon Blade-Journey to the West', '[]'::jsonb, 3, NULL, NULL,
  'Verified by exact name match in weapons-all-data.json; West-labelled catalogue entry.',
  'published', 200
),
(
  'f1000001-0000-4000-8000-000000000021', 'weapon',
  'Which option is the West rank-match flashbang entry?',
  'أي خيار هو إدخال القنبلة الضوئية الخاص بفعالية Rank Match في نسخة الغرب؟',
  '[{"value":"Flashbang-Rank Match Event West","label_en":"Flashbang-Rank Match Event West","label_ar":"Flashbang-Rank Match Event West"},{"value":"Flashbang-Journey to the West","label_en":"Flashbang-Journey to the West","label_ar":"Flashbang-Journey to the West"},{"value":"Grenade-Rank Match Event West","label_en":"Grenade-Rank Match Event West","label_ar":"Grenade-Rank Match Event West"},{"value":"Dragon Blade-Journey to the West","label_en":"Dragon Blade-Journey to the West","label_ar":"Dragon Blade-Journey to the West"}]'::jsonb,
  'Flashbang-Rank Match Event West', '[]'::jsonb, 3, NULL, NULL,
  'Verified by exact name match in weapons-all-data.json; West-labelled catalogue entry.',
  'published', 210
),
(
  'f1000001-0000-4000-8000-000000000022', 'weapon',
  'Which option is the West rank-match grenade entry?',
  'أي خيار هو إدخال القنبلة الخاص بفعالية Rank Match في نسخة الغرب؟',
  '[{"value":"Grenade-Rank Match Event West","label_en":"Grenade-Rank Match Event West","label_ar":"Grenade-Rank Match Event West"},{"value":"Flashbang-Rank Match Event West","label_en":"Flashbang-Rank Match Event West","label_ar":"Flashbang-Rank Match Event West"},{"value":"Flashbang-Journey to the West","label_en":"Flashbang-Journey to the West","label_ar":"Flashbang-Journey to the West"},{"value":"Barrett M82A1-Journey to the West","label_en":"Barrett M82A1-Journey to the West","label_ar":"Barrett M82A1-Journey to the West"}]'::jsonb,
  'Grenade-Rank Match Event West', '[]'::jsonb, 3, NULL, NULL,
  'Verified by exact name match in weapons-all-data.json; West-labelled catalogue entry.',
  'published', 220
),
(
  'f1000001-0000-4000-8000-000000000023', 'scenario',
  'Scenario: You are leading a weaker team on Desert Eagle. The opponents are split 3A and 2B, and your teammates will follow a clear call. What is your first information-gathering and rotation plan?',
  'سيناريو: أنت تقود فريقًا أضعف على خريطة Desert Eagle. الخصوم منقسمون 3A و2B، وفريقك سيلتزم بتوجيه واضح. ما خطتك الأولى لجمع المعلومات وتحديد التدوير؟',
  '[]'::jsonb, NULL, '[]'::jsonb, 10, NULL, NULL,
  'User-provided scenario from the original competition prompt; manual review question with no single automatic answer.',
  'published', 230
),
(
  'f1000001-0000-4000-8000-000000000024', 'scenario',
  'Scenario: Your team is playing Ship TDM against a very high-performing opponent who appears suspicious. What fair-play strategy would you use to reduce their impact while gathering reliable evidence?',
  'سيناريو: فريقك يلعب Ship TDM أمام لاعب مرتفع الأداء ويبدو سلوكه مريبًا. ما الاستراتيجية العادلة التي تستخدمها لتقليل تأثيره وجمع ملاحظات موثوقة؟',
  '[]'::jsonb, NULL, '[]'::jsonb, 10, NULL, NULL,
  'User-provided scenario from the original competition prompt; manual review question. The wording avoids declaring that the opponent is cheating.',
  'published', 240
),
(
  'f1000001-0000-4000-8000-000000000025', 'essay',
  'In two or three sentences, explain how your communication should change when a team moves from information gathering to a committed push.',
  'في جملتين أو ثلاث، اشرح كيف يجب أن يتغير تواصلك عندما ينتقل الفريق من جمع المعلومات إلى تنفيذ هجوم متفق عليه.',
  '[]'::jsonb, NULL, '[]'::jsonb, 10, NULL, NULL,
  'Short manual-review essay added to complete the requested 2-3 written questions; no automatic score is assigned.',
  'published', 250
)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind,
  question_en = EXCLUDED.question_en,
  question_ar = EXCLUDED.question_ar,
  options = EXCLUDED.options,
  correct_option = EXCLUDED.correct_option,
  accepted_answers = EXCLUDED.accepted_answers,
  points = EXCLUDED.points,
  audio_url = EXCLUDED.audio_url,
  image_url = EXCLUDED.image_url,
  source_note = EXCLUDED.source_note,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
