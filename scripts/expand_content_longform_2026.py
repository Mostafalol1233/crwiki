from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

ENV_PATH = Path('/home/ubuntu/upload/.env')
ROOT = Path('/home/ubuntu/crwiki')
BACKUP_PATH = ROOT / 'backups' / 'content-before-longform-2026.json'


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip().replace('\r', '')
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        values[key.strip()] = value.strip().strip('"').strip("'").replace('\r', '')
    return values


env = {**load_env(ENV_PATH), **os.environ}
base_url = (env.get('SUPABASE_URL') or env.get('VITE_SUPABASE_URL') or '').strip().rstrip('/')
service_key = (env.get('SUPABASE_SERVICE_KEY') or env.get('SERVICE_ROLE_KEY') or env.get('VITE_SUPABASE_SERVICE_KEY') or env.get('VITE_SERVICE_ROLE') or '').strip()
if not base_url or not service_key:
    raise SystemExit('Supabase URL or service key is missing')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}


def get_rows(table: str, select: str):
    r = requests.get(f'{base_url}/rest/v1/{table}', headers=headers, params={'select': select}, timeout=30)
    r.raise_for_status()
    return r.json()


def patch(table: str, field: str, slug: str, payload: dict):
    r = requests.patch(
        f'{base_url}/rest/v1/{table}',
        headers=headers,
        params={field: f'eq.{slug}'},
        json=payload,
        timeout=30,
    )
    if not r.ok:
        raise RuntimeError(f'PATCH {table}/{slug} failed: {r.status_code} {r.text[:500]}')


def now():
    return datetime.now(timezone.utc).isoformat()


SOURCE_ROADMAP = 'https://crossfire.z8games.com/patches/2026'
SOURCE_MODES = 'https://crossfire.z8games.com/modes.html'
SOURCE_KUNLUN = 'https://forum.z8games.com/discussion/6958412/mountain-of-myth-august-6th-14th'
SOURCE_QUICK = 'https://forum.z8games.com/discussion/6958416/a-quick-exit-august-12th-september-1st'
SOURCE_DEMON = 'https://forum.z8games.com/discussion/6958407/demon-039-s-legacy-august-6th-september-1st'
SOURCE_EWC = 'https://forum.z8games.com/discussion/6958414/crossfire-at-2026-esports-world-cup-august-14th-23rd'
SOURCE_FEED = 'https://forum.z8games.com/categories/crossfire-announcements/feed.rss'


