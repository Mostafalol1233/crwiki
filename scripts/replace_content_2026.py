from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests

ENV_PATH = Path('/home/ubuntu/upload/.env')
BACKUP_PATH = Path('/home/ubuntu/crwiki/backups/content-before-2026-refresh.json')


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


env = {**load_env(ENV_PATH), **os.environ}
base_url = env.get('SUPABASE_URL') or env.get('VITE_SUPABASE_URL')
service_key = (
    env.get('SUPABASE_SERVICE_KEY')
    or env.get('SERVICE_ROLE_KEY')
    or env.get('VITE_SUPABASE_SERVICE_KEY')
    or env.get('VITE_SERVICE_ROLE')
)
if not base_url or not service_key:
    raise SystemExit('Supabase URL or service key is missing')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
}


def rest(method: str, table: str, *, params: dict[str, str] | None = None, body=None):
    url = f'{base_url.rstrip("/")}/rest/v1/{table}'
    response = requests.request(method, url, headers=headers, params=params, json=body, timeout=30)
    if not response.ok:
        raise RuntimeError(f'{method} {table} failed ({response.status_code}): {response.text[:500]}')
    if not response.text:
        return None
    return response.json()


source = {
    'roadmap': 'https://crossfire.z8games.com/patches/2026',
    'modes': 'https://crossfire.z8games.com/modes.html',
    'mount_kunlun': 'https://forum.z8games.com/discussion/6958412/mountain-of-myth-august-6th-14th',
    'quick_exit': 'https://forum.z8games.com/discussion/6958416/a-quick-exit-august-12th-september-1st',
    'demon': 'https://forum.z8games.com/discussion/6958407/demon-039-s-legacy-august-6th-september-1st',
    'ewc': 'https://forum.z8games.com/discussion/6958414/crossfire-at-2026-esports-world-cup-august-14th-23rd',
    'frenzy': 'https://forum.z8games.com/discussion/6958394/fantastic-frenzy-weekend-every-weekend-in-august',
}

images = {
    'kunlun': 'https://z8games.akamaized.net/cfna/patches/2026/img/260728_cfwe_godzone_roadmapthumb.jpg',
    'tactical': 'https://z8games.akamaized.net/cfna/patches/2026/img/260728_cfwe_retakemode1_roadmapthumb.jpg',
    'brawl': 'https://z8games.akamaized.net/cfna/patches/2026/img/260728_cfwe_massbrawl_roadmapthumb.jpg',
    'alt4': 'https://z8games.akamaized.net/cfna/patches/2026/img/260806_cfwe_rubycrates_roadmapthumb_weapons.jpg',
    'verdandi': 'https://z8games.akamaized.net/cfna/patches/2026/img/260806_cfwe_rubycrates_roadmapthumb_character.jpg',
    'demon': 'https://z8games.akamaized.net/cfna/patches/2026/img/260716_cfwe_sapphire_vip_roadmapthumb.jpg',
    'ewc': 'https://z8games.akamaized.net/cfna/patches/2026/img/260720_cfwe_ewc_rewards_roadmapthumb_2.jpg',
    'frenzy': 'https://z8games.akamaized.net/cfna/web/main/Forum/260724_cfwe_weekendparty_forums.jpg',
    'mount_banner': 'https://z8games.akamaized.net/cfna/web/main/Forum/250804_cfwe_godzone_play_forums.jpg',
}


def post(slug: str, title: str, title_ar: str, summary: str, summary_ar: str, image: str, category: str, author: str, source_url: str, content: str, content_ar: str, tags: list[str], created_at: str, featured: bool = False):
    return {
        'title': title,
        'title_ar': title_ar,
        'post_slug': slug,
        'content': content,
        'content_ar': content_ar,
        'summary': summary,
        'image_url': image,
        'category': category,
        'tags': tags,
        'author': author,
        'featured': featured,
        'language': 'en',
        'seo_title': title,
        'seo_description': summary,
        'og_image': image,
        'canonical_url': f'https://crossfire.wiki/posts/{slug}',
        'focus_keyword': tags[0] if tags else '',
        'gallery': [],
        'created_at': created_at,
        'updated_at': created_at,
    }


