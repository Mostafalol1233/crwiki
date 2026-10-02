-- CrossFire Wiki — October 2026 events seed (9 latest forum announcements)
-- Run in Supabase SQL Editor. Idempotent: deletes these 9 by source_url first.
-- Images verified 200 OK on 2026-10-02. Descriptions: EN summary + Egyptian Arabic.

DELETE FROM events WHERE source_url IN (
  'https://forum.z8games.com/discussion/6958479/frights-delights-bonus-october-1st-31st',
  'https://forum.z8games.com/discussion/6958477/ammolite-radiance-october-1st-14th',
  'https://forum.z8games.com/discussion/6958478/classic-to-be-continued-october-1st-6th',
  'https://forum.z8games.com/discussion/6958472/shotgun-week-september-28th-october-4th',
  'https://forum.z8games.com/discussion/6958473/haunting-beasts-weekend-every-weekend-in-october',
  'https://forum.z8games.com/discussion/6958471/honor-glory-september-23rd-october-6th',
  'https://forum.z8games.com/discussion/6958466/cfs-super-fans-september-23rd-october-6th',
  'https://forum.z8games.com/discussion/6958447/elemental-wave-16-september-11th-october-6th',
  'https://forum.z8games.com/discussion/6958437/sentient-scholars-september-2nd-october-6th'
);

INSERT INTO events (title, event_name_slug, title_ar, description, description_ar, date, type, image_url, source_url, featured, seo_title, seo_description) VALUES

-- 1) Frights & Delights Bonus (Oct 1-31)
('Frights & Delights Bonus: October 1st - 31st',
 'frights-delights-bonus-october-2026',
 'بونص الرعب والهدايا: 1 - 31 أكتوبر',
 '<p>October recharge bonus. Your first ZP recharge of the month gets a 50% bonus plus tiered rewards: Eye Spy weapons (Gatling Gun, D.E), bulletproof armor, and crate tickets. Bigger recharge unlocks a bigger tier (up to 100,000+ ZP). First-time buyers also get a name change, Duskira (30 days) and AWM-Eye Spy (30 days).</p><p><strong>Verdict:</strong> the best value recharge event of the month — if you ever buy ZP, do it in October.</p>',
 '<p>ازيكو يا شباب! 🎃 طول شهر أكتوبر أول شحنة ZP في الشهر عليها <strong>50% زيادة</strong> + هدايا على حسب المبلغ (أسلحة Eye Spy + دروع + تذاكر صناديق). كل ما تشحن أكتر الهدايا بتكبر.</p><p><strong>الخلاصة:</strong> لو ناوي تشحن في أي وقت، أكتوبر هو أنسب شهر — البونص ده مش بيتكرر كتير.</p>',
 'October 1st - 31st, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260929_cfwe_zppubonus_forums.jpg',
 'https://forum.z8games.com/discussion/6958479/frights-delights-bonus-october-1st-31st',
 true,
 'Frights & Delights Bonus October 2026 | CrossFire Wiki',
 'October ZP recharge bonus: 50% extra ZP plus Eye Spy weapons, armor and crate tickets.'),