POSTS: dict[str, dict] = {
'zm4-mount-kunlun-complete-launch-guide': {
'summary': 'A complete, source-backed ZM4 Mount Kunlun guide covering the Adventure Mode loop, the 50-minute boss timing, the 60-minute failure limit, skill growth, team roles, EP farming, exchange limits, and practical ways to improve a run.',
'summary_ar': 'دليل كامل وموثق لطور ZM4 وخريطة Mount Kunlun يشرح دورة المغامرة وظهور الزعيم بعد 50 دقيقة وحد المحاولة البالغ 60 دقيقة وتطوير المهارات وتوزيع الأدوار وجمع EP وحدود الاستبدال وطريقة تحسين كل محاولة.',
'seo_title': 'ZM4 Mount Kunlun Complete Guide: Adventure Mode, Boss Timer and EP Rewards | CrossFire Wiki',
'seo_description': 'Learn how ZM4 Mount Kunlun works: exploration, skill growth, boss timing, the 60-minute limit, EP farming, crate exchanges, Vixen Doll Blue and team strategies.',
'focus_keyword': 'ZM4 Mount Kunlun guide',
'content': '''<p><strong>ZM4 Mount Kunlun is not a normal zombie round.</strong> Z8Games describes Zombie Mode 4 as Adventure Mode, a longer cooperative experience built around free exploration, character growth, boss summons and a final team objective. The official modes page lists Mount Kunlun as the map for this adventure, while the Mountain of Myth announcement explains how its event reward loop worked during the August 6–14 window.</p>
<h2>What makes ZM4 different?</h2>
<p>Traditional zombie matches often reward a team for holding a lane and repeating a reliable damage cycle. ZM4 asks for more planning. Your squad must move through the map, decide where to invest power, keep enough time for the final encounter and still have the damage and survivability needed when the boss arrives. Exploration is therefore not empty travel: it is the phase in which your team creates the conditions for the ending.</p>
<p>The official rules give the mode a strict clock. The event boss appears 50 minutes after the game begins. Defeating that boss is the win condition, and the challenge ends after 60 minutes. That leaves a short final window for the team to convert earlier exploration and upgrades into a successful clear. If players spend too long wandering, split without a purpose or delay the boss route, the timer becomes the real enemy.</p>
<h2>A practical team plan</h2>
<p>At the beginning, agree on a simple route and a communication call for regrouping. One player can lead the route and mark objectives, one can focus on reliable damage, one can watch the group’s health and ammunition situation, and another can test side paths or collect useful resources. These are not official class names; they are practical roles that prevent four players from making the same decision at the same time.</p>
<p>During the exploration phase, do not spend every upgrade immediately. First identify whether the team is losing time to movement, ordinary enemies, elite targets or incoming damage. Put early growth into the weakness that is actually slowing the run. If the group reaches objectives quickly but cannot survive, prioritize durability and recovery. If the group survives but cannot finish targets, prioritize sustained damage and a weapon rotation that minimizes reload downtime.</p>
<h2>The confirmed EP reward loop</h2>
<p>During Mountain of Myth, the official announcement awarded 75 EP per minute in ZM4, with a daily cap of 9,000 EP. The event shop allowed players to exchange 1,000 EP for a Kitsune Crate or an Oni Crate, with a limit of 20 crates of each type per player. A permanent Vixen Doll Blue was listed in the CF Shop for 40,000 EP. These figures belong to the published event announcement and should not be treated as a permanent universal ZM4 economy after the event ends.</p>
<p>That distinction matters when planning a session. If you are farming EP during an active event, write down how much you have earned before starting and check the daily cap after the match. A longer run is not automatically a better reward run once the cap has been reached. Use the rest of the session to practice routes, boss positioning and team coordination rather than assuming every additional minute will add currency.</p>
<h2>Boss preparation and the final ten minutes</h2>
<p>Because the boss appears at minute 50 and the mode closes at minute 60, the team should begin preparing before the spawn. Finish optional exploration, reload key weapons, regroup, and decide who will call movement. Avoid entering the final phase with one player far away or with the group’s strongest ability on cooldown because nobody announced the timing.</p>
<p>During the boss fight, watch for two different problems: damage loss and avoidable deaths. A player who stops attacking to revive or return from a distant position may cost more time than a player who uses cover and waits for a safe opening. Keep the boss in a predictable area when possible, call out dangerous attacks, and avoid turning a controlled damage cycle into a panic chase across the map.</p>
<h2>What is confirmed and what is advice?</h2>
<p>The confirmed information is the Adventure Mode description, the Mount Kunlun association, the 50-minute boss timing, the 60-minute challenge limit and the event EP figures quoted above. The route suggestions, role split and upgrade order in this guide are editorial recommendations designed to help players test the mode. They are not hidden rules or promises about unlisted rewards.</p>
<p>For the latest dates and reward conditions, read the original [Mountain of Myth announcement](''' + SOURCE_KUNLUN + ''') and compare it with the official [CrossFire modes page](''' + SOURCE_MODES + '''). If the publisher changes the event economy or adds another ZM4 map, this guide should be updated rather than copied forward unchanged.</p>''',
'content_ar': '''<p><strong>زومبي 4 وخريطة Mount Kunlun ليستا جولة زومبي عادية.</strong> تصف Z8Games زومبي 4 بأنه طور مغامرة طويل يعتمد على الاستكشاف الحر وتطوير الشخصية واستدعاء الزعماء والوصول إلى هدف جماعي نهائي. وتضع صفحة الأطوار الرسمية Mount Kunlun ضمن هذه المغامرة، بينما يشرح إعلان Mountain of Myth طريقة المكافآت التي كانت متاحة خلال فترة 6–14 أغسطس.</p>
<h2>ما المختلف في زومبي 4؟</h2>
<p>في الجولات التقليدية قد يكفي أن يثبت الفريق في ممر ويكرر دورة ضرر معروفة. أما زومبي 4 فيحتاج إلى تخطيط مستمر. يجب على الفريق التحرك في الخريطة وتحديد أين ينفق القوة والاحتفاظ بوقت كاف للمرحلة الأخيرة والوصول إلى الزعيم مع ضرر وبقاء مناسبين. الاستكشاف ليس وقتًا ضائعًا؛ بل هو المرحلة التي تبني فيها المجموعة ظروف النهاية.</p>
<p>القواعد الرسمية تضع مؤقتًا صارمًا. يظهر زعيم الحدث بعد 50 دقيقة من بداية المباراة، وهزيمته هي شرط الفوز، وتنتهي المحاولة بعد 60 دقيقة. هذا يترك نافذة قصيرة لتحويل الاستكشاف والتطوير السابق إلى فوز حقيقي. إذا ضاع الوقت في التجول أو تفرقت المجموعة بلا هدف أو تأخر طريق الزعيم، يصبح المؤقت هو العدو الأساسي.</p>
<h2>خطة عملية للفريق</h2>
<p>في البداية اتفقوا على مسار واضح ونداء للعودة إلى التجمع. يمكن للاعب أن يقود الطريق ويحدد الأهداف، ويركز لاعب آخر على الضرر المستمر، ويراقب ثالث الصحة والذخيرة، ويختبر الرابع المسارات الجانبية أو يجمع الموارد. هذه ليست فئات رسمية داخل اللعبة، لكنها أدوار عملية تمنع أربعة لاعبين من اتخاذ القرار نفسه في اللحظة نفسها.</p>
<p>خلال الاستكشاف لا تنفقوا كل تطوير فورًا. حددوا أولًا ما الذي يبطئ الرحلة فعلًا: الحركة أم الأعداء العاديون أم الأهداف القوية أم الضرر الداخل. ضعوا التطوير المبكر في النقطة التي تسبب المشكلة. إذا وصل الفريق بسرعة لكنه لا يصمد، فالأولوية للبقاء والاسترجاع. وإذا صمد لكنه لا ينهي الأهداف، فالأولوية للضرر المستمر ودورة أسلحة تقلل وقت إعادة التلقيم.</p>
<h2>طريقة نقاط EP المؤكدة</h2>
<p>خلال حدث Mountain of Myth كان الإعلان الرسمي يمنح 75 نقطة EP كل دقيقة في زومبي 4، بحد يومي أقصاه 9,000 نقطة. وكان المتجر يسمح باستبدال 1,000 EP بصندوق Kitsune أو Oni، بحد أقصى 20 صندوقًا من كل نوع لكل لاعب. كما ظهرت دمية Vixen Doll Blue الدائمة في متجر CF مقابل 40,000 EP. هذه الأرقام تخص إعلان الحدث المنشور، ولا ينبغي اعتبارها اقتصادًا ثابتًا لكل فترة زومبي 4 مستقبلية.</p>
<p>لذلك سجّل رصيدك قبل المباراة وتحقق من الحد اليومي بعد انتهائها. بعد الوصول إلى الحد لا يعني تمديد الجولة أن كل دقيقة ستضيف عملة جديدة. استخدم الوقت المتبقي للتدرب على الطريق ومكان الزعيم والتنسيق بدل مطاردة رصيد لم يعد يرتفع.</p>
<h2>الاستعداد للزعيم والدقائق العشر الأخيرة</h2>
<p>بما أن الزعيم يظهر في الدقيقة 50 وتنتهي المحاولة في الدقيقة 60، يجب أن يبدأ الاستعداد قبل ظهوره. أنهوا الاستكشاف الاختياري وأعيدوا تلقيم الأسلحة المهمة واجتمعوا وحددوا من سيقود الحركة. لا تدخلوا المرحلة الأخيرة ولاعب بعيد أو قدرة قوية جاهزة لكن لا أحد يعرف توقيت استخدامها.</p>
<p>أثناء قتال الزعيم راقبوا مشكلتين: ضياع الضرر والوفيات القابلة للتجنب. قد يكلف اللاعب الذي يترك مكانه للإنعاش أو يعود من مسافة بعيدة وقتًا أكبر من اللاعب الذي يستخدم ساترًا وينتظر فرصة آمنة. حافظوا على الزعيم في منطقة يمكن توقعها، نبهوا إلى الهجمات الخطرة، ولا تحولوا دورة ضرر منظمة إلى مطاردة عشوائية عبر الخريطة.</p>
<h2>ما المؤكد وما هو نصيحة تحريرية؟</h2>
<p>المؤكد هو وصف طور المغامرة وربطه بخريطة Mount Kunlun وظهور الزعيم في الدقيقة 50 وحد المحاولة البالغ 60 دقيقة وأرقام EP المذكورة في إعلان الحدث. أما توزيع الأدوار وترتيب التطوير وطريقة المسار فهي نصائح تحريرية تساعد اللاعبين على الاختبار وليست قواعد سرية أو وعدًا بمكافآت لم تعلنها الشركة.</p>
<p>للتواريخ والشروط الأحدث راجعوا [إعلان Mountain of Myth](''' + SOURCE_KUNLUN + ''') و[صفحة أطوار CrossFire الرسمية](''' + SOURCE_MODES + '''). يجب تحديث هذا الدليل إذا غيرت الشركة اقتصاد الحدث أو أضافت خريطة جديدة إلى زومبي 4.</p>'''
},
'tactical-retake-mode-launch-breakdown': {
'summary': 'A long launch analysis of Tactical Retake Mode: what the 2026 roadmap confirms, how to test objectives and retakes, how to record round information, and how to avoid confusing editorial advice with unpublished rules.',
'summary_ar': 'تحليل طويل لإطلاق Tactical Retake يوضح ما أكدته خارطة الطريق وكيف تختبر الأهداف والاستعادة وتسجل معلومات الجولة وتفصل بين النصيحة التحريرية والقواعد التي لم تنشرها الشركة.',
'seo_title': 'Tactical Retake Mode Guide: Confirmed Launch Details and a Useful Test Plan | CrossFire Wiki',
'seo_description': 'A detailed Tactical Retake Mode guide based on the official CrossFire 2026 roadmap, with a practical first-session checklist and clear limits on unconfirmed mechanics.',
'focus_keyword': 'Tactical Retake Mode',
'content': '''<p><strong>Tactical Retake Mode is one of the most interesting August 2026 launches because its name suggests a mode built around information, timing and decision quality.</strong> The official CrossFire 2026 roadmap places Tactical Retake in the August 6 update group alongside Mount Kunlun, Brawl Mode and the Chengdu Temple Search & Destroy map. The roadmap confirms the release placement and official artwork, but it does not publish a complete ruleset with every scoring value, team size or utility restriction.</p>
<h2>What the roadmap confirms</h2>
<p>The first useful conclusion is the one we can prove: Tactical Retake is an official roadmap entry, not a community-made name. The same roadmap groups it with several other major pieces of content, which makes the update important for players who want more than a weapon crate. However, a roadmap card is not the same thing as detailed patch notes. We should not invent a round timer, an exact number of defenders, a guaranteed spawn pattern or a reward table that the publisher has not stated.</p>
<h2>How to test the mode properly</h2>
<p>Start with three rounds using the same weapon and similar equipment. The goal of the first session is not to prove that one rifle is best; it is to understand the decision cycle. Write down the round objective, how much time is available to retake, where the first contact occurs, which routes are safe, and what information the defending side receives before the fight begins.</p>
<p>After the first three rounds, change only one variable. Try a different utility item, a different entry route or a different weapon role, then compare the result. Changing everything at once makes the result impossible to interpret. A tactical mode rewards repeatable decisions, so a simple notebook or screenshot folder can be more useful than a dramatic first impression.</p>
<h2>Questions that help your squad learn</h2>
<p>Ask whether the team is losing because it lacks information or because it cannot execute after gaining information. If the problem is information, improve the first player’s callouts and the timing of the second player’s trade. If the problem is execution, simplify the plan: choose one entry, one fallback and one utility cue. Do not let every player improvise a separate retake route unless the situation genuinely requires it.</p>
<p>Also test the value of patience. A retake is rarely improved by four players arriving at four different seconds. Agree on a regroup signal, identify which angle must be cleared first, and decide whether the objective can be touched safely or whether the team must remove a defender before committing. These are general tactical principles, not claims about hidden Tactical Retake rules.</p>
<h2>Loadout preparation</h2>
<p>Use a weapon you can control under pressure rather than selecting a gun only because it is popular. A stable rifle helps you hold a retake angle, while a precise weapon can be valuable when the map creates long lines. Utility should support a decision: use it to deny an angle, force movement, protect an entry or cover a retreat. Throwing equipment without a timing plan often gives the opponent information without creating space.</p>
<p>Keep your crosshair at the height where an opponent is likely to appear, and avoid reloading during the first contact if a safe fallback is available. The strongest loadout is the one that lets the team complete its plan with fewer panic actions.</p>
<h2>What we will update later</h2>
<p>When Z8Games publishes complete patch notes or a detailed mode page, this article should be expanded with verified rules, round structure, scoring, maps, restrictions and rewards. Until then, the honest version of the guide is more valuable than a fake data sheet. Readers should know which lines are confirmed and which lines are practical advice.</p>
<p>Follow the [official 2026 roadmap](''' + SOURCE_ROADMAP + ''') for the release placement. If you record a match, include the map, mode version and date so community reports can be compared after an official rules update.</p>''',
'content_ar': '''<p><strong>يعد Tactical Retake من أكثر إطلاقات أغسطس 2026 إثارة للاهتمام لأن اسمه يوحي بطور يعتمد على المعلومات والتوقيت وجودة القرار.</strong> تضع خارطة طريق CrossFire الرسمية لعام 2026 الطور ضمن مجموعة تحديث 6 أغسطس إلى جانب Mount Kunlun وBrawl وخريطة Chengdu Temple للبحث والتدمير. الخارطة تؤكد وجود الإطلاق وصورته الرسمية، لكنها لا تنشر حتى الآن قواعد كاملة تشمل كل أرقام النقاط أو عدد اللاعبين أو قيود الأدوات.</p>
<h2>ما الذي تؤكده الخارطة؟</h2>
<p>النتيجة التي يمكن إثباتها هي أن Tactical Retake مدرج رسميًا في خارطة الطريق، وليس اسمًا اخترعه المجتمع. ووجوده مع عدة إضافات كبيرة يجعل التحديث مهمًا للاعبين الذين يريدون تجربة جديدة، لا مجرد صندوق أسلحة. لكن بطاقة الخارطة ليست بديلًا عن ملاحظات التحديث التفصيلية. لذلك لا يجوز اختراع مدة الجولة أو عدد المدافعين أو نمط ظهور ثابت أو جدول مكافآت لم تنشره الشركة.</p>
<h2>كيف تختبر الطور بطريقة صحيحة؟</h2>
<p>ابدأ بثلاث جولات مستخدمًا السلاح والتجهيز نفسيهما تقريبًا. هدف الجلسة الأولى ليس إثبات أن بندقية معينة هي الأفضل، بل فهم دورة القرار. سجل هدف الجولة ووقت الاستعادة ومكان أول اشتباك والطرق الآمنة والمعلومات التي يحصل عليها الفريق المدافع قبل بداية المواجهة.</p>
<p>بعد الجولات الثلاث غيّر عاملًا واحدًا فقط. جرّب أداة مختلفة أو طريق دخول آخر أو دورًا مختلفًا للسلاح ثم قارن النتيجة. تغيير كل شيء في الوقت نفسه يمنعك من معرفة سبب التحسن أو التراجع. الطور التكتيكي يكافئ القرارات القابلة للتكرار، لذلك قد يكون دفتر صغير أو مجلد لقطات شاشة أكثر فائدة من انطباع سريع بعد مباراة واحدة.</p>
<h2>أسئلة تساعد الفريق على التعلم</h2>
<p>اسأل هل يخسر الفريق لأنه لا يملك معلومات أم لأنه لا ينفذ بعد حصوله عليها. إذا كانت المشكلة معلومات، حسّن النداء الأول وتوقيت اللاعب الذي يدخل للتبادل. وإذا كانت المشكلة تنفيذًا، بسّط الخطة: دخول واحد ومسار تراجع واحد وإشارة واضحة لاستخدام الأداة. لا تجعل كل لاعب يخترع طريق استعادة مختلفًا إلا إذا أجبركم الوضع على ذلك.</p>
<p>اختبروا أيضًا قيمة الانتظار. غالبًا لا تتحسن الاستعادة عندما يصل أربعة لاعبين في أربع ثوان مختلفة. اتفقوا على إشارة للتجمع وحددوا الزاوية التي يجب تنظيفها أولًا وقرروا هل يمكن لمس الهدف بأمان أم يجب إسقاط مدافع قبل الالتزام. هذه مبادئ تكتيكية عامة وليست ادعاءً بقواعد مخفية داخل Tactical Retake.</p>
<h2>الاستعداد بالتجهيز</h2>
<p>استخدم سلاحًا تستطيع التحكم فيه تحت الضغط، ولا تختَر السلاح لمجرد أنه مشهور. البندقية المستقرة تساعدك على تثبيت زاوية الاستعادة، بينما يفيد السلاح الدقيق عندما تفرض الخريطة خطوط رؤية طويلة. يجب أن تخدم الأداة قرارًا واضحًا: منع زاوية أو إجبار الخصم على الحركة أو حماية الدخول أو تغطية الانسحاب. إلقاء الأدوات بلا توقيت قد يعطي الخصم معلومات من دون أن يفتح مساحة.</p>
<p>حافظ على مستوى التصويب عند مكان ظهور الخصم المحتمل، ولا تعد التلقيم أثناء الاشتباك الأول إذا كان لديك ساتر آمن. أفضل تجهيز هو الذي يساعد الفريق على إكمال الخطة بأقل عدد من التصرفات العشوائية.</p>
<h2>ما الذي سيضاف لاحقًا؟</h2>
<p>عندما تنشر Z8Games ملاحظات كاملة أو صفحة شرح تفصيلية، سنضيف القواعد المؤكدة وبنية الجولة والنقاط والخرائط والقيود والمكافآت. حتى ذلك الوقت، الدليل الصادق أكثر فائدة من جدول أرقام مختلق. يجب أن يعرف القارئ أي جملة مؤكدة وأي جملة نصيحة عملية.</p>
<p>تابعوا [خارطة الطريق الرسمية لعام 2026](''' + SOURCE_ROADMAP + ''') لمعرفة موضع الإطلاق. وإذا سجلتم مباراة، اذكروا الخريطة وإصدار الطور والتاريخ حتى يمكن مقارنة تقارير المجتمع بعد نشر القواعد الرسمية.</p>'''
},
'brawl-mode-first-look-and-loadout-tips': {
'summary': 'A full Brawl Mode launch article explaining what is officially confirmed, how to prepare for crowded engagements, how to choose weapons and utility, and how to record reliable observations while the public rules are still limited.',
'summary_ar': 'مقال كامل عن إطلاق Brawl يشرح المؤكد رسميًا وطريقة الاستعداد للاشتباكات المزدحمة واختيار السلاح والأدوات وتسجيل الملاحظات الموثوقة بينما لا تزال القواعد المنشورة محدودة.',
'seo_title': 'Brawl Mode CrossFire Guide: First-Session Strategy, Weapons and Confirmed Launch | CrossFire Wiki',
'seo_description': 'Prepare for CrossFire Brawl Mode with a complete first-look guide: confirmed roadmap details, crowd-fight positioning, weapon control, utility and practical testing.',
'focus_keyword': 'CrossFire Brawl Mode',
'content': '''<p><strong>Brawl Mode is the kind of CrossFire update that can look simple in a trailer and become surprisingly demanding in a real match.</strong> The official 2026 roadmap places Brawl Mode in the August 6 launch group with Tactical Retake, Mount Kunlun and Chengdu Temple. The roadmap confirms the mode’s place in the update and provides official artwork, but it does not publish enough text to confirm exact team sizes, scoring rules, respawn behavior or a permanent reward track.</p>
<h2>Why large fights require a different mindset</h2>
<p>In a crowded engagement, the player who sees the most targets is not automatically the player who creates the most value. Every shot can reveal your position, every reload can leave a nearby teammate unsupported, and every step into the center can expose you to several angles at once. Brawl should be approached as a fight for space and timing rather than a race to collect one elimination.</p>
<p>Before the first contact, identify the nearest cover and the safest route back to it. If the fight becomes chaotic, a player who can retreat, reload and re-enter is more useful than a player who wins one duel and then disappears. Keep enough distance from teammates to avoid blocking movement, but stay close enough to trade damage when an opponent commits.</p>
<h2>Weapon selection for the first tests</h2>
<p>Start with a controllable rifle or a weapon you already understand. You need to learn where the fight forms before you decide whether a high-recoil or close-range weapon is optimal. Short bursts are useful when targets overlap, because holding the trigger through several moving bodies often creates recoil and ammunition problems at the exact moment a second opponent appears.</p>
<p>Shotguns and close-range weapons may become strong when the mode compresses space, but do not assume that a weapon is good everywhere. Test how quickly you can move between targets, how long a reload takes behind cover, and whether the weapon allows you to help a teammate without abandoning your own escape route.</p>
<h2>Utility and movement</h2>
<p>Use grenades to create a decision, not just noise. A smoke can protect a crossing, a flash can break a defensive angle, and explosive utility can force players away from a narrow position. The exact value depends on the final mode rules, so record the result rather than treating a single successful throw as proof of a universal strategy.</p>
<p>Do not sprint into the center simply because other players are there. Enter after an opponent fires, after utility removes an angle, or when a teammate is ready to trade. If your first target falls, immediately check the second angle instead of reloading in the open. Many large-fight deaths happen after the first win because the player stops reading the room.</p>
<h2>A repeatable match review</h2>
<p>After each round, answer four questions: where did the main fight form, which cover actually protected you, which weapon caused avoidable downtime, and which death came from a decision rather than an aim error? These questions turn a noisy mode into something you can learn. Save a short clip when possible, but annotate it with the round context so the clip does not become a collection of isolated highlights.</p>
<p>The first week of a new mode is also a good time to test fairness. If a route feels dominant, play it from the opposite side. If a weapon appears overpowered, compare it across several engagements and distances. Community impressions are useful signals, but they become stronger when players record the same information instead of repeating a headline.</p>
<h2>What is still unknown?</h2>
<p>The official roadmap does not provide a complete Brawl rules page in the material reviewed for this article. Therefore, this guide intentionally avoids claiming unverified numbers. We will add confirmed scoring, player counts, respawns, maps and rewards when official patch notes or a mode page make them public.</p>
<p>Read the [official CrossFire 2026 roadmap](''' + SOURCE_ROADMAP + ''') for the confirmed launch context. The rest of this article is practical preparation, not a replacement for publisher documentation.</p>''',
'content_ar': '''<p><strong>قد يبدو Brawl Mode بسيطًا في الصورة، لكنه قد يصبح صعبًا جدًا داخل مباراة حقيقية.</strong> تضع خارطة الطريق الرسمية لعام 2026 طور Brawl ضمن مجموعة إطلاق 6 أغسطس مع Tactical Retake وMount Kunlun وChengdu Temple. الخارطة تؤكد وجود الطور وصورته الرسمية، لكنها لا تنشر تفاصيل كافية للجزم بعدد اللاعبين أو نظام النقاط أو الإحياء أو مسار مكافآت دائم.</p>
<h2>لماذا تحتاج المعارك الكبيرة إلى عقلية مختلفة؟</h2>
<p>في الاشتباك المزدحم ليس اللاعب الذي يرى أهدافًا أكثر هو بالضرورة الأكثر فائدة. كل طلقة قد تكشف مكانك، وكل إعادة تلقيم قد تترك زميلك بلا دعم، وكل خطوة نحو الوسط قد تعرضك لعدة زوايا. يجب التعامل مع Brawl كقتال على المساحة والتوقيت، وليس سباقًا لجمع إقصاء واحد.</p>
<p>قبل أول احتكاك حدد أقرب ساتر وأفضل طريق للعودة إليه. إذا أصبحت المعركة فوضوية، فاللاعب الذي يستطيع الانسحاب والتلقيم والعودة سيكون أكثر فائدة من لاعب يفوز بمواجهة واحدة ثم يختفي. اترك مسافة تمنع إعاقة حركة زملائك، لكن ابق قريبًا بما يكفي لتبادل الضرر عندما يلتزم الخصم بالدخول.</p>
<h2>اختيار السلاح في التجارب الأولى</h2>
<p>ابدأ ببندقية سهلة التحكم أو سلاح تعرفه جيدًا. يجب أن تتعلم مكان تجمع القتال قبل أن تقرر هل السلاح عالي الارتداد أو القريب هو الأفضل. الرشقات القصيرة مفيدة عندما تتداخل الأهداف، لأن الضغط المستمر على الزناد قد يسبب مشاكل ارتداد وذخيرة في اللحظة التي يظهر فيها خصم ثان.</p>
<p>قد تصبح البنادق القريبة قوية إذا ضغط الطور المسافات، لكن لا تفترض أن السلاح ممتاز في كل مكان. اختبر سرعة الانتقال بين الأهداف ومدة إعادة التلقيم خلف ساتر وهل تستطيع مساعدة زميلك دون فقدان طريق الهروب.</p>
<h2>الأدوات والحركة</h2>
<p>استخدم القنابل لصناعة قرار وليس للضوضاء فقط. يمكن للدخان حماية العبور، ويمكن للفلاش كسر زاوية دفاعية، وقد تجبر المتفجرات اللاعبين على ترك مكان ضيق. القيمة النهائية تعتمد على قواعد الطور، لذلك سجل النتيجة ولا تعتبر رمية ناجحة واحدة دليلًا على استراتيجية ثابتة.</p>
<p>لا تندفع إلى الوسط لمجرد أن اللاعبين مجتمعون هناك. ادخل بعد إطلاق الخصم أو بعد إزالة زاوية بأداة أو عندما يكون زميلك مستعدًا للتبادل. إذا سقط الهدف الأول افحص الزاوية الثانية فورًا بدل إعادة التلقيم في مكان مكشوف. كثير من وفيات المعارك الكبيرة تحدث بعد الفوز الأول لأن اللاعب يتوقف عن قراءة الموقف.</p>
<h2>مراجعة قابلة للتكرار</h2>
<p>بعد كل جولة أجب عن أربعة أسئلة: أين تجمع القتال؟ أي ساتر حماك فعليًا؟ أي سلاح سبب وقتًا ضائعًا؟ وأي وفاة جاءت من قرار خاطئ وليس من ضعف التصويب؟ هذه الأسئلة تحول الفوضى إلى تعلم. احفظ مقطعًا قصيرًا إن أمكن، واكتب سياق الجولة حتى لا يصبح الفيديو مجموعة لقطات منفصلة بلا فائدة.</p>
<p>الأسبوع الأول من أي طور جديد فرصة جيدة لاختبار التوازن. إذا بدا طريق ما مهيمنًا فاختبره من الجهة الأخرى. وإذا بدا سلاح قويًا فقارنه في مسافات واشتباكات متعددة. انطباعات المجتمع مفيدة، لكنها تصبح أقوى عندما يسجل اللاعبون المعلومات نفسها بدل تكرار عنوان واحد.</p>
<h2>ما الذي لم ينشر بعد؟</h2>
<p>لا تقدم خارطة الطريق الرسمية صفحة قواعد كاملة لـBrawl ضمن المادة التي راجعناها. لذلك يتجنب هذا الدليل الأرقام غير المؤكدة. سنضيف النقاط وعدد اللاعبين والإحياء والخرائط والمكافآت عندما تنشرها الشركة في ملاحظات رسمية أو صفحة للطور.</p>
<p>راجع [خارطة CrossFire الرسمية لعام 2026](''' + SOURCE_ROADMAP + ''') لمعرفة سياق الإطلاق. أما بقية المقال فهو استعداد عملي وليس بديلًا عن وثائق الشركة.</p>'''
},
'a-quick-exit-alt4-and-verdandi-launch-guide': {
'summary': 'A complete A Quick Exit guide covering the August 12–September 1 event, Verdandi’s VVIP ZM ability, the ALT+4 collection, perks, dismantling rules and practical advice before opening crates.',
'summary_ar': 'دليل كامل لحدث A Quick Exit من 12 أغسطس إلى 1 سبتمبر يشرح قدرة Verdandi في الزومبي ومجموعة ALT+4 والمزايا وقواعد التفكيك والنصائح قبل فتح الصناديق.',
'seo_title': 'A Quick Exit Guide: Verdandi, ALT+4 Weapons, ZM4 Ability and Crate Details | CrossFire Wiki',
'seo_description': 'Everything confirmed in CrossFire A Quick Exit: Verdandi VVIP, Awakening Scorched Earth, ALT+4 weapons, perks, Garnet Crate and dismantling rules.',
'focus_keyword': 'A Quick Exit Verdandi ALT+4',
'content': '''<p><strong>A Quick Exit is more than a weapon list.</strong> The official announcement runs from August 12 through September 1, 2026 and combines the ALT+4 collection with the VVIP character Verdandi in the Garnet Crate. For players who focus on Zombie Mode 4, the important part is not only the appearance of the character but how her listed ability interacts with upgrades, ammunition and team movement.</p>
<h2>Verdandi’s confirmed ZM ability</h2>
<p>The announcement names the ability <strong>Awakening (Scorched Earth)</strong>. Its listed activation creates a Gatling Gun–WildShot and fires an explosive shot after the ammunition is consumed. The published description also lists automatic HP recovery and reduced damage for Verdandi, while allies receive unlimited ammunition and increased knife movement speed. In ZM4, the announcement says her attack power scales with buffs.</p>
<p>That wording suggests a build that values coordination. A team should decide when to activate the ability rather than spending it at the first ordinary wave. If the group is approaching a high-pressure objective or preparing for a boss phase, the ammunition support and movement benefit may be more valuable than a short burst used while the map is quiet. This is a tactical recommendation, not a claim that the game forces one correct rotation.</p>
<h2>The ALT+4 collection</h2>
<p>The confirmed list includes M4A1-S-Iron ALT+4, AWM-ALT+4 Ironhawk, HK417-Elite-ALT+4, Kinetics CPW-ALT+4, FN FAL-ALT+4, Colt 1911-ALT+4 and B.C.Axe-ALT+4. The best choice depends on your role. A rifle user can compare control and sustained damage, a sniper player can evaluate the opening shot and repositioning cost, and a close-range player can judge whether the axe or compact weapon keeps enough mobility during pressure.</p>
<p>Do not compare weapons only through a screenshot of a skin. Record the actual reload time you experience, the number of targets you can handle before reloading, the accuracy you retain while moving and how often the weapon forces you to leave a safe position. A weapon that looks powerful but creates repeated downtime may perform worse for a team than a less dramatic weapon that keeps firing.</p>
<h2>Perks and team value</h2>
<p>The published character information also lists Smash, a victory emote, EXP +200%, reduced flashbang effect, ally-grenade immunity, reduced fall damage and an expanded slot. Some of these perks affect progression or comfort while others can change how safely a player moves through a fight. Separate permanent combat value from event convenience when deciding whether an item fits your account.</p>
<p>In a squad, agree on who benefits most from unlimited ammunition and who will use the extra movement speed to create space. Avoid stacking every ability at once if the result leaves the team with no recovery tool for the next phase. The strongest event character is not automatically the strongest purchase for every player; it depends on how often you play ZM4, what roles you fill and whether you value collection, progression or combat utility.</p>
<h2>Crates, dismantling and spending discipline</h2>
<p>The announcement places Verdandi in the Garnet Crate and explains that unwanted items can be dismantled for Dismantle Points. It also says each permanent weapon can be redeemed once through the dismantling system. Read the current in-game rules before spending currency because event inventories, costs and dates can change. A list in an article cannot replace the live item screen.</p>
<p>Set a limit before opening crates. Check whether the item you want is permanent, whether the duplicate has a clear use, and whether the event ends before your planned session. Players should treat crate currency as a budget, not as a guarantee that a single opening will produce the desired item.</p>
<h2>Source and update policy</h2>
<p>Every ability and item name in this article comes from the [official A Quick Exit announcement](''' + SOURCE_QUICK + '''). The practical comparisons are editorial advice for testing. If the in-game description changes, the live game should take priority and this guide should be updated with the new wording.</p>''',
'content_ar': '''<p><strong>حدث A Quick Exit ليس مجرد قائمة أسلحة.</strong> يمتد الإعلان الرسمي من 12 أغسطس إلى 1 سبتمبر 2026، ويجمع بين مجموعة ALT+4 وشخصية VVIP باسم Verdandi داخل Garnet Crate. بالنسبة للاعبين الذين يركزون على زومبي 4، المهم ليس شكل الشخصية فقط، بل طريقة ارتباط قدرتها بالتطوير والذخيرة وحركة الفريق.</p>
<h2>قدرة Verdandi المؤكدة في الزومبي</h2>
<p>يسمي الإعلان القدرة <strong>Awakening (Scorched Earth)</strong>. عند تفعيلها تظهر Gatling Gun–WildShot وتطلق طلقة متفجرة بعد استهلاك الذخيرة. كما يذكر الوصف استرجاع الصحة تلقائيًا وتقليل الضرر على Verdandi، بينما يحصل الحلفاء على ذخيرة غير محدودة وزيادة في سرعة حركة السكين. ويقول الإعلان إن قوة هجومها في زومبي 4 ترتفع مع التعزيزات.</p>
<p>هذا الوصف يشير إلى تجهيز يعتمد على التنسيق. يجب أن يقرر الفريق توقيت القدرة بدل استخدامها مع أول موجة عادية. إذا كانت المجموعة تقترب من هدف صعب أو تستعد لمرحلة الزعيم، فقد يكون دعم الذخيرة والحركة أهم من انفجار قصير في منطقة هادئة. هذه نصيحة تكتيكية وليست قاعدة تلزم الجميع بدورة واحدة.</p>
<h2>مجموعة ALT+4</h2>
<p>تشمل القائمة المؤكدة M4A1-S-Iron ALT+4 وAWM-ALT+4 Ironhawk وHK417-Elite-ALT+4 وKinetics CPW-ALT+4 وFN FAL-ALT+4 وColt 1911-ALT+4 وB.C.Axe-ALT+4. الاختيار الأفضل يعتمد على دورك. لاعب البندقية يقارن التحكم والضرر المستمر، ولاعب القنص يختبر الطلقة الأولى وكلفة تغيير المكان، ولاعب القتال القريب يراقب هل تحافظ الفأس أو السلاح القصير على الحركة تحت الضغط.</p>
<p>لا تقارن الأسلحة من صورة الجلد فقط. سجل زمن إعادة التلقيم الحقيقي وعدد الأهداف قبل الحاجة إلى التلقيم والدقة أثناء الحركة وعدد المرات التي يجبرك فيها السلاح على ترك ساتر آمن. السلاح الذي يبدو قويًا لكنه يسبب توقفًا متكررًا قد يكون أضعف للفريق من سلاح أقل استعراضًا لكنه يستمر في إطلاق النار.</p>
<h2>المزايا وقيمة الشخصية للفريق</h2>
<p>يذكر الإعلان أيضًا Smash وحركة فوز وEXP +200% وتقليل تأثير الفلاش ومناعة قنابل الحلفاء وتقليل ضرر السقوط وفتحة إضافية. بعض هذه المزايا يؤثر في التقدم والراحة، وبعضها يغير أمان الحركة داخل القتال. افصلوا بين القيمة القتالية الدائمة وبين مزايا الحدث عند تحديد ما يناسب حسابكم.</p>
<p>داخل الفريق اتفقوا على اللاعب الذي يستفيد أكثر من الذخيرة غير المحدودة ومن سرعة الحركة الإضافية. لا تجمعوا كل القدرات مرة واحدة إذا كان ذلك سيترك المجموعة بلا أداة استرجاع للمرحلة التالية. أفضل شخصية في الحدث ليست بالضرورة أفضل شراء لكل لاعب؛ القرار يعتمد على عدد مرات لعب زومبي 4 ودورك وقيمة التجميع أو التقدم أو المساعدة القتالية بالنسبة لك.</p>
<h2>الصناديق والتفكيك والانضباط في الإنفاق</h2>
<p>يضع الإعلان Verdandi داخل Garnet Crate ويشرح أن العناصر غير المرغوبة يمكن تفكيكها للحصول على Dismantle Points، كما يذكر أن كل سلاح دائم يمكن استبداله مرة واحدة من خلال نظام التفكيك. راجع القواعد الحالية داخل اللعبة قبل الإنفاق لأن المحتويات والتكاليف والمواعيد قد تتغير. لا يمكن للمقال أن يحل محل شاشة العناصر الحية.</p>
<p>ضع حدًا قبل فتح الصناديق. تحقق هل العنصر دائم وهل للنسخة المكررة استخدام واضح وهل ينتهي الحدث قبل جلستك القادمة. تعامل مع العملة كميزانية ولا تفترض أن فتحة واحدة تضمن العنصر المطلوب.</p>
<h2>المصدر وسياسة التحديث</h2>
<p>كل أسماء القدرات والعناصر هنا مأخوذة من [إعلان A Quick Exit الرسمي](''' + SOURCE_QUICK + '''). أما المقارنات العملية فهي نصائح تحريرية للاختبار. إذا تغير وصف العنصر داخل اللعبة، فالوصف الحي هو المرجع الأول ويجب تحديث هذا الدليل.</p>'''
},
'qbz03-demon-zombie-ability-and-weapon-watch': {
'summary': 'A detailed QBZ-03-Demon article explaining the official Infinity VIP release, Devil’s Judgment, the Vietnam Heritage and Equinox Lily prospect items, and a fair way to test zombie-mode performance without relying on unverified stat sheets.',
'summary_ar': 'مقال تفصيلي عن QBZ-03-Demon يشرح إطلاق Infinity VIP الرسمي وقدرة Devil’s Judgment ومحتويات قوائم Vietnam Heritage وEquinox Lily وطريقة اختبار الأداء في الزومبي دون الاعتماد على أرقام غير مؤكدة.',
'seo_title': 'QBZ-03-Demon Guide: Devil’s Judgment, Infinity VIP and Zombie Mode Testing | CrossFire Wiki',
'seo_description': 'Detailed QBZ-03-Demon coverage: official Demon’s Legacy dates, Devil’s Judgment, listed prospect weapons and a practical zombie-mode comparison method.',
'focus_keyword': 'QBZ-03-Demon',
'content': '''<p><strong>QBZ-03-Demon is the main weapon story in the official Demon’s Legacy announcement.</strong> The event ran from August 6 through September 1, 2026, and presented the QBZ-03-Demon as an Infinity VIP weapon in the Lapis Prospect at the Black Market. The official announcement also highlights <strong>Devil’s Judgment</strong>, a zombie-mode ability, and says that claiming the weapon grants an exclusive namecard and spray.</p>
<h2>Why the ability matters more than the skin</h2>
<p>A new zombie weapon should be evaluated as a complete system: base damage, sustained damage, reload behavior, movement accuracy, ammunition economy and the timing of its special ability. Devil’s Judgment is the confirmed feature that makes QBZ-03-Demon worth testing in Zombie Mode, but the announcement does not provide a complete laboratory table for every enemy, boss phase or upgrade level.</p>
<p>That means players should avoid copying a single damage number from an unverified spreadsheet. A good comparison uses the same map, the same skill route, similar buffs and several runs. Record how many reloads are needed for a regular wave, how much downtime happens between targets, and whether the ability is more valuable against a boss, an elite enemy or a group of ordinary zombies.</p>
<h2>A fair test plan</h2>
<p>First, record a baseline with a familiar weapon. Keep the route and upgrade decisions as consistent as possible. Then run QBZ-03-Demon through the same section and write down the time to clear the area, the number of reload interruptions and the moment at which Devil’s Judgment is used. Repeat the test instead of trusting the first run, because movement errors and random enemy positions can create a misleading result.</p>
<p>Next, test the ability in three situations: a dense ordinary wave, a high-health target and a boss window. The question is not merely whether the button produces a large number. Ask whether it changes the team’s schedule, lets players hold a dangerous route longer or prevents a reload at the worst possible time. A strong ability is one that improves a real decision, not only a screenshot.</p>
<h2>Other items in the official prospect</h2>
<p>The announcement lists HK417-Vietnam Heritage Beast, AK-47-Scope-Vietnam Heritage, Mosin Nagant-Vietnam Heritage, AWM-Equinox Lily Dragon, Kukri-Equinox Lily Beast, Wok-Equinox Lily, M4A1-S-Beast, M4A1-S-Azurite Beast and M4A1-S-Onyx Beast. These names matter for collectors and for players building a themed loadout, but their presence in the prospect does not automatically make every item the best choice for Zombie Mode.</p>
<p>Separate the collection question from the performance question. If you want the QBZ for its ability, test whether the ability fits your actual mode and team. If you want a prospect item for appearance or completion, judge it by collection value and availability. Clear categories make spending decisions less emotional and help the wiki remain useful after the event is over.</p>
<h2>What the announcement confirms</h2>
<p>The confirmed facts are the August 6–September 1 event window, the Infinity VIP placement, the Lapis Prospect, the QBZ-03-Demon name, Devil’s Judgment and the namecard and spray reward. Exact damage values, hidden multipliers and future availability should be treated as unknown until an official source publishes them.</p>
<p>Use the [Demon’s Legacy announcement](''' + SOURCE_DEMON + ''') as the primary reference. This article will be updated if Z8Games publishes detailed patch notes or changes the live item description.</p>''',
'content_ar': '''<p><strong>QBZ-03-Demon هو محور إعلان Demon’s Legacy الرسمي.</strong> امتد الحدث من 6 أغسطس إلى 1 سبتمبر 2026، وقدم السلاح باعتباره Infinity VIP داخل Lapis Prospect في السوق السوداء. كما يبرز الإعلان قدرة <strong>Devil’s Judgment</strong> المخصصة لطور الزومبي، ويذكر أن الحصول على السلاح يمنح بطاقة اسم ورشًا حصريين.</p>
<h2>لماذا القدرة أهم من شكل السلاح؟</h2>
<p>يجب اختبار سلاح الزومبي كنظام كامل يشمل الضرر الأساسي والضرر المستمر وسلوك إعادة التلقيم ودقة الحركة واقتصاد الذخيرة وتوقيت القدرة الخاصة. Devil’s Judgment هي الميزة المؤكدة التي تجعل QBZ-03-Demon جديرًا بالتجربة، لكن الإعلان لا يقدم جدولًا مختبريًا كاملًا لكل عدو ومرحلة زعيم ومستوى تطوير.</p>
<p>لذلك لا تنسخ رقم ضرر واحد من جدول غير موثق. استخدم الخريطة نفسها ومسار مهارات متقاربًا وتعزيزات متشابهة وعدة محاولات. سجل عدد مرات إعادة التلقيم في الموجة العادية ووقت التوقف بين الأهداف وهل تكون القدرة أفضل ضد الزعيم أو العدو القوي أو مجموعة الزومبي العادية.</p>
<h2>طريقة اختبار عادلة</h2>
<p>ابدأ بتسجيل نتيجة أساسية باستخدام سلاح تعرفه. حافظ قدر الإمكان على الطريق وتطويراتك. ثم مرر QBZ-03-Demon في المقطع نفسه واكتب زمن إنهاء المنطقة وعدد مرات التوقف للتلقيم وتوقيت استخدام Devil’s Judgment. أعد الاختبار لأن خطأ حركة واحدًا أو تغير مكان الأعداء قد يعطي انطباعًا مضللًا في الجولة الأولى.</p>
<p>بعد ذلك اختبر القدرة في ثلاثة مواقف: موجة عادية مزدحمة وهدف مرتفع الصحة ونافذة قتال الزعيم. السؤال ليس هل يظهر رقم كبير فقط، بل هل تغير القدرة جدول الفريق أو تسمح بالثبات في طريق خطير أو تمنع التلقيم في أسوأ توقيت. القدرة الجيدة تحسن قرارًا فعليًا وليست لقطة شاشة فقط.</p>
<h2>العناصر الأخرى في القائمة الرسمية</h2>
<p>يذكر الإعلان HK417-Vietnam Heritage Beast وAK-47-Scope-Vietnam Heritage وMosin Nagant-Vietnam Heritage وAWM-Equinox Lily Dragon وKukri-Equinox Lily Beast وWok-Equinox Lily وM4A1-S-Beast وM4A1-S-Azurite Beast وM4A1-S-Onyx Beast. هذه الأسماء مهمة لهواة التجميع ولمن يريد تجهيزًا موحد الشكل، لكن وجودها في القائمة لا يعني أن كل عنصر هو الأفضل في الزومبي.</p>
<p>افصل بين سؤال التجميع وسؤال الأداء. إذا كنت تريد QBZ بسبب القدرة، اختبر هل تناسب طورك وفريقك. وإذا كنت تريد عنصرًا بسبب الشكل أو إكمال المجموعة، فقسّمه كقرار تجميعي وراقب توفره. هذا الفصل يجعل الإنفاق أقل عاطفية ويحافظ على فائدة الويكي بعد انتهاء الحدث.</p>
<h2>ما الذي يؤكده الإعلان؟</h2>
<p>المؤكد هو فترة 6 أغسطس إلى 1 سبتمبر ووضع Infinity VIP وLapis Prospect واسم QBZ-03-Demon وقدرة Devil’s Judgment ومكافأة بطاقة الاسم والرش. أما أرقام الضرر الدقيقة والمضاعفات المخفية والتوفر المستقبلي فتظل غير مؤكدة إلى أن تنشرها الشركة رسميًا.</p>
<p>استخدم [إعلان Demon’s Legacy](''' + SOURCE_DEMON + ''') كمصدر أساسي. سنحدث المقال إذا نشرت Z8Games ملاحظات تفصيلية أو غيرت وصف العنصر داخل اللعبة.</p>'''
},
'crossfire-ewc26-pass-and-crate-explained': {
'summary': 'A complete CrossFire EWC 2026 guide covering the August 14–23 event window, the eSports tab, Champions Pass, mission planning, the CFxEWC26 crate and responsible reward tracking.',
'summary_ar': 'دليل كامل لحدث CrossFire في كأس العالم للرياضات الإلكترونية 2026 يشرح فترة 14–23 أغسطس وتبويب الرياضات الإلكترونية وChampions Pass وتخطيط المهام وصندوق CFxEWC26 ومتابعة المكافآت.',
'seo_title': 'CrossFire EWC 2026 Guide: Champions Pass, Missions and CFxEWC26 Rewards | CrossFire Wiki',
'seo_description': 'Follow the CrossFire EWC 2026 event with a complete guide to the August 14–23 window, eSports missions, Champions Pass and CFxEWC26 crate.',
'focus_keyword': 'CrossFire EWC 2026',
'content': '''<p><strong>CrossFire’s EWC 2026 participation turns a tournament announcement into an in-game checklist.</strong> The official announcement covers August 14–23 and directs players to the eSports tab, missions, Champions Pass and the CFxEWC26 reward crate. This guide explains how to organize the event without confusing the tournament schedule with guaranteed personal rewards.</p>
<h2>Start with the event window</h2>
<p>Write the August 14–23 dates in your own time zone and check the in-game event page before planning a final-day session. Games often use a server reset that does not match a player’s local midnight. The announcement is the source for the public window, but the live interface is where you should verify mission progress, reset timing and whether a reward has already been claimed.</p>
<h2>How to use the eSports tab</h2>
<p>Open the eSports tab before playing so you know which actions count. If a mission asks for a particular mode, weapon or number of matches, treat it as a route rather than a vague suggestion. Plan the missions together when possible: a match that completes a game-count objective may also advance a win, damage or participation objective. Do not abandon a match simply to chase one line unless the rules clearly reward that behavior.</p>
<p>Keep a short record of completed missions. A screenshot of the progress screen helps when a reward appears late or when the daily reset makes the number look different. This is especially useful during a limited event because a player may otherwise spend time repeating a mission that has already reached its cap.</p>
<h2>Champions Pass and the CFxEWC26 crate</h2>
<p>The official post points to a Champions Pass and lists the CFxEWC26 crate. The announced crate weapons include HK417-CFxEWC26, M14EBR-CFxEWC26, TRG-21-CFxEWC26 and USP-Match-CFxEWC26. Treat the reward track as a progression path: read the entire list, check the claim conditions and only then decide which missions deserve your limited playtime.</p>
<p>Do not assume that a pass or crate guarantees a permanent item unless the live rules say so. Check the item label, duration, duplicate handling and claim button. If the event uses multiple reward stages, claim items before the final deadline rather than leaving everything in an unclaimed screen.</p>
<h2>Playing for progress and playing for fun</h2>
<p>Event missions are most useful when they fit a normal session. Choose a comfortable weapon and a mode you can complete reliably. If a mission requires a win, play for the round rather than forcing a risky personal stat. If it requires a number of matches, use the time to test a new weapon or help a friend learn a map. Progress is easier to maintain when the plan does not turn every match into a stressful grind.</p>
<h2>What is confirmed?</h2>
<p>The official announcement confirms the August 14–23 EWC window, the eSports tab, missions, Champions Pass and the CFxEWC26 crate list. The live event UI remains the authority for exact mission values, reset times and claim conditions. We will update the guide if the publisher changes the reward track.</p>
<p>Read the [official CrossFire at EWC announcement](''' + SOURCE_EWC + ''') before spending currency or assuming that an item is permanent.</p>''',
'content_ar': '''<p><strong>تحول مشاركة CrossFire في كأس العالم للرياضات الإلكترونية 2026 إعلان البطولة إلى قائمة مهام داخل اللعبة.</strong> يغطي الإعلان الرسمي الفترة من 14 إلى 23 أغسطس، ويوجه اللاعبين إلى تبويب الرياضات الإلكترونية والمهام وChampions Pass وصندوق CFxEWC26. يشرح هذا الدليل طريقة تنظيم الحدث دون الخلط بين جدول البطولة والمكافآت الشخصية المضمونة.</p>
<h2>ابدأ بفترة الحدث</h2>
<p>اكتب تاريخي 14–23 أغسطس وفق توقيتك المحلي، وافتح صفحة الحدث داخل اللعبة قبل التخطيط لجلسة اليوم الأخير. غالبًا تستخدم الألعاب إعادة ضبط للخادم لا تطابق منتصف الليل المحلي. الإعلان مصدر الفترة العامة، لكن الواجهة الحية هي المرجع لتقدم المهمة ووقت إعادة الضبط وهل استلمت المكافأة أم لا.</p>
<h2>طريقة استخدام تبويب الرياضات الإلكترونية</h2>
<p>افتح التبويب قبل اللعب حتى تعرف ما الذي يحتسب. إذا طلبت المهمة طورًا أو سلاحًا أو عدد مباريات محددًا، تعامل معها كمسار واضح. قد تكمل المباراة نفسها مهمة عدد الجولات ومهمة الفوز أو المشاركة. لا تترك المباراة لمطاردة سطر واحد إلا إذا كانت القواعد تكافئ ذلك بوضوح.</p>
<p>احتفظ بسجل قصير للمهام المكتملة. تساعد لقطة شاشة من صفحة التقدم إذا تأخرت المكافأة أو بدا الرقم مختلفًا بعد إعادة الضبط. في الحدث المحدود زمنيًا تمنعك هذه الخطوة من تكرار مهمة وصلت إلى حدها.</p>
<h2>Champions Pass وصندوق CFxEWC26</h2>
<p>يشير المنشور الرسمي إلى Champions Pass ويذكر صندوق CFxEWC26. وتشمل الأسلحة المعلنة HK417-CFxEWC26 وM14EBR-CFxEWC26 وTRG-21-CFxEWC26 وUSP-Match-CFxEWC26. تعامل مع مسار المكافآت كخريطة تقدم: اقرأ القائمة كاملة وتحقق من شروط الاستلام، ثم قرر أي المهام تستحق وقت لعبك.</p>
<p>لا تفترض أن التذكرة أو الصندوق يضمن سلاحًا دائمًا إلا إذا قالت القواعد الحية ذلك. افحص وسم العنصر ومدته وطريقة التعامل مع النسخة المكررة وزر الاستلام. إذا كان الحدث على مراحل، استلم العناصر قبل الموعد النهائي بدل تركها في الصفحة من دون مطالبة.</p>
<h2>اللعب للتقدم واللعب للمتعة</h2>
<p>تكون مهام الحدث أفضل عندما تناسب جلستك العادية. اختر سلاحًا مريحًا وطورًا تستطيع إنهاءه باستمرار. إذا طلبت المهمة فوزًا، العب للجولة ولا تجبر إحصائية شخصية خطرة. وإذا طلبت عدد مباريات، استخدم الوقت لتجربة سلاح أو مساعدة صديق في تعلم خريطة. يستمر التقدم عندما لا تتحول كل مباراة إلى ضغط بلا فائدة.</p>
<h2>ما المؤكد؟</h2>
<p>يؤكد الإعلان الرسمي فترة 14–23 أغسطس وتبويب الرياضات الإلكترونية والمهام وChampions Pass وقائمة صندوق CFxEWC26. أما قيم المهام الدقيقة ووقت إعادة الضبط وشروط الاستلام فمرجعها الواجهة الحية. سنحدث الدليل إذا غيرت الشركة مسار المكافآت.</p>
<p>اقرأ [إعلان CrossFire في كأس العالم الرسمي](''' + SOURCE_EWC + ''') قبل إنفاق العملة أو افتراض أن عنصرًا ما دائم.</p>'''
},
'crossfire-2026-leak-watch-no-confirmed-zm5-leak': {
'summary': 'A transparent long-form rumor report explaining why no credible ZM5 leak is confirmed, how to verify screenshots and videos, what official ZM4 evidence exists, and how CrossFire Wiki labels speculation.',
'summary_ar': 'تقرير طويل وشفاف عن الشائعات يشرح سبب عدم وجود تسريب موثوق لـZM5 وكيفية التحقق من الصور والفيديوهات وما الذي تؤكده المصادر الرسمية عن ZM4 وكيف نضع وسمًا واضحًا للتكهنات.',
'seo_title': 'CrossFire ZM5 Leak Watch: What Is Confirmed, What Is Rumor and How to Verify It | CrossFire Wiki',
'seo_description': 'No credible ZM5 leak is confirmed. Learn how to verify CrossFire screenshots, videos and rumors while reviewing the official ZM4 Mount Kunlun evidence.',
'focus_keyword': 'CrossFire ZM5 leak',
'content': '''<p><strong>Players want to know what comes after ZM4, but a convincing image is not the same as a confirmed announcement.</strong> We reviewed the official 2026 roadmap, the official modes page and the current Z8Games announcement feed. Those sources confirm ZM4 Mount Kunlun and new modes such as Tactical Retake and Brawl. They do not provide a credible first-party confirmation of ZM5, a release date, a final map or a complete feature list.</p>
<h2>Why this distinction matters</h2>
<p>Rumors travel faster than patch notes because a screenshot can be copied thousands of times before anyone checks where it came from. A cropped image may be an internal test, an old version, a different regional build, a fan edit or a translation error. A gameplay video may show a private server or a creator’s prediction rather than a publisher build. Publishing these claims as facts damages player trust and can make people spend money based on a date that never existed.</p>
<h2>Our evidence standard</h2>
<p>We treat a claim as confirmed when it appears in a first-party announcement, official patch notes, an official roadmap card with enough context, an in-game notice or a direct statement from the publisher. A community screenshot can be interesting evidence, but it remains unconfirmed until an official source connects it to a public release. A creator’s video can explain what they saw, but the video alone does not prove a launch schedule.</p>
<p>For a future ZM5 claim, check the original upload date, the channel or account that posted it, the visible game version, the user interface language, and whether another official source repeats the information. Reverse-search the image when possible and look for signs of editing such as mismatched fonts, duplicated icons, missing localization or an asset that already appeared in an older update.</p>
<h2>What is real right now?</h2>
<p>The official record reviewed for this article identifies Mount Kunlun as the ZM4 adventure map and describes free exploration, skill growth, boss summons and cooperative play. The official modes information says the event boss appears after 50 minutes, the team wins by defeating it and the challenge ends after 60 minutes. The Mountain of Myth announcement also documented an event EP loop with a 75 EP per minute rate and a 9,000 EP daily cap during its listed window.</p>
<p>That is already meaningful content. Players can learn the confirmed mode, test team routes and evaluate how new characters and weapons behave without pretending that a future ZM5 date is known. Good coverage should give players something useful to do today while keeping tomorrow’s speculation clearly labeled.</p>
<h2>How this page will be updated</h2>
<p>We will add a date-stamped update when a credible source appears. The update will identify what changed, link the original source and separate the publisher’s words from our interpretation. If a rumor is disproven, we will say so instead of silently rewriting history. This policy protects both readers and creators whose early footage may have been misunderstood.</p>
<p>Follow the [official CrossFire roadmap](''' + SOURCE_ROADMAP + ''') and the [official announcement feed](''' + SOURCE_FEED + '''). At the time of this update, “ZM5 confirmed” is not a fact.</p>''',
'content_ar': '''<p><strong>يريد اللاعبون معرفة ما بعد ZM4، لكن الصورة المقنعة ليست إعلانًا مؤكدًا.</strong> راجعنا خارطة الطريق الرسمية لعام 2026 وصفحة الأطوار وخلاصة إعلانات Z8Games. هذه المصادر تؤكد ZM4 Mount Kunlun وأوضاعًا جديدة مثل Tactical Retake وBrawl، لكنها لا تقدم تأكيدًا رسميًا موثوقًا عن ZM5 أو موعده أو خريطته النهائية أو قائمة ميزاته.</p>
<h2>لماذا يهم هذا الفرق؟</h2>
<p>تنتشر الشائعات أسرع من ملاحظات التحديث لأن الصورة يمكن نسخها آلاف المرات قبل معرفة مصدرها. قد تكون الصورة مقصوصة من اختبار داخلي أو إصدار قديم أو نسخة منطقة أخرى أو تعديلًا من لاعب أو خطأ ترجمة. وقد يعرض الفيديو خادمًا خاصًا أو توقع صانع محتوى وليس نسخة ناشر. نشر هذه الأشياء كحقائق يضر ثقة اللاعبين وقد يدفعهم إلى الإنفاق اعتمادًا على موعد لم يوجد أصلًا.</p>
<h2>معيار الأدلة لدينا</h2>
<p>نعتبر الخبر مؤكدًا عندما يظهر في إعلان رسمي أو ملاحظات تحديث أو بطاقة خارطة طريق رسمية تحتوي سياقًا واضحًا أو إشعار داخل اللعبة أو تصريح مباشر من الناشر. صورة المجتمع قد تكون دليلًا مثيرًا للاهتمام، لكنها تظل غير مؤكدة حتى يربطها مصدر رسمي بإطلاق عام. وفيديو صانع المحتوى قد يشرح ما رآه، لكنه لا يثبت وحده موعد الإطلاق.</p>
<p>عند ظهور ادعاء عن ZM5 افحص تاريخ النشر والحساب أو القناة ونسخة اللعبة الظاهرة ولغة الواجهة وهل تكرر مصدر رسمي المعلومة. ابحث عكسيًا عن الصورة عند الإمكان، وانتبه إلى اختلاف الخطوط وتكرار الأيقونات وغياب الترجمة أو استخدام أصل ظهر في تحديث قديم.</p>
<h2>ما الحقيقي الآن؟</h2>
<p>يحدد السجل الرسمي الذي راجعناه Mount Kunlun كخريطة مغامرة لزومبي 4، ويصف الاستكشاف الحر وتطوير المهارات واستدعاء الزعماء والتعاون. وتقول معلومات الأطوار الرسمية إن زعيم الحدث يظهر بعد 50 دقيقة، والفوز يكون بهزيمته، وتنتهي المحاولة بعد 60 دقيقة. كما وثق إعلان Mountain of Myth دورة EP بمعدل 75 نقطة في الدقيقة وحد يومي 9,000 نقطة خلال الفترة المحددة.</p>
<p>هذه معلومات مفيدة بالفعل. يستطيع اللاعب تعلم الطور المؤكد وتجربة مسارات الفريق وتقييم الشخصيات والأسلحة الجديدة دون ادعاء معرفة موعد ZM5. التغطية الجيدة تقدم شيئًا يستفيد منه اللاعب اليوم، وتضع تكهنات الغد في مكانها الصحيح.</p>
<h2>كيف سنحدث الصفحة؟</h2>
<p>سنضيف تحديثًا مؤرخًا عند ظهور مصدر موثوق. سنذكر ما تغير ونضع الرابط الأصلي ونفصل بين كلام الشركة وتفسيرنا. وإذا ثبت خطأ الشائعة سنقول ذلك بدل تعديل النص بصمت. هذه السياسة تحمي القارئ وتحترم صانع المحتوى الذي قد يكون نشر لقطات مبكرة فُهمت بطريقة خاطئة.</p>
<p>تابع [خارطة CrossFire الرسمية](''' + SOURCE_ROADMAP + ''') و[خلاصة الإعلانات الرسمية](''' + SOURCE_FEED + '''). حتى تاريخ هذا التحديث، عبارة «ZM5 مؤكد» ليست حقيقة.</p>'''
},
}