posts = [
    post(
        'zm4-mount-kunlun-complete-launch-guide',
        'ZM4 Mount Kunlun: What Changed and How to Clear the Adventure',
        'دليل إطلاق ZM4 Mount Kunlun: ما الجديد وكيف تنهي المغامرة',
        'A practical, source-backed guide to Zombie Mode 4, Mount Kunlun, EP farming, bosses, and the event-shop rewards.',
        'دليل عملي موثق عن زومبي 4 وخريطة Mount Kunlun وجمع نقاط EP والزعماء ومكافآت متجر الحدث.',
        images['kunlun'], 'ZM4', 'CrossFire Wiki Editorial', source['mount_kunlun'],
        '''<h2>Adventure Mode, not a normal round</h2><p>Zombie Mode 4 is listed by Z8Games as <strong>Adventure Mode</strong>. The official modes page describes a map built for free exploration, skill growth, boss summons, and team play. Mount Kunlun is the map attached to the 2026 roadmap launch.</p><h2>The confirmed reward loop</h2><p>The official Mountain of Myth announcement states that players earn <strong>75 EP per minute in ZM4</strong>, up to 9,000 EP per day during the event window. EP can be exchanged for Kitsune and Oni crates at 1,000 EP each, with a maximum of 20 crates of each type per player. A permanent Vixen Doll Blue costs 40,000 EP in the CF Shop.</p><h2>How to play it well</h2><ul><li>Split roles between exploration, skill growth, and boss damage instead of grouping on one route.</li><li>Spend early power increases on consistent damage and survivability before chasing optional rewards.</li><li>Track the daily EP cap so you do not waste a session expecting more progress.</li></ul><p>The official modes page says the event boss appears 50 minutes after the game starts; defeat it to win, or the challenge ends at 60 minutes. This makes time management part of the mode, not an optional extra.</p>''',
        '''<h2>مغامرة وليست جولة عادية</h2><p>تصف Z8Games زومبي 4 بأنه <strong>طور المغامرة</strong>. صفحة الأطوار الرسمية تذكر أن الخريطة تعتمد على الاستكشاف الحر وتطوير المهارات واستدعاء الزعماء والتعاون. وخريطة Mount Kunlun هي الخريطة المرتبطة بإطلاق 2026.</p><h2>طريقة المكافآت المؤكدة</h2><p>بحسب إعلان Mountain of Myth الرسمي، يحصل اللاعب على <strong>75 نقطة EP كل دقيقة في زومبي 4</strong> وبحد أقصى 9,000 نقطة يوميًا خلال فترة الحدث. يمكن استبدال 1,000 EP بصندوق Kitsune أو Oni، بحد أقصى 20 صندوقًا من كل نوع لكل لاعب. أما دمية Vixen Doll Blue الدائمة في متجر CF فتحتاج إلى 40,000 EP.</p><h2>طريقة لعب أفضل</h2><ul><li>وزعوا الأدوار بين الاستكشاف وتطوير المهارات وإلحاق الضرر بالزعماء.</li><li>ركزوا أولًا على القوة والبقاء قبل مطاردة المكافآت الجانبية.</li><li>انتبهوا إلى الحد اليومي لنقاط EP حتى لا تضيع الجلسة بلا تقدم إضافي.</li></ul><p>تقول صفحة الأطوار الرسمية إن زعيم الحدث يظهر بعد 50 دقيقة من بداية اللعبة؛ هزيمته تعني الفوز، وتنتهي المحاولة بعد 60 دقيقة. لذلك إدارة الوقت جزء أساسي من الطور.</p>''',
        ['ZM4', 'Mount Kunlun', 'Zombie Mode 4', 'Guide'], '2026-08-14T12:00:00+00:00', True,
    ),
    post(
        'tactical-retake-mode-launch-breakdown',
        'Tactical Retake Mode: The August 6 Launch You Should Test First',
        'طور Tactical Retake: إطلاق 6 أغسطس الذي يستحق التجربة أولًا',
        'The official 2026 roadmap confirms Tactical Retake Mode. Here is a useful test plan without inventing mechanics the publisher has not documented.',
        'خارطة الطريق الرسمية تؤكد إطلاق Tactical Retake. إليك طريقة مفيدة لتجربته دون اختراع تفاصيل لم تعلنها الشركة.',
        images['tactical'], 'Modes', 'CrossFire Wiki Editorial', source['roadmap'],
        '''<h2>What is confirmed</h2><p>Z8Games lists <strong>Tactical Retake Mode</strong> on the August 6 section of the official 2026 CrossFire roadmap. The roadmap also places Mount Kunlun, Brawl Mode, and Chengdu Temple in the same update group.</p><h2>A fair first-session checklist</h2><p>Because the roadmap card confirms the release but does not publish a full ruleset, we will not pretend to know hidden score rules or unannounced balance values. Instead, record the round objective, retake timing, available utility, spawn logic, and how much information the defending team receives.</p><ul><li>Play three rounds before changing your loadout.</li><li>Write down which angles are strong on the first retake and which are traps.</li><li>Compare utility value with raw aim; a tactical mode should reward decisions, not only faster flicks.</li></ul><p>Send us your match notes through the community page. We will update this guide when Z8Games publishes a full rules explanation.</p>''',
        '''<h2>ما الذي تأكد؟</h2><p>تضع Z8Games طور <strong>Tactical Retake</strong> ضمن قسم 6 أغسطس في خارطة الطريق الرسمية لعام 2026. وتظهر معه في التحديث نفسه خريطة Mount Kunlun وطور Brawl وخريطة Chengdu Temple.</p><h2>قائمة اختبار مفيدة</h2><p>البطاقة الرسمية تؤكد الإطلاق لكنها لا تنشر نظام القواعد كاملًا، لذلك لن نخترع نقاطًا أو أرقام توازن غير معلنة. بدل ذلك، راقبوا هدف الجولة ووقت الاستعادة والأدوات ونظام الظهور وكمية المعلومات التي يحصل عليها الفريق المدافع.</p><ul><li>العبوا ثلاث جولات قبل تغيير التجهيز.</li><li>سجلوا الزوايا القوية والفخاخ في أول محاولة استعادة.</li><li>قارنوا قيمة الأدوات بالتصويب؛ الطور التكتيكي يجب أن يكافئ القرار وليس سرعة الحركة فقط.</li></ul><p>أرسلوا ملاحظاتكم من صفحة المجتمع، وسنحدث الدليل عند نشر شرح رسمي كامل.</p>''',
        ['Tactical Retake', 'New Mode', 'August 6 Update'], '2026-08-13T12:00:00+00:00', True,
    ),
    post(
        'brawl-mode-first-look-and-loadout-tips',
        'Brawl Mode First Look: How to Prepare for the Mass Fight',
        'نظرة أولى على Brawl Mode: كيف تستعد للمعركة الجماعية',
        'Brawl Mode is an official August 6 roadmap release. This article separates confirmed information from practical preparation tips.',
        'طور Brawl هو إطلاق رسمي في 6 أغسطس. هذا المقال يفصل بين المعلومات المؤكدة ونصائح الاستعداد العملية.',
        images['brawl'], 'Modes', 'CrossFire Wiki Editorial', source['roadmap'],
        '''<h2>Official launch signal</h2><p>The official roadmap lists <strong>Brawl Mode</strong> for August 6, alongside Tactical Retake and the Chengdu Temple Search & Destroy map. The roadmap confirms the launch slot and artwork; it does not provide enough public text to claim exact team sizes or scoring rules.</p><h2>Preparation that will not become outdated</h2><p>Start with a weapon that stays controllable while moving, carry utility that helps you break a crowded angle, and keep your crosshair at head height before entering a fight. In a large engagement, surviving the first contact often creates more value than chasing a single elimination.</p><ul><li>Use short bursts when several targets overlap.</li><li>Reload behind cover rather than in the middle of the group.</li><li>After each round, note where the fight actually forms instead of assuming the center is always best.</li></ul><p>This is a launch watch, not a fabricated rules guide. We will add verified mechanics and rewards when an official patch note or mode page publishes them.</p>''',
        '''<h2>تأكيد الإطلاق الرسمي</h2><p>تسجل خارطة الطريق الرسمية طور <strong>Brawl</strong> بتاريخ 6 أغسطس، إلى جانب Tactical Retake وخريطة Chengdu Temple في البحث والتدمير. الخارطة تؤكد موعد الإطلاق والصورة، لكنها لا تقدم نصًا كافيًا للجزم بعدد اللاعبين أو قواعد النقاط.</p><h2>استعدادات مفيدة</h2><p>ابدأ بسلاح سهل التحكم أثناء الحركة، واحمل أدوات تساعدك على كسر الزوايا المزدحمة، وحافظ على مستوى التصويب عند الرأس قبل الدخول. في الاشتباك الجماعي قد يكون البقاء في المواجهة الأولى أهم من مطاردة إقصاء واحد.</p><ul><li>استخدم رشقات قصيرة عندما تتداخل الأهداف.</li><li>أعد التلقيم خلف ساتر وليس وسط المجموعة.</li><li>بعد كل جولة، لاحظ مكان تجمع القتال فعليًا ولا تفترض أن الوسط هو الأفضل دائمًا.</li></ul><p>هذا رصد للإطلاق وليس دليل قواعد مخترعًا. سنضيف الميكانيكيات والمكافآت المؤكدة عندما تنشرها الشركة رسميًا.</p>''',
        ['Brawl', 'New Mode', 'Loadout'], '2026-08-13T09:00:00+00:00', False,
    ),
    post(
        'a-quick-exit-alt4-and-verdandi-launch-guide',
        'A Quick Exit: ALT+4 Weapons and Verdandi in ZM4',
        'A Quick Exit: أسلحة ALT+4 وشخصية Verdandi في زومبي 4',
        'A confirmed August 12–September 1 announcement covering the ALT+4 collection, Verdandi, and her ZM4 ability details.',
        'إعلان مؤكد من 12 أغسطس إلى 1 سبتمبر عن مجموعة ALT+4 وشخصية Verdandi وتفاصيل قدرتها في زومبي 4.',
        images['alt4'], 'Update', 'CrossFire Wiki Editorial', source['quick_exit'],
        '''<h2>What launched</h2><p>The official A Quick Exit announcement runs from <strong>August 12 through September 1, 2026</strong>. It introduces the ALT+4 collection and the VVIP character Verdandi in the Garnet Crate.</p><h2>The useful ZM4 detail</h2><p>Verdandi's listed ZM ability is <strong>Awakening (Scorched Earth)</strong>. The announcement says her attack power in ZM4 scales with buffs, which makes her a natural fit for teams that plan their upgrades instead of spending them randomly.</p><p>The announced collection includes M4A1-S-Iron ALT+4, AWM-ALT+4 Ironhawk, HK417-Elite-ALT+4, Kinetics CPW-ALT+4, FN FAL-ALT+4, Colt 1911-ALT+4, and B.C.Axe-ALT+4. Check the original post for availability and crate rules before spending currency.</p>''',
        '''<h2>ما الذي نزل؟</h2><p>يمتد إعلان A Quick Exit الرسمي من <strong>12 أغسطس إلى 1 سبتمبر 2026</strong>. ويقدم مجموعة ALT+4 وشخصية VVIP باسم Verdandi داخل Garnet Crate.</p><h2>التفصيل المفيد في زومبي 4</h2><p>قدرة Verdandi في الزومبي هي <strong>Awakening (Scorched Earth)</strong>. ويذكر الإعلان أن قوة هجومها في زومبي 4 ترتفع مع التعزيزات، لذلك تناسب الفرق التي تخطط لتطويراتها بدل إنفاقها عشوائيًا.</p><p>تشمل المجموعة الأسلحة M4A1-S-Iron ALT+4 وAWM-ALT+4 Ironhawk وHK417-Elite-ALT+4 وKinetics CPW-ALT+4 وFN FAL-ALT+4 وColt 1911-ALT+4 وB.C.Axe-ALT+4. راجعوا الإعلان الأصلي لمعرفة التوفر وقواعد الصناديق قبل إنفاق العملة.</p>''',
        ['ALT+4', 'Verdandi', 'ZM4'], '2026-08-12T12:00:00+00:00', True,
    ),
    post(
        'qbz03-demon-zombie-ability-and-weapon-watch',
        'QBZ-03-Demon: What the New Zombie Ability Means',
        'QBZ-03-Demon: ماذا تعني القدرة الجديدة في الزومبي؟',
        'A source-backed look at QBZ-03-Demon, Devil’s Judgment, and the official August 6–September 1 release window.',
        'نظرة موثقة على QBZ-03-Demon وقدرة Devil’s Judgment وفترة الإطلاق الرسمية من 6 أغسطس إلى 1 سبتمبر.',
        images['demon'], 'Weapons', 'CrossFire Wiki Editorial', source['demon'],
        '''<h2>Official release</h2><p>Demon’s Legacy is an official Infinity VIP announcement scheduled for <strong>August 6–September 1, 2026</strong>. The headline weapon is QBZ-03-Demon, and the announcement lists the zombie-mode ability <strong>Devil’s Judgment</strong>.</p><h2>How to evaluate it in a real match</h2><p>Do not judge the weapon from its name or crate rarity. Compare its sustained damage, reload downtime, movement accuracy, and how Devil’s Judgment changes a boss or elite-target rotation. A useful test uses the same map, similar skill level, and the same upgrade path across several runs.</p><p>The full weapon list and availability remain tied to the official announcement. We link to that source instead of repeating unverified community stat sheets.</p>''',
        '''<h2>الإطلاق الرسمي</h2><p>إعلان Demon’s Legacy هو إعلان رسمي لشخصية Infinity VIP خلال الفترة من <strong>6 أغسطس إلى 1 سبتمبر 2026</strong>. السلاح الرئيسي هو QBZ-03-Demon، ويذكر الإعلان قدرة الزومبي <strong>Devil’s Judgment</strong>.</p><h2>كيف تختبره داخل مباراة فعلية؟</h2><p>لا تحكم على السلاح من الاسم أو ندرة الصندوق. قارن الضرر المستمر ووقت إعادة التلقيم ودقة الحركة وتأثير Devil’s Judgment على الزعيم أو الأهداف القوية. استخدم الخريطة نفسها ومسار تطوير متقاربًا في عدة محاولات.</p><p>القائمة الكاملة والتوفر مرتبطان بالإعلان الرسمي، لذلك نضع المصدر الأصلي بدل تكرار جداول أرقام غير مؤكدة من المجتمع.</p>''',
        ['QBZ-03-Demon', 'Infinity VIP', 'Zombie Mode'], '2026-08-11T12:00:00+00:00', False,
    ),
    post(
        'crossfire-ewc26-pass-and-crate-explained',
        'CrossFire at EWC 2026: Champions Pass and CFxEWC26 Rewards',
        'كروس فاير في كأس العالم للرياضات الإلكترونية 2026: التذكرة والمكافآت',
        'A practical guide to the official August 14–23 EWC announcement, in-game missions, Champions Pass, and the CFxEWC26 crate.',
        'دليل عملي للإعلان الرسمي من 14 إلى 23 أغسطس عن المهام داخل اللعبة وChampions Pass وصندوق CFxEWC26.',
        images['ewc'], 'Tournament', 'CrossFire Wiki Editorial', source['ewc'],
        '''<h2>The event window</h2><p>Z8Games announced CrossFire at the <strong>2026 Esports World Cup from August 14–23</strong>. The official post points players to the in-game eSports tab, missions, and a Champions Pass.</p><h2>Confirmed crate items</h2><p>The CFxEWC26 crate includes HK417-CFxEWC26, M14EBR-CFxEWC26, TRG-21-CFxEWC26, and USP-Match-CFxEWC26. Treat the pass as a checklist: confirm the mission reset time, record the reward track, and do not spend currency until the official rules are clear.</p>''',
        '''<h2>فترة الحدث</h2><p>أعلنت Z8Games مشاركة CrossFire في <strong>كأس العالم للرياضات الإلكترونية 2026 من 14 إلى 23 أغسطس</strong>. ويوجه الإعلان الرسمي اللاعبين إلى تبويب الرياضات الإلكترونية والمهام وChampions Pass داخل اللعبة.</p><h2>محتويات الصندوق المؤكدة</h2><p>يشمل صندوق CFxEWC26 أسلحة HK417-CFxEWC26 وM14EBR-CFxEWC26 وTRG-21-CFxEWC26 وUSP-Match-CFxEWC26. تعامل مع التذكرة كقائمة مهام: تحقق من وقت إعادة المهام وسجل مسار المكافآت ولا تنفق العملة قبل وضوح القواعد الرسمية.</p>''',
        ['EWC 2026', 'Champions Pass', 'Rewards'], '2026-08-10T12:00:00+00:00', True,
    ),
    post(
        'crossfire-2026-leak-watch-no-confirmed-zm5-leak',
        'Leak Watch: No Confirmed ZM5 Leak, Here Is What Is Real',
        'مراقبة التسريبات: لا يوجد تسريب مؤكد لـ ZM5 وهذا هو المؤكد حاليًا',
        'A transparent rumor check: no credible first-party source confirms ZM5. The official roadmap confirms ZM4 and new modes instead.',
        'تدقيق شفاف للشائعات: لا يوجد مصدر موثوق يؤكد ZM5. المؤكد رسميًا هو ZM4 والأوضاع الجديدة.',
        images['kunlun'], 'Rumor Watch', 'CrossFire Wiki Editorial', source['roadmap'],
        '''<h2>What we found</h2><p>We checked the official CrossFire roadmap, modes page, and current Z8Games announcement feed. They confirm <strong>ZM4 Mount Kunlun</strong>, Tactical Retake, and Brawl Mode. We did not find a credible official leak confirming ZM5, a release date, or a final map.</p><h2>How to read future leaks</h2><p>A screenshot without a first-party post is not a confirmed launch. Look for a Z8Games announcement, a patch note, an official roadmap card, or an in-game notice before treating a claim as fact. We will label community speculation as <strong>Unconfirmed</strong> and link the original discussion.</p><p>This page will change only when new evidence appears. That is more useful than inventing a date that can mislead players.</p>''',
        '''<h2>ماذا وجدنا؟</h2><p>راجعنا خارطة الطريق الرسمية وصفحة الأطوار وخلاصة إعلانات Z8Games. المصادر تؤكد <strong>ZM4 Mount Kunlun</strong> وTactical Retake وBrawl Mode، لكننا لم نجد تسريبًا رسميًا موثوقًا يؤكد ZM5 أو موعدًا أو خريطة نهائية له.</p><h2>كيف تقرأ التسريبات القادمة؟</h2><p>الصورة وحدها من دون منشور رسمي لا تعني أن الإطلاق مؤكد. ابحث عن إعلان من Z8Games أو ملاحظات تحديث أو بطاقة في خارطة الطريق أو إشعار داخل اللعبة قبل اعتبار الخبر حقيقة. سنضع وسم <strong>غير مؤكد</strong> على كلام المجتمع ونضع رابط النقاش الأصلي.</p><p>سيتغير هذا المقال فقط عندما يظهر دليل جديد. هذا أفضل للاعبين من اختراع موعد قد يضللهم.</p>''',
        ['Unconfirmed', 'Rumor Watch', 'ZM5'], '2026-08-09T12:00:00+00:00', False,
    ),
]