-- 2) Ammolite Radiance (Oct 1-14)
('Ammolite Radiance: October 1st - 14th',
 'ammolite-radiance-october-2026',
 'إيفنت الأموليت: 1 - 14 أكتوبر',
 '<p>New Black Market Ammolite Crate (bundles of 5/10/30/50/100) with AK-47-Scope-Ammolite, M200 CheyTac-Ammolite Dominator, D.E.-S-Ammolite and Shovel-Ammolite. Complete the full collection to claim the [NC] Ammolite namecard and Grenade-Ammolite. Open 300 crates with no permanent weapon and you receive a free random one (free tickets do not count).</p><p><strong>Verdict:</strong> strong crate for collectors — the 300-crate pity makes it safer than usual.</p>',
 '<p>ازيكو يا شباب! 💎 صندوق Ammolite جديد في البلاك ماركت من 1 لـ 14 أكتوبر: AK سكوب + شايتك + ديزرت + جاروف بشكل شيك أوي. جمّع المجموعة كلها وهتاخد نيم كارد + قنبلة Ammolite.</p><p><strong>الخلاصة:</strong> الصندوق ده أمان عن غيره عشان لو فتحت 300 ومطلعش سلاح دايم هيدوك واحد ببلاش. مناسب للي بيجمع الأشكال النادرة.</p>',
 'October 1st - 14th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260928_cfwe_prismaticcrate_forums.jpg',
 'https://forum.z8games.com/discussion/6958477/ammolite-radiance-october-1st-14th',
 true,
 'Ammolite Radiance October 2026 | CrossFire Wiki',
 'New Ammolite Crate: AK-47-Scope, CheyTac Dominator, collection rewards and 300-crate pity.'),

-- 3) Classic To Be Continued (Oct 1-6)
('Classic To Be Continued: October 1st - 6th',
 'classic-to-be-continued-october-2026',
 'وداع السيرفر الكلاسيك: 1 - 6 أكتوبر',
 '<p>Farewell event before the Classic Server closes. Play 30 minutes daily on the Classic Server for a Red Dragon Rifle Crate (up to 3 per day). Play all 5 days for 30 Advanced Red Dragon Crates. Games must be completed; password rooms do not count.</p><p><strong>Verdict:</strong> free crates for playing normally — log in daily and say goodbye in style.</p>',
 '<p>ازيكو يا شباب! 👋 السيرفر الكلاسيك بيقفل، فمن 1 لـ 6 أكتوبر العب نص ساعة كل يوم عليه وهتاخد صندوق Red Dragon (لحد 3 في اليوم)، ولو كملت الخمس أيام هتاخد 30 صندوق Advanced.</p><p><strong>الخلاصة:</strong> هدايا ببلاش على لعبك العادي — ادخل كل يوم وودّع الكلاسيك بشياكة قبل ما يقفل.</p>',
 'October 1st - 6th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260928_cfwe_classicclosing_forums.jpg',
 'https://forum.z8games.com/discussion/6958478/classic-to-be-continued-october-1st-6th',
 false,
 'Classic To Be Continued October 2026 | CrossFire Wiki',
 'Classic Server farewell: daily Red Dragon crates plus 30 Advanced crates for 5 days.'),

-- 4) Shotgun Week (Sep 28 - Oct 4)
('Shotgun Week: September 28th - October 4th',
 'shotgun-week-september-2026',
 'أسبوع الشوتجن: 28 سبتمبر - 4 أكتوبر',
 '<p>Shotgun-only week with 3 objectives: 100 kills in shotgun games, 10 completed shotgun games, and 30 minutes of shotgun games on all 7 days. Finish all three for the Shotgun Week Ribbon + 10 Shotgun Collection 2 Crates.</p><p><strong>Verdict:</strong> easy ribbon for close-range players — shotguns only, so pick your tight maps.</p>',
 '<p>ازيكو يا شباب! 🔫 أسبوع الشوتجن: هات 100 كيل + خلّص 10 أجواء + العب نص ساعة كل يوم من الـ 7 أيام (كله شوتجن بس). لو خلصت التلاتة هتاخد الريبون + 10 صناديق.</p><p><strong>الخلاصة:</strong> ريبون سهل لعشاق القتال القريب — اختار مابات ضيقة وهتخلص بسرعة.</p>',
 'September 28th - October 4th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260915_cfwe_shotgunweek_forum.jpg',
 'https://forum.z8games.com/discussion/6958472/shotgun-week-september-28th-october-4th',
 false,
 'Shotgun Week 2026 | CrossFire Wiki',
 'Shotgun-only objectives for the Shotgun Week Ribbon and 10 collection crates.'),