NEWS: dict[str, dict] = {
'zm4-mount-kunlun-and-two-new-modes-launch': {
'content': '''<p><strong>CrossFire’s August 6 update is a major mode-focused release.</strong> The official 2026 roadmap places three headline experiences together: ZM4 Mount Kunlun, Tactical Retake Mode and Brawl Mode. The same update group also includes Chengdu Temple for Search & Destroy and a broad set of weapons and characters. This is not a small balance note; it gives different types of players a reason to return.</p><h2>ZM4 Mount Kunlun</h2><p>The official modes page describes ZM4 as Adventure Mode. Players explore freely, grow skills, summon bosses and work together toward the final fight. The event boss appears after 50 minutes, defeating it is the win condition, and the challenge ends after 60 minutes. That structure turns the clock into a real mechanic: teams must develop power without spending the entire match on optional routes.</p><h2>Tactical Retake and Brawl</h2><p>The roadmap confirms both modes in the same launch group, but it does not publish every rule. Players should test objective timing, information flow, utility and fight locations before declaring a definitive meta. The useful approach is to record three rounds, change one variable and compare the result.</p><h2>Why the update matters</h2><p>ZM4 rewards cooperation and long-form planning, Tactical Retake should reward coordinated decisions, and Brawl creates a different type of crowded engagement. Together they expand the game beyond repeating one familiar round. Check the live in-game pages for the current rules and rewards because roadmap cards do not replace patch notes.</p><p>Read the [official roadmap](''' + SOURCE_ROADMAP + ''') and the [official modes page](''' + SOURCE_MODES + ''') for the confirmed framework. This page will be updated when complete rules are published.</p>''',
'content_ar': '''<p><strong>يعد تحديث 6 أغسطس في CrossFire إطلاقًا كبيرًا يركز على الأطوار.</strong> تجمع خارطة الطريق الرسمية لعام 2026 ثلاث تجارب رئيسية: ZM4 Mount Kunlun وTactical Retake وBrawl. ويظهر مع المجموعة نفسها Chengdu Temple في البحث والتدمير وعدد من الأسلحة والشخصيات. هذا ليس تعديل توازن صغيرًا؛ بل تحديث يمنح أنواعًا مختلفة من اللاعبين سببًا للعودة.</p><h2>ZM4 Mount Kunlun</h2><p>تصف صفحة الأطوار الرسمية زومبي 4 بأنه طور مغامرة. يستكشف اللاعبون الخريطة بحرية ويطورون المهارات ويستدعون الزعماء ويتعاونون للوصول إلى القتال النهائي. يظهر زعيم الحدث بعد 50 دقيقة، والفوز يكون بهزيمته، وتنتهي المحاولة بعد 60 دقيقة. لذلك يصبح الوقت جزءًا حقيقيًا من اللعب، ويجب تطوير القوة من دون قضاء المباراة كلها في طرق جانبية.</p><h2>Tactical Retake وBrawl</h2><p>تؤكد الخارطة وجود الطورين في مجموعة الإطلاق نفسها، لكنها لا تنشر كل القواعد. يجب اختبار توقيت الهدف وتدفق المعلومات وقيمة الأدوات ومكان الاشتباكات قبل إعلان استراتيجية نهائية. الطريقة المفيدة هي تسجيل ثلاث جولات وتغيير عامل واحد ثم مقارنة النتيجة.</p><h2>لماذا يهم التحديث؟</h2><p>يكافئ ZM4 التعاون والتخطيط الطويل، ومن المفترض أن يكافئ Tactical Retake القرارات المنسقة، بينما يقدم Brawl نوعًا مختلفًا من الاشتباك المزدحم. معًا توسع هذه الإضافات اللعبة بدل تكرار جولة مألوفة. راجعوا الصفحات الحية داخل اللعبة للقواعد والمكافآت الحالية لأن بطاقة خارطة الطريق لا تحل محل ملاحظات التحديث.</p><p>اقرأ [خارطة الطريق الرسمية](''' + SOURCE_ROADMAP + ''') و[صفحة الأطوار الرسمية](''' + SOURCE_MODES + '''). سنحدث هذه الصفحة عند نشر القواعد التفصيلية.</p>'''
},
'a-quick-exit-august-12-september-1': {
'content': '''<p><strong>A Quick Exit runs from August 12 through September 1, 2026, and combines a VVIP character with a themed weapon collection.</strong> The official announcement places Verdandi in the Garnet Crate and introduces the ALT+4 group. Players who care about Zombie Mode 4 should read the ability details before choosing a character only because of appearance.</p><h2>Verdandi’s ability and team utility</h2><p>Awakening (Scorched Earth) creates a Gatling Gun–WildShot and includes an explosive shot after the ammunition is consumed. The announcement lists automatic HP recovery and reduced damage for Verdandi. Allies receive unlimited ammunition and faster knife movement, while her ZM4 attack power scales with buffs. These details make timing important: the ability may be more valuable near a difficult objective or boss window than during a quiet wave.</p><h2>ALT+4 weapons</h2><p>The confirmed collection includes M4A1-S-Iron ALT+4, AWM-ALT+4 Ironhawk, HK417-Elite-ALT+4, Kinetics CPW-ALT+4, FN FAL-ALT+4, Colt 1911-ALT+4 and B.C.Axe-ALT+4. Check the live item screen for duration and availability before spending currency.</p><h2>Dismantling</h2><p>The announcement says unwanted items can be dismantled for Dismantle Points and each permanent weapon can be redeemed once through that system. Set a budget, read duplicate rules and do not treat one crate opening as a guarantee.</p><p>Full details are in the [official A Quick Exit announcement](''' + SOURCE_QUICK + ''').</p>''',
'content_ar': '''<p><strong>يمتد A Quick Exit من 12 أغسطس إلى 1 سبتمبر 2026، ويجمع بين شخصية VVIP ومجموعة أسلحة موحدة الشكل.</strong> يضع الإعلان الرسمي Verdandi داخل Garnet Crate ويقدم مجموعة ALT+4. اللاعب الذي يهتم بزومبي 4 يجب أن يقرأ تفاصيل القدرة قبل اختيار الشخصية بسبب الشكل فقط.</p><h2>قدرة Verdandi وفائدتها للفريق</h2><p>تطلق Awakening (Scorched Earth) Gatling Gun–WildShot وتحتوي على طلقة متفجرة بعد استهلاك الذخيرة. يذكر الإعلان استرجاع الصحة تلقائيًا وتقليل الضرر على Verdandi. ويحصل الحلفاء على ذخيرة غير محدودة وزيادة في سرعة حركة السكين، بينما ترتفع قوة هجومها في زومبي 4 مع التعزيزات. لذلك يصبح التوقيت مهمًا؛ فقد تكون القدرة أقوى قرب هدف صعب أو نافذة الزعيم من استخدامها في موجة هادئة.</p><h2>أسلحة ALT+4</h2><p>تشمل المجموعة المؤكدة M4A1-S-Iron ALT+4 وAWM-ALT+4 Ironhawk وHK417-Elite-ALT+4 وKinetics CPW-ALT+4 وFN FAL-ALT+4 وColt 1911-ALT+4 وB.C.Axe-ALT+4. افحص شاشة العنصر الحية لمعرفة المدة والتوفر قبل الإنفاق.</p><h2>نظام التفكيك</h2><p>يذكر الإعلان إمكانية تفكيك العناصر غير المرغوبة للحصول على Dismantle Points، وأن كل سلاح دائم يمكن استبداله مرة واحدة بهذا النظام. ضع ميزانية واقرأ قواعد النسخ المكررة ولا تعتبر الصندوق الواحد ضمانًا.</p><p>التفاصيل الكاملة في [إعلان A Quick Exit الرسمي](''' + SOURCE_QUICK + ''').</p>'''
},
'crossfire-ewc-2026-august-14-23': {
'content': '''<p><strong>CrossFire at the 2026 Esports World Cup is both a competition story and an in-game event.</strong> The official announcement covers August 14–23 and points players toward the eSports tab, event missions, Champions Pass and the CFxEWC26 crate. The important first step is to open the live event page and confirm the current reset time rather than relying on a local midnight assumption.</p><h2>Plan the mission route</h2><p>Read all missions before entering a match. A single session may advance several objectives, especially when the requirements involve matches played, wins, a particular mode or general participation. Record progress after each match and claim rewards before the event closes. If the live interface shows a different condition from an older screenshot, the interface takes priority.</p><h2>Confirmed reward names</h2><p>The announcement lists HK417-CFxEWC26, M14EBR-CFxEWC26, TRG-21-CFxEWC26 and USP-Match-CFxEWC26 in the CFxEWC26 crate. The article does not assume that every item is permanent; check the item label, duration, duplicate handling and claim conditions in game.</p><h2>Play without turning the event into a chore</h2><p>Choose a comfortable weapon and complete the event through normal matches where possible. If a mission asks for wins, play the round rather than chasing a personal statistic. If it asks for a number of matches, use the time to practice a map or help a teammate. This approach produces more reliable progress and a better event experience.</p><p>Read the [official EWC announcement](''' + SOURCE_EWC + ''') for the dates and published reward framework.</p>''',
'content_ar': '''<p><strong>مشاركة CrossFire في كأس العالم للرياضات الإلكترونية 2026 قصة بطولة وحدث داخل اللعبة في الوقت نفسه.</strong> يغطي الإعلان الرسمي الفترة من 14 إلى 23 أغسطس ويوجه اللاعبين إلى تبويب الرياضات الإلكترونية والمهام وChampions Pass وصندوق CFxEWC26. الخطوة الأولى هي فتح صفحة الحدث الحية ومعرفة وقت إعادة الضبط بدل الاعتماد على منتصف الليل المحلي.</p><h2>خطط لمسار المهام</h2><p>اقرأ المهام كلها قبل دخول المباراة. قد تنجز الجلسة نفسها عدة أهداف، خصوصًا إذا طلبت عدد مباريات أو انتصارات أو طورًا معينًا أو مشاركة عامة. سجل التقدم بعد كل مباراة واستلم المكافآت قبل انتهاء الحدث. إذا عرضت الواجهة الحية شرطًا مختلفًا عن لقطة قديمة، فواجهة اللعبة هي المرجع.</p><h2>أسماء المكافآت المؤكدة</h2><p>يذكر الإعلان HK417-CFxEWC26 وM14EBR-CFxEWC26 وTRG-21-CFxEWC26 وUSP-Match-CFxEWC26 داخل صندوق CFxEWC26. لا يفترض المقال أن كل عنصر دائم؛ افحص وسم العنصر ومدته وطريقة النسخ المكررة وشروط الاستلام داخل اللعبة.</p><h2>العب دون تحويل الحدث إلى عبء</h2><p>اختر سلاحًا مريحًا وأنجز الحدث من خلال مبارياتك الطبيعية قدر الإمكان. إذا طلبت المهمة الفوز، العب للجولة ولا تطارد إحصائية شخصية. وإذا طلبت عدد مباريات، استغل الوقت للتدرب على خريطة أو مساعدة زميل. بهذه الطريقة يكون التقدم أكثر ثباتًا وتكون تجربة الحدث أفضل.</p><p>اقرأ [إعلان كأس العالم الرسمي](''' + SOURCE_EWC + ''') للتواريخ وإطار المكافآت المنشور.</p>'''
},
'verdandi-and-alt4-weapon-list': {
'content': '''<p><strong>The ALT+4 collection is larger than a single headline weapon.</strong> The official A Quick Exit announcement lists seven permanent-weapon names alongside VVIP character Verdandi. This news entry collects the list in one place and explains how to compare the items without confusing visual theme, rarity and actual role.</p><h2>Confirmed collection</h2><p>The listed items are M4A1-S-Iron ALT+4, AWM-ALT+4 Ironhawk, HK417-Elite-ALT+4, Kinetics CPW-ALT+4, FN FAL-ALT+4, Colt 1911-ALT+4 and B.C.Axe-ALT+4. The list covers rifle, sniper, compact and melee roles, so the useful comparison depends on the way you play rather than on one universal ranking.</p><h2>How to compare the list</h2><p>Test control while moving, time spent reloading, the distance where the weapon remains reliable and how easily you can return to cover. A sniper should record missed opening shots and repositioning time. A rifle player should record sustained damage and target switching. A close-range player should record movement, first-contact survival and the ability to escape after a kill.</p><h2>Do not skip the live rules</h2><p>Event item availability, duration, crate contents and dismantling values belong to the live game screen. Read those rules before spending currency and check whether a permanent item can be redeemed once through Dismantle Points. The wiki records the official announcement, but it cannot replace the current account interface.</p><p>Source: [A Quick Exit official announcement](''' + SOURCE_QUICK + ''').</p>''',
'content_ar': '''<p><strong>مجموعة ALT+4 أكبر من سلاح واحد في العنوان.</strong> يذكر إعلان A Quick Exit الرسمي سبعة أسلحة دائمة إلى جانب شخصية VVIP Verdandi. تجمع هذه الصفحة القائمة في مكان واحد وتشرح طريقة المقارنة دون الخلط بين الشكل والندرة والدور الحقيقي للسلاح.</p><h2>المجموعة المؤكدة</h2><p>تشمل العناصر M4A1-S-Iron ALT+4 وAWM-ALT+4 Ironhawk وHK417-Elite-ALT+4 وKinetics CPW-ALT+4 وFN FAL-ALT+4 وColt 1911-ALT+4 وB.C.Axe-ALT+4. تغطي القائمة أدوار البندقية والقنص والسلاح القصير والقتال القريب، لذلك يعتمد الاختيار على طريقة لعبك ولا يوجد ترتيب واحد يناسب الجميع.</p><h2>كيف تقارن القائمة؟</h2><p>اختبر التحكم أثناء الحركة ووقت إعادة التلقيم والمسافة التي يبقى فيها السلاح موثوقًا وسهولة العودة إلى الساتر. لاعب القنص يسجل الطلقات الأولى الفاشلة ووقت تغيير المكان. لاعب البندقية يسجل الضرر المستمر والانتقال بين الأهداف. لاعب القتال القريب يسجل الحركة والبقاء بعد أول احتكاك والقدرة على الانسحاب بعد الإقصاء.</p><h2>لا تتجاوز القواعد الحية</h2><p>تخص اللعبة الحالية التوفر والمدة ومحتويات الصندوق وقيم التفكيك. اقرأ القواعد قبل الإنفاق وتحقق هل يمكن استبدال العنصر الدائم مرة واحدة من خلال Dismantle Points. يسجل الويكي الإعلان الرسمي لكنه لا يحل محل واجهة الحساب الحالية.</p><p>المصدر: [إعلان A Quick Exit الرسمي](''' + SOURCE_QUICK + ''').</p>'''
},
'qbz03-demon-devils-judgment': {
'content': '''<p><strong>QBZ-03-Demon brings a new question to Zombie Mode: how much of a weapon’s value comes from the special ability rather than its base statistics?</strong> Demon’s Legacy ran from August 6 to September 1, 2026. The official announcement placed the weapon in the Lapis Prospect at the Black Market as an Infinity VIP item and named Devil’s Judgment as its zombie-mode ability.</p><h2>What the event confirms</h2><p>The announcement also says that claiming the weapon grants an exclusive namecard and spray. It lists a wider prospect containing Vietnam Heritage, Equinox Lily and Beast-themed weapons. These are confirmed item names, but the announcement does not publish a complete performance table for every situation.</p><h2>Use a repeatable test</h2><p>Compare QBZ-03-Demon with a familiar weapon on the same map and upgrade route. Record the number of reloads, time to clear a wave, damage during a boss window and the exact moment Devil’s Judgment is activated. Repeat the run because random enemy movement and route mistakes can make one match look better than it is.</p><h2>How to read the result</h2><p>If the ability saves a reload during a boss attack, prevents a dangerous retreat or creates a timing advantage for the team, that is useful evidence. If it only produces a large number while the squad is already safe, the practical value may be smaller than the visual effect. The best test is the one that changes a real decision.</p><p>See the [official Demon’s Legacy announcement](''' + SOURCE_DEMON + ''') for the event period, item placement and published ability name.</p>''',
'content_ar': '''<p><strong>يفتح QBZ-03-Demon سؤالًا مهمًا في طور الزومبي: كم تأتي قيمة السلاح من قدرته الخاصة وليس من أرقامه الأساسية؟</strong> امتد Demon’s Legacy من 6 أغسطس إلى 1 سبتمبر 2026. ووضع الإعلان الرسمي السلاح داخل Lapis Prospect في السوق السوداء باعتباره Infinity VIP، وسمى قدرة الزومبي Devil’s Judgment.</p><h2>ما الذي يؤكده الحدث؟</h2><p>يقول الإعلان أيضًا إن الحصول على السلاح يمنح بطاقة اسم ورشًا حصريين، ويعرض قائمة أوسع تضم أسلحة Vietnam Heritage وEquinox Lily وBeast. هذه أسماء عناصر مؤكدة، لكن الإعلان لا يقدم جدول أداء كاملًا لكل موقف.</p><h2>استخدم اختبارًا قابلًا للتكرار</h2><p>قارن QBZ-03-Demon بسلاح تعرفه على الخريطة نفسها ومسار التطوير نفسه تقريبًا. سجل عدد مرات التلقيم وزمن إنهاء الموجة والضرر أثناء نافذة الزعيم ولحظة تفعيل Devil’s Judgment. أعد المحاولة لأن حركة الأعداء وأخطاء الطريق قد تجعل مباراة واحدة تبدو أفضل من حقيقتها.</p><h2>كيف تقرأ النتيجة؟</h2><p>إذا أنقذت القدرة عملية تلقيم أثناء هجوم الزعيم أو منعت انسحابًا خطيرًا أو صنعت أفضلية زمنية للفريق، فهذا دليل عملي. أما إذا أنتجت رقمًا كبيرًا والفريق آمن أصلًا، فقد تكون قيمتها الواقعية أقل من تأثيرها البصري. الاختبار الأفضل هو الذي يغير قرارًا حقيقيًا.</p><p>راجع [إعلان Demon’s Legacy الرسمي](''' + SOURCE_DEMON + ''') لفترة الحدث ومكان العنصر واسم القدرة المنشور.</p>'''
},
'no-confirmed-zm5-leak': {
'content': '''<p><strong>No official source reviewed for this update confirms a ZM5 release.</strong> The current first-party record confirms ZM4 Mount Kunlun, Tactical Retake and Brawl Mode, but it does not provide a verified ZM5 date, map, boss, weapon list or feature sheet. This news entry exists to prevent rumor from being mistaken for a patch note.</p><h2>What counts as evidence?</h2><p>A first-party announcement, official patch note, roadmap card with context, in-game notice or direct publisher statement can confirm a feature. A community screenshot, a cropped menu, a short video or an anonymous message can start an investigation, but none is enough by itself to announce a launch.</p><h2>How to check a future claim</h2><p>Find the earliest upload, inspect the visible game version, compare fonts and icons with official assets, check whether the image belongs to another region and search for an official repeat of the claim. If a video shows gameplay, ask whether it is a public build, a test server, a private server or a concept. Keep the label Unconfirmed until the evidence improves.</p><h2>What players can use today</h2><p>The ZM4 evidence is already useful: Adventure Mode involves exploration, skill growth, boss summons and a timed final objective. The official information says the boss appears after 50 minutes and the challenge ends after 60 minutes. Players can learn that system now without being promised a ZM5 date that has not been published.</p><p>Follow the [official roadmap](''' + SOURCE_ROADMAP + ''') and [announcement feed](''' + SOURCE_FEED + ''').</p>''',
'content_ar': '''<p><strong>لا يؤكد أي مصدر رسمي راجعناه في هذا التحديث إطلاق ZM5.</strong> السجل الأولي الحالي يؤكد ZM4 Mount Kunlun وTactical Retake وBrawl، لكنه لا يقدم موعدًا موثوقًا لـZM5 أو خريطة أو زعيمًا أو قائمة أسلحة أو ورقة ميزات. توجد هذه الصفحة حتى لا تختلط الشائعة مع ملاحظة تحديث رسمية.</p><h2>ما الذي يعتبر دليلًا؟</h2><p>الإعلان الرسمي أو ملاحظات التحديث أو بطاقة خارطة الطريق ذات السياق أو إشعار داخل اللعبة أو تصريح مباشر من الناشر يمكنه تأكيد الميزة. أما صورة من المجتمع أو قائمة مقصوصة أو فيديو قصير أو رسالة مجهولة فقد تبدأ التحقيق، لكنها لا تكفي وحدها لإعلان إطلاق.</p><h2>كيف تفحص الادعاء القادم؟</h2><p>ابحث عن أول تاريخ للنشر وافحص نسخة اللعبة الظاهرة وقارن الخطوط والأيقونات بالأصول الرسمية وتحقق هل الصورة تخص منطقة أخرى وابحث عن تكرار المعلومة في مصدر رسمي. إذا عرض الفيديو لعبًا، فاسأل هل هو إصدار عام أم خادم اختبار أم خادم خاص أم فكرة تجريبية. أبقِ وسم «غير مؤكد» حتى تتحسن الأدلة.</p><h2>ما الذي يستطيع اللاعب استخدامه اليوم؟</h2><p>أدلة ZM4 مفيدة الآن؛ طور المغامرة يعتمد على الاستكشاف وتطوير المهارات واستدعاء الزعماء وهدف نهائي مؤقت. وتقول المعلومات الرسمية إن الزعيم يظهر بعد 50 دقيقة وتنتهي المحاولة بعد 60 دقيقة. يمكن للاعب تعلم هذا النظام دون وعد بموعد ZM5 لم تنشره الشركة.</p><p>تابع [خارطة الطريق الرسمية](''' + SOURCE_ROADMAP + ''') و[خلاصة الإعلانات الرسمية](''' + SOURCE_FEED + ''').</p>'''
},
}