def news(slug: str, title: str, title_ar: str, image: str, category: str, source_url: str, content: str, content_ar: str, created_at: str, breaking: bool = False):
    return {
        'title': title,
        'title_ar': title_ar,
        'news_slug': slug,
        'content': content,
        'content_ar': content_ar,
        'date_range': '',
        'image_url': image,
        'images': [image],
        'category': category,
        'author': 'CrossFire Wiki Editorial',
        'featured': breaking,
        'breaking': breaking,
        'preview_on_home': True,
        'seo_title': title,
        'seo_description': content.replace('<', ' <').split('>')[-1][:155],
        'seo_keywords': [],
        'canonical_url': f'https://crossfire.wiki/news/{slug}',
        'source_url': source_url,
        'created_at': created_at,
        'updated_at': created_at,
    }


news_items = [
    news('zm4-mount-kunlun-and-two-new-modes-launch', 'ZM4 Mount Kunlun, Tactical Retake, and Brawl Mode Arrive', 'إطلاق ZM4 Mount Kunlun وTactical Retake وBrawl Mode', images['kunlun'], 'Patch', source['roadmap'], '<p>The official August 6 roadmap lists Mount Kunlun for ZM4, Tactical Retake Mode, and Brawl Mode. Check the full guide for confirmed details and a fair test plan.</p>', '<p>تسجل خارطة الطريق الرسمية في 6 أغسطس خريطة Mount Kunlun لزومبي 4 وطورَي Tactical Retake وBrawl. راجع الدليل الكامل للتفاصيل المؤكدة وطريقة اختبار مفيدة.</p>', '2026-08-14T14:00:00+00:00', True),
    news('a-quick-exit-august-12-september-1', 'A Quick Exit Adds ALT+4 Weapons and Verdandi', 'حدث A Quick Exit يضيف أسلحة ALT+4 وشخصية Verdandi', images['alt4'], 'Update', source['quick_exit'], '<p>A Quick Exit runs from August 12 to September 1. The official announcement covers the ALT+4 collection and VVIP character Verdandi, including her ZM4 ability.</p>', '<p>يمتد A Quick Exit من 12 أغسطس إلى 1 سبتمبر. ويغطي الإعلان الرسمي مجموعة ALT+4 وشخصية VVIP Verdandi وقدرتها في زومبي 4.</p>', '2026-08-14T13:00:00+00:00', True),
    news('crossfire-ewc-2026-august-14-23', 'CrossFire at EWC 2026 Starts August 14', 'مشاركة CrossFire في كأس العالم 2026 تبدأ في 14 أغسطس', images['ewc'], 'Tournament', source['ewc'], '<p>The official EWC announcement runs August 14–23 with eSports-tab missions, a Champions Pass, and the CFxEWC26 reward crate.</p>', '<p>يمتد إعلان كأس العالم الرسمي من 14 إلى 23 أغسطس، مع مهام تبويب الرياضات الإلكترونية وChampions Pass وصندوق مكافآت CFxEWC26.</p>', '2026-08-14T11:00:00+00:00', True),
    news('verdandi-and-alt4-weapon-list', 'Verdandi and the ALT+4 Collection: The Confirmed List', 'Verdandi ومجموعة ALT+4: القائمة المؤكدة', images['verdandi'], 'Update', source['quick_exit'], '<p>The official list includes M4A1-S-Iron ALT+4, AWM-ALT+4 Ironhawk, HK417-Elite-ALT+4, Kinetics CPW-ALT+4, FN FAL-ALT+4, Colt 1911-ALT+4, and B.C.Axe-ALT+4.</p>', '<p>تشمل القائمة الرسمية M4A1-S-Iron ALT+4 وAWM-ALT+4 Ironhawk وHK417-Elite-ALT+4 وKinetics CPW-ALT+4 وFN FAL-ALT+4 وColt 1911-ALT+4 وB.C.Axe-ALT+4.</p>', '2026-08-13T11:00:00+00:00'),
    news('qbz03-demon-devils-judgment', 'QBZ-03-Demon Brings Devil’s Judgment to Zombie Mode', 'QBZ-03-Demon يضيف Devil’s Judgment إلى طور الزومبي', images['demon'], 'Patch', source['demon'], '<p>Demon’s Legacy is scheduled for August 6–September 1. QBZ-03-Demon is the headline Infinity VIP weapon and carries the listed Devil’s Judgment zombie ability.</p>', '<p>يمتد Demon’s Legacy من 6 أغسطس إلى 1 سبتمبر. ويأتي QBZ-03-Demon كسلاح Infinity VIP الرئيسي مع قدرة الزومبي Devil’s Judgment.</p>', '2026-08-12T11:00:00+00:00'),
    news('no-confirmed-zm5-leak', 'Rumor Check: No Credible ZM5 Leak Has Been Confirmed', 'تدقيق شائعة: لا يوجد تسريب موثوق ومؤكد عن ZM5', images['kunlun'], 'Community', source['roadmap'], '<p>We found no credible first-party confirmation of ZM5. The verified August roadmap is focused on ZM4 Mount Kunlun and new modes, so treat community screenshots as unconfirmed until Z8Games publishes evidence.</p>', '<p>لم نجد تأكيدًا موثوقًا من المصدر الرسمي عن ZM5. خارطة أغسطس المؤكدة تركز على ZM4 Mount Kunlun والأوضاع الجديدة، لذلك اعتبروا صور المجتمع غير مؤكدة حتى تنشر Z8Games دليلًا رسميًا.</p>', '2026-08-11T11:00:00+00:00'),
]

# Backup before destructive replacement.
BACKUP_PATH.parent.mkdir(parents=True, exist_ok=True)
backup = {
    'created_at': datetime.now(timezone.utc).isoformat(),
    'posts': rest('GET', 'posts', params={'select': '*', 'order': 'created_at.desc'}),
    'news': rest('GET', 'news', params={'select': '*', 'order': 'created_at.desc'}),
}
BACKUP_PATH.write_text(json.dumps(backup, ensure_ascii=False, indent=2), encoding='utf-8')

# Delete only the current content tables, then insert the curated replacement set.
for table in ('posts', 'news'):
    rest('DELETE', table, params={'id': 'not.is.null'})

rest('POST', 'posts', body=posts)
rest('POST', 'news', body=news_items)

print(json.dumps({
    'backup': str(BACKUP_PATH),
    'posts_inserted': len(posts),
    'news_inserted': len(news_items),
    'official_sources_used': sorted(set(source.values())),
    'leak_policy': 'No confirmed ZM5 leak found; rumor item is explicitly labeled unconfirmed.',
}, ensure_ascii=False, indent=2))