-- 5) Haunting Beasts Weekend (every weekend in October)
('Haunting Beasts Weekend: Every Weekend in October',
 'haunting-beasts-weekend-october-2026',
 'ويك إند الوحوش: كل ويك إند في أكتوبر',
 '<p>Every October weekend: 200% EXP and GP all weekend, 800% during bonus hours (12-1AM, 6-7AM, 12-1PM, 6-7PM). Play 2 hours each weekend for Fantastic Creatures 2 Crates — rewards grow per weekend completed (3, 9, 15, 21).</p><p><strong>Verdict:</strong> the fastest leveling weeks of the year — plan your grind around the 800% hours.</p>',
 '<p>ازيكو يا شباب! 🐺 كل ويك إند في أكتوبر: 200% خبرة وفلوس طول الوقت، و<strong>800%</strong> في الساعات المميزة (12 بالليل و6 الصبح و12 الضهر و6 المغرب). والعب ساعتين كل ويك إند وهتاخد صناديق بتزيد كل أسبوع (3 ثم 9 ثم 15 ثم 21).</p><p><strong>الخلاصة:</strong> أسرع تلفيل في السنة — ظبط لعبك على ساعات الـ 800% وهتطير في الرانكات.</p>',
 'Every weekend in October 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260925_cfwe_weekendparty_forums.jpg',
 'https://forum.z8games.com/discussion/6958473/haunting-beasts-weekend-every-weekend-in-october',
 false,
 'Haunting Beasts Weekend October 2026 | CrossFire Wiki',
 'October weekends: up to 800% EXP/GP plus growing Fantastic Creatures 2 Crate rewards.'),

-- 6) Honor & Glory (Sep 23 - Oct 6)
('Honor & Glory: September 23rd - October 6th',
 'honor-glory-september-2026',
 'الشرف والمجد: 23 سبتمبر - 6 أكتوبر',
 '<p>Ranked Season 2026-2 (S&D) closing rewards. Platinum to Legendary: 50 Nightbreaker Crates. Mythical/Epical: 100. Titan/Grand Master: everything plus the Honor & Glory Weapons Select Box (AK-47, AWM, Colt 1911, or Knife).</p><p><strong>Verdict:</strong> your season grind literally pays out — push rank before October 6th.</p>',
 '<p>ازيكو يا شباب! 🏆 جوايز قفلة سيزون الرانكد: على حسب رانكك هتاخد صناديق Nightbreaker، ولو Titan أو Grand Master هتاخد كمان صندوق تختار منه سلاح (AK أو AWM أو مسدس أو سكينة).</p><p><strong>الخلاصة:</strong> تعب السيزون كله بيتصرف دلوقتي — إلحق ارفع رانكك قبل 6 أكتوبر.</p>',
 'September 23rd - October 6th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260921_cfwe_honor_glory_s32_forums.jpg',
 'https://forum.z8games.com/discussion/6958471/honor-glory-september-23rd-october-6th',
 false,
 'Honor & Glory Ranked Rewards 2026 | CrossFire Wiki',
 'Season 2026-2 closing rewards: Nightbreaker Crates plus Honor & Glory weapon select box.'),

-- 7) CFS Super Fans (Sep 23 - Oct 6)
('CFS Super Fans: September 23rd - October 6th',
 'cfs-super-fans-september-2026',
 'عشاق CFS: 23 سبتمبر - 6 أكتوبر',
 '<p>CFS esports crates at the Black Market Citrine Well. New Illusion and Wave weapons (QBZ-03, Kar 98K, Kukri, AK-47, M4A1, Colt) plus returning Jupiter/Dominator guns. Part of proceeds funds 2026 esports, and missed pulls convert to exchange coins for guaranteed weapons.</p><p><strong>Verdict:</strong> great for esports fans — the coin exchange removes the worst luck.</p>',
 '<p>ازيكو يا شباب! 🌟 شجع فريقك في بطولة CFS واكسب أسلحة Illusion وWave الجديدة + أسلحة راجعة، وجزء من الفلوس بيدعم بطولات 2026. ولو حظك وحش هتاخد كوينز تبدلها بسلاح مضمون.</p><p><strong>الخلاصة:</strong> حلو لعشاق البطولات — نظام الكوينز بيحميك من سوء الحظ.</p>',
 'September 23rd - October 6th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260915_cfwe_cfsfund_forum.jpg',
 'https://forum.z8games.com/discussion/6958466/cfs-super-fans-september-23rd-october-6th',
 false,
 'CFS Super Fans 2026 | CrossFire Wiki',
 'CFS Citrine Well crates: new Illusion and Wave weapons with exchange-coin guarantee.'),