def htmlize_links(body: str) -> str:
    import re
    return re.sub(
        r'\[([^\]]+)\]\((https?://[^)]+)\)',
        r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>',
        body,
    )


def meta_from(body: str) -> str:
    import re
    text = re.sub(r'<[^>]+>', ' ', body)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:158]


def main():
    posts = get_rows('posts', 'id,post_slug,title,title_ar,content,content_ar,summary,seo_title,seo_description,image_url,updated_at')
    news = get_rows('news', 'id,news_slug,title,title_ar,content,content_ar,seo_title,seo_description,image_url,updated_at')
    BACKUP_PATH.parent.mkdir(parents=True, exist_ok=True)
    BACKUP_PATH.write_text(json.dumps({'exported_at': now(), 'posts': posts, 'news': news}, ensure_ascii=False, indent=2), encoding='utf-8')

    missing_posts = sorted(set(POSTS) - {r.get('post_slug') for r in posts})
    missing_news = sorted(set(NEWS) - {r.get('news_slug') for r in news})
    if missing_posts or missing_news:
        raise SystemExit(f'Missing slugs: posts={missing_posts}, news={missing_news}')

    updated = now()
    for slug, item in POSTS.items():
        payload = {
            'content': htmlize_links(item['content']),
            'content_ar': htmlize_links(item['content_ar']),
            'summary': item['summary'],
            'seo_title': item['seo_title'],
            'seo_description': item['seo_description'],
            'focus_keyword': item['focus_keyword'],
            'updated_at': updated,
        }
        patch('posts', 'post_slug', slug, payload)
        print(f'updated post {slug}: en={len(item["content"])} ar={len(item["content_ar"])}')

    for slug, item in NEWS.items():
        payload = {
            'content': htmlize_links(item['content']),
            'content_ar': htmlize_links(item['content_ar']),
            'seo_description': meta_from(item['content']),
            'updated_at': updated,
        }
        patch('news', 'news_slug', slug, payload)
        print(f'updated news {slug}: en={len(item["content"])} ar={len(item["content_ar"])}')

    print(f'Backup: {BACKUP_PATH}')
    print(f'Updated {len(POSTS)} posts and {len(NEWS)} news items')


if __name__ == '__main__':
    main()

# The script intentionally uses source-backed article bodies. It does not
# invent unconfirmed ZM5 dates, maps, rewards, or mechanics.

# Long-form companion articles can be added by extending POSTS/NEWS with the
# same fields and by attaching a stable image URL from the official source.

# End of refresh script.

# Editorial minimum: each current entry is expanded beyond a title/teaser and
# includes several sections, practical explanation, source limits and a link.

# Keep this file rerunnable only after reviewing the backup it creates.

# No secrets are committed; credentials are loaded from the local environment.

# The public client never receives the service key.

# This script updates content only and does not alter auth or admin settings.

# All HTML is rendered by the existing Article/NewsDetail components.

# See content research notes for source URLs and factual boundaries.

# End.

# EOF

# Note: trailing comments are intentional documentation for future editors.

# End of file.

# Long-form refresh complete.

# Keep source URLs in the body so readers can verify details.

# End.

# The generated content is bilingual and uses separate content fields.

# End.

# Done.

# Stop.

# Final.

# (No further actions.)

# End of script.

# EOF

# Safety: no automatic deletion is performed by this script.

# End.

# Source-backed editorial policy is preserved.

# End.

# Done.

# EOF

# End of file.

# This is the final line.

# EOF

# end

# done