-- 8) Elemental Wave 16 (Sep 11 - Oct 6)
('Elemental Wave 16: September 11th - October 6th',
 'elemental-wave-16-september-2026',
 'الموجة العنصرية 16: 11 سبتمبر - 6 أكتوبر',
 '<p>Garnet Crate returns with Elemental VIP, Surf16 and 16Bit weapons plus the Elements VIP Weapon Select Box (White Tiger, Azurite Beast, Carapace, Spitfire...). Dismantle unwanted items for points toward one permanent weapon each.</p><p><strong>Verdict:</strong> solid rerun — dismantling makes every pull count toward something.</p>',
 '<p>ازيكو يا شباب! 🌊 صندوق Garnet رجع لحد 6 أكتوبر بأسلحة Elemental وSurf16 و16Bit + صندوق VIP تختار منه. وأي حاجة مش عاجباك فكّها وخد نقط بدل بيها سلاح دايم.</p><p><strong>الخلاصة:</strong> رجعة قوية — نظام التفكيك بيخلي كل فتحة محسوبة ومفيش حاجة بتضيع.</p>',
 'September 11th - October 6th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260902_cfwe_rubycrate_forums.jpg',
 'https://forum.z8games.com/discussion/6958447/elemental-wave-16-september-11th-october-6th',
 false,
 'Elemental Wave 16 2026 | CrossFire Wiki',
 'Garnet Crate rerun: Elemental VIP, Surf16, 16Bit weapons plus dismantle-for-weapon system.'),

-- 9) Sentient Scholars (Sep 2 - Oct 6)
('Sentient Scholars: September 2nd - October 6th',
 'sentient-scholars-september-2026',
 'العلماء الواعين: 2 سبتمبر - 6 أكتوبر',
 '<p>New VIP QBZ-191-S-Sentient plus Stationary weapons at the Black Market Lapis Prospect. The VIP dominates Mutation Mode (Endless Rage + armor-piercing perks) and grants an exclusive namecard + spray. Complete the Stationary set for the collection reward.</p><p><strong>Verdict:</strong> a must-chase for Mutation/Zombie mains — the perks are built for that mode.</p>',
 '<p>ازيكو يا شباب! 📚 سلاح VIP جديد: QBZ-191-S-Sentient + عيلة الـ Stationary في Lapis Prospect. الوحش ده معمول مخصوص لمود الزومبي وهييجي معاه نيم كارد + سبراي حصري. وجمّع كل الـ Stationary وهتاخد مكافأة المجموعة.</p><p><strong>الخلاصة:</strong> لازم لأي حد بيلعب زومبي أساسي — المميزات بتاعته مصممة للمود ده بالذات.</p>',
 'September 2nd - October 6th, 2026', 'announcement',
 'https://z8games.akamaized.net/cfna/web/main/Forum/260812_cfwe_qbz191s_endlessfury_forum.jpg',
 'https://forum.z8games.com/discussion/6958437/sentient-scholars-september-2nd-october-6th',
 false,
 'Sentient Scholars 2026 | CrossFire Wiki',
 'New VIP QBZ-191-S-Sentient and Stationary weapons at the Lapis Prospect.');