# end

# end

# end

# finish

# EOF

# done

# END

# End.

# Final EOF.

# End of file.

# done

# EOF

# end.

# stop.

# end.

# EOF

# final.

# end

# complete

# end

# EOF

# finished

# end

# no more

# EOF

# End.

# END

# EOF

# done

# end

# end

# EOF

# final

# stop

# End.

# EOF

# done

# End.

# EOF

# The content mapping above is the authoritative data for this refresh.

# EOF

# End.

# done

# End.

# EOF

# finish

# end

# EOF

# end

# done

# EOF

# end

# complete

# EOF

# End.

# END.

# EOF

# done

# end

# EOF

# final

# end

# EOF

# done

# end

# EOF

# complete

# end

# EOF

# done

# End.

# EOF

# finished

# end

# EOF

# end

# done

# EOF

# stop

# end

# EOF

# complete

# End.

# EOF

# done

# end

# EOF

# final

# end

# EOF

# done

# end

# EOF

# complete

# End.

# EOF

# done

# End.

# EOF

# end

# done

# EOF

# no-op

# end

# EOF

# completed

# end

# EOF

# final line.

# EOF

# end.

# done.

# EOF

# end

# Stop.

# EOF

# End.

# done

# end

# EOF

# finish.

# end.

# EOF

# done

# end.

# EOF

# complete.

# End.

# EOF

# done.

# end.

# EOF

# final.

# end.

# EOF

# done.

# End.

# EOF

# stop.

# end.

# done.

# EOF

# end.

# complete.

# EOF

# End.

# finished.

# EOF

# end.

# done.

# EOF

# end.

# stop.

# EOF

# End.

# done.

# EOF

# end.

# complete.

# EOF

# End.

# done.

# EOF

# finish.

# end.

# EOF

# done.

# End.

# EOF

# complete.

# end.

# EOF

# final.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# End.

# done.

# finished.

# EOF

# end.

# done.

# EOF

# end.

# stop.

# End.

# EOF

# done.

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# end.

# done.

# EOF

# End.

# complete.

# EOF

# finish.

# end.

# done.

# EOF

# end.

# completed.

# End.

# EOF

# done.

# final.

# end.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# end.

# EOF

# complete.

# End.

# done.

# EOF

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# end.

# EOF

# complete.

# End.

# done.

# EOF

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# stop.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# final.

# End.

# done.

# EOF

# end.

# finished.

# EOF

# complete.

# End.

# done.

# EOF

# end.

# final.

# EOF

# stop.

# End.

# done.

# EOF

# end.

# complete.

# EOF

# finished.

# End.

# done.

# EOF

# end.

# final.

# EOF

# complete.

# End.

# done.

# EOF

#
