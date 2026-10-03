import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase URL or service role key. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const channelBase = 'https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o';
const rows = [
  {
    slug: 'crossfire-west-october-2026-update-leaks', date: '2026-09-20T17:07:00Z', category: 'updates', featured: true,
    title: 'CrossFire West October 2026 Update — Reported Preview', titleAr: 'تسريبات تحديث CrossFire West القادم — أكتوبر 2026',
    summary: 'A reported preview of Season 8 Red Horse, Halloween 2026 content, ranked rewards, and new Master Hero Mode X maps.',
    summaryAr: 'ملخص منقول عن الإضافات المتوقعة في الموسم الثامن ومحتوى الهالوين ونهاية التصنيف والخرائط الجديدة.',
    en: `<h2>Reported content for the October update</h2><p>The channel report points to a new CFPass season named <strong>Season 8 Red Horse</strong>, with QBZ-03-Knife E.B, Desert Eagle-B.B, and Kukri-Beast among the highlighted rewards. The report also mentions additional Red Horse accessories, including a doll, backpack, spray, namecard, and frame.</p><h3>Halloween 2026</h3><p>The reported Halloween package includes themed crates, AK47-K. B.B. Halloween, Scythe-Halloween, grenade and smoke variants, plus Horror Hide & Seek and Halloween maps for TDM and Elimination.</p><h3>Important note</h3><p>This is a community-sourced report attributed to Gokhan, not an official confirmation. Treat the listed content as unverified until CrossFire West publishes the final patch details.</p>`,
    ar: `<h2>المحتوى المنقول عن تحديث أكتوبر</h2><p>يتحدث المنشور عن موسم جديد من CFPass باسم <strong>Season 8 Red Horse</strong>، مع أسلحة ومكافآت أبرزها QBZ-03-Knife E.B وDesert Eagle-B.B وKukri-Beast، إلى جانب إكسسوارات خاصة بالموسم مثل الدمية والحقيبة والرشاش وبطاقة الاسم والإطار.</p><h3>محتوى الهالوين 2026</h3><p>يشير التقرير إلى صناديق هالوين جديدة، وأسلحة AK47-K. B.B. Halloween وScythe-Halloween، مع إصدارات خاصة من القنبلة والدخان، بالإضافة إلى طور Horror Hide & Seek وخرائط هالوين لأطوار TDM وElimination.</p><h3>تنبيه</h3><p>هذه معلومات مجتمعية منقولة عن Gokhan وليست إعلانًا رسميًا. ستظل غير مؤكدة حتى تنشر CrossFire West تفاصيل التحديث النهائية.</p>`
  },
  {
    slug: 'crossfire-lore-series-announcement', date: '2026-09-24T14:50:00Z', category: 'article', featured: false,
    title: 'CrossFire Lore Series: Behind the Maps and Factions', titleAr: 'سلسلة قصص CrossFire: أسرار الخرائط والفصائل',
    summary: 'A new community series exploring the hidden stories behind CrossFire maps, characters, Global Risk, and Black List.', summaryAr: 'إعلان عن سلسلة مجتمعية تستكشف قصص الخرائط والشخصيات والصراع بين Global Risk وBlack List.',
    en: `<p>During the international break, the channel announced a lore series focused on the world behind CrossFire. Future entries will explore the origins of maps, the rivalry between Global Risk and Black List, and the stories that are easy to miss during normal matches.</p><p>The series is community-led and will be expanded through reader questions and reactions. It is intended as an editorial interpretation, not a replacement for official game documentation.</p>`,
    ar: `<p>خلال فترة التوقف الدولي، أعلنَت القناة عن سلسلة قصصية تركز على العالم الموجود خلف مباريات CrossFire. ستتناول الحلقات القادمة أصول الخرائط، والصراع بين Global Risk وBlack List، والتفاصيل التي قد لا يلاحظها اللاعب أثناء اللعب العادي.</p><p>السلسلة مجتمعية وستتوسع من خلال أسئلة المتابعين وآرائهم، وهي قراءة تحريرية وليست بديلًا عن التوثيق الرسمي للعبة.</p>`
  },
  {
    slug: 'crossfire-destiny-sisters-trilogy', date: '2026-09-24T15:20:00Z', category: 'article', featured: false,
    title: 'Destiny Sisters: The Three Threads of Fate', titleAr: 'الأخوات الثلاث: خيوط القدر في CrossFire',
    summary: 'An introduction to Urd, Verdandi, and Skuld and their mythological inspiration.', summaryAr: 'مقدمة عن Urd وVerdandi وSkuld والإلهام الأسطوري وراء تصميم الشخصيات.',
    en: `<h2>Who are the Destiny Sisters?</h2><p>The series introduces Urd, Verdandi, and Skuld as three characters built around the ideas of past, present, and future. Their visual direction combines mythological references with futuristic combat technology.</p><p>Urd represents the past and its secrets. Verdandi represents the present and acts as the sisters' spearhead. Skuld represents the future and remains unavailable in CrossFire West at the time of the report.</p><p>Later entries are planned to cover their development history, hidden abilities, and roles in Zombie Mode.</p>`,
    ar: `<h2>من هن الأخوات الثلاث؟</h2><p>تقدم السلسلة شخصيات Urd وVerdandi وSkuld باعتبارهن ثلاث شخصيات تدور فكرتها حول الماضي والحاضر والمستقبل. يجمع تصميمهن بين المراجع الأسطورية وتقنيات القتال المستقبلية.</p><p>تمثل Urd الماضي وأسراره، بينما تمثل Verdandi الحاضر وتعمل كرأس حربة للأخوات. أما Skuld فتمثل المستقبل ولم تكن قد وصلت إلى CrossFire West وقت كتابة المنشور.</p><p>ستتناول الحلقات التالية تاريخ تطوير الشخصيات وقدراتها الخفية وأدوارها في طور الزومبي.</p>`
  },
  {
    slug: 'crossfire-urd-character-guide', date: '2026-09-24T20:08:00Z', category: 'guides', featured: false,
    title: 'Urd: Abilities, Factions, and Beta Details', titleAr: 'Urd: القدرات والفصائل وتفاصيل النسخة التجريبية',
    summary: 'A reference entry for Urd, including her faction outfits, Zombie Mode perks, and a removed beta ability.', summaryAr: 'مرجع لشخصية Urd يتناول أشكال الفصائل ومزايا طور الزومبي والقدرة التي أزيلت من النسخة التجريبية.',
    en: `<h2>Official profile</h2><p>Urd is presented as the sister connected to the past. Her three faction outfits share long silver hair while changing the color language and accessories for Black List, Global Risk, and Special.</p><h3>Gameplay features</h3><p>The reported kit includes a hidden melee attack, mutation-oriented perks, a disguise ability, and Hunter's Mark for locating enemies.</p><h3>Beta note</h3><p>An Awakening ability that transformed Urd into a ninja with a circular Energy Blade attack was reportedly removed. A Sonic Wave effect was later added to the second Energy Blade strike in Zombie Mode. These details remain community-reported.</p>`,
    ar: `<h2>النبذة الرسمية</h2><p>تظهر Urd كشخصية مرتبطة بالماضي. تشترك أشكالها الثلاثة في الشعر الفضي الطويل، مع اختلاف الألوان والإكسسوارات بين Black List وGlobal Risk والشكل الخاص.</p><h3>مزايا اللعب</h3><p>تتضمن القدرات المنقولة هجوم قتال قريب مخفي، ومزايا قوية لأطوار التحول، وقدرة للتخفي، ومهارة Hunter's Mark لتحديد أماكن الخصوم.</p><h3>معلومة عن النسخة التجريبية</h3><p>يُقال إن قدرة Awakening كانت تحول Urd إلى مقاتلة نينجا تستخدم Energy Blade بضربة دائرية، ثم أزيلت من النسخة التجريبية. وبعد ذلك أضيف تأثير Sonic Wave إلى الضربة الثانية في طور الزومبي. تظل هذه التفاصيل منقولة من المجتمع.</p>`
  },
  {
    slug: 'crossfire-verdandi-character-guide', date: '2026-09-24T20:14:00Z', category: 'guides', featured: false,
    title: 'Verdandi: The Mechanical Spearhead', titleAr: 'Verdandi: رأس الحربة الآلي للأخوات',
    summary: 'A profile of Verdandi, her faction variants, armor-piercing Smash, and Gatling Gun in Zombie Mode.', summaryAr: 'ملف شخصية Verdandi وأشكال الفصائل ومهارة Smash ورشاش Gatling في طور الزومبي.',
    en: `<h2>Role and design</h2><p>Verdandi represents the present and the flow of time. Her reported profile describes tactical futuristic armor, masks, and three faction variants with distinct hair and outfit designs.</p><h3>Abilities</h3><p>Her Smash skill is described as a forward burst with an armor-piercing strike. In Zombie Mode, she can use a Gatling Gun to fight monsters and bosses.</p><p>The report also notes that Verdandi is classified as VIP rather than Infinity, despite receiving a powerful Smash ability usually associated with Infinity characters. This classification and the exact balance values should be verified against the game.</p>`,
    ar: `<h2>الدور والتصميم</h2><p>تمثل Verdandi الحاضر وتدفق الوقت. ويصفها المنشور بدرع تكتيكي مستقبلي وأقنعة ثابتة، مع ثلاثة أشكال للفصائل تختلف في الملابس وتسريحة الشعر.</p><h3>القدرات</h3><p>توصف مهارة Smash بأنها اندفاع للأمام يتبعه هجوم قوي يخترق الدروع. وفي طور الزومبي تستطيع استخدام رشاش Gatling لمواجهة الوحوش والزعماء.</p><p>يشير التقرير أيضًا إلى تصنيف Verdandi ضمن فئة VIP بدلًا من Infinity، رغم حصولها على مهارة قوية ترتبط عادةً بشخصيات Infinity. يجب مراجعة هذا التصنيف وقيم التوازن من داخل اللعبة.</p>`
  },
  {
    slug: 'crossfire-alexandrina-arrabella-lore', date: '2026-09-26T18:13:00Z', category: 'article', featured: false,
    title: 'Alexandrina / Arrabella: Royalty and Combat Lore', titleAr: 'Alexandrina / Arrabella: قصة النشأة والقتال',
    summary: 'A lore-focused profile of Arrabella in CrossFire West, covering her royal origin, factions, and Zombie Mode role.', summaryAr: 'ملف قصصي عن Arrabella في CrossFire West، من أصلها الملكي إلى أدوارها في الفصائل وطور الزومبي.',
    en: `<h2>Origin</h2><p>The channel describes Alexandrina, known as Arrabella in CrossFire West, as a descendant of old European royal families that secretly trained their heirs in combat and espionage.</p><h3>Faction contrast</h3><p>Her Black List interpretation emphasizes direct attacks and the Smash skill, while the Global Risk interpretation focuses on security work and the C4 Music Box theme.</p><h3>Zombie Mode</h3><p>The report attributes a special transformation to Barrett M82A1-Beast, with a fire aura, team healing, movement support, and open ammunition. These gameplay claims should be treated as a community guide until verified in the live version.</p>`,
    ar: `<h2>الأصل</h2><p>يقدم المنشور Alexandrina، المعروفة باسم Arrabella في CrossFire West، باعتبارها من نسل عائلات أوروبية ملكية قديمة دربت أبناءها سرًا على القتال والتجسس.</p><h3>اختلاف الفصائل</h3><p>يركز شكل Black List على الهجوم المباشر ومهارة Smash، بينما يركز شكل Global Risk على حماية الأمن وفكرة C4 Music Box.</p><h3>طور الزومبي</h3><p>ينسب التقرير إلى الشكل الخاص قدرة تحول مرتبطة بسلاح Barrett M82A1-Beast، مع هالة نارية ودعم للفريق في العلاج والسرعة والذخيرة. هذه التفاصيل دليل مجتمعي إلى أن يتم التحقق منها داخل النسخة الفعلية.</p>`
  },
  {
    slug: 'crossfire-alexandrina-abilities-breakdown', date: '2026-09-26T18:19:00Z', category: 'guides', featured: false,
    title: 'Alexandrina: Ability Breakdown and Feature Notes', titleAr: 'Alexandrina: شرح القدرات والمزايا الخاصة',
    summary: 'A detailed breakdown of the reported Awakening, Explosive Expert, Smash, and Infinity features.', summaryAr: 'شرح تفصيلي للقدرات المنقولة مثل Awakening وExplosive Expert وSmash والمزايا الخاصة.',
    en: `<h2>Reported abilities</h2><p>The report lists an Awakening activation in Zombie Mode that equips Barrett M82A1-Beast and creates a damaging fire aura. It also describes temporary team buffs such as healing, damage reduction, movement speed, and unlimited ammunition.</p><h3>Explosive Expert</h3><p>The C4 Music Box variant is described as a fast-planting and fast-defusing tool with an on-screen countdown in Search and Destroy modes.</p><h3>Additional features</h3><p>The character is also reported to have a close-range Smash punch, a Special form for Zombie Mode, a victory emote, lobby voice lines, and multiple skill slots. Exact effects can change by region and version.</p>`,
    ar: `<h2>القدرات المنقولة</h2><p>يذكر التقرير تفعيل Awakening في طور الزومبي لتجهيز Barrett M82A1-Beast وإنشاء هالة نارية تسبب ضررًا للوحوش. كما يصف دعمًا مؤقتًا للفريق يشمل العلاج وتقليل الضرر وزيادة سرعة الحركة والذخيرة المفتوحة.</p><h3>خبيرة المتفجرات</h3><p>يوصف إصدار C4 Music Box بأنه أداة للزرع والفك السريع، مع عداد تنازلي ظاهر على الشاشة في أطوار Search and Destroy.</p><h3>مزايا إضافية</h3><p>ينسب المنشور للشخصية أيضًا ضربة Smash قريبة، وشكلًا خاصًا لأطوار الزومبي، وحركة فوز، وصوتيات خاصة في الردهة، وعدة خانات للمهارات. قد تختلف التأثيرات الدقيقة حسب المنطقة والإصدار.</p>`
  },
  {
    slug: 'crossfire-classic-to-be-continued-red-dragon-event', date: '2026-10-01T14:53:00Z', category: 'events', featured: true,
    title: 'Classic To Be Continued: Red Dragon Collection Event', titleAr: 'حدث Classic To Be Continued: جمع أسلحة Red Dragon',
    summary: 'A time-limited Classic server event offering Red Dragon crates through daily play and a five-day challenge.', summaryAr: 'حدث محدود في السيرفر الكلاسيكي يمنح صناديق Red Dragon من خلال اللعب اليومي وتحدي خمسة أيام.',
    en: `<h2>Event overview</h2><p>The reported event runs from October 1 through October 6 and focuses on collecting Red Dragon weapon crates on the Classic server.</p><h3>Rewards</h3><p>Playing for 30 minutes in any mode can grant one Red Dragon Rifle Crate, repeatable up to three times per day. Playing for 30 minutes on five consecutive days is reported to grant 30 Advanced Red Dragon Crates.</p><h3>Conditions</h3><p>Matches must be completed, password-protected rooms do not count, and progress should be checked through the official event page.</p><p><a href="https://crossfire.z8games.com/events.html">Official event page</a></p>`,
    ar: `<h2>نظرة على الحدث</h2><p>يُقال إن الحدث يمتد من 1 أكتوبر إلى 6 أكتوبر، ويركز على جمع صناديق أسلحة Red Dragon في السيرفر الكلاسيكي.</p><h3>الجوائز</h3><p>اللعب لمدة 30 دقيقة في أي طور قد يمنح صندوق Red Dragon Rifle واحدًا، ويمكن تكرار المهمة حتى ثلاث مرات يوميًا. واللعب 30 دقيقة يوميًا لمدة خمسة أيام متتالية يمنح، حسب المنشور، 30 صندوقًا متقدمًا من Red Dragon.</p><h3>الشروط</h3><p>يجب إكمال المباريات حتى النهاية، ولا تُحتسب الغرف المحمية بكلمة مرور، ويمكن متابعة التقدم من صفحة الأحداث الرسمية.</p><p><a href="https://crossfire.z8games.com/events.html">صفحة الحدث الرسمية</a></p>`
  },
  {
    slug: 'crossfire-dean-wild-west-character-lore', date: '2026-10-02T21:03:00Z', category: 'article', featured: false,
    title: 'Dean: Wild West Character Lore and Design Notes', titleAr: 'Dean: قصة شخصية Wild West وتفاصيل تصميمها',
    summary: 'A lore entry about Dean, his Old West identity, mercenary background, voice style, and weapon design.', summaryAr: 'مقال قصصي عن Dean وهويته المستوحاة من الغرب القديم وخلفيته كمرتزق وتصميم أسلحته.',
    en: `<h2>From the Old West to modern contracts</h2><p>The channel presents Dean as a character inspired by classic western gunfighters. His story moves from a ruthless Old West group to modern mercenary work, connecting the visual language of the character to the wider CrossFire conflict.</p><h3>Design details</h3><p>The name, southern voice style, and western presentation are used to establish a one-shot gunslinger identity. The posters reportedly combine the classic theme with modern shotguns such as Remington 870 and M37 Stakeout.</p><p>This is a community lore interpretation intended for the archive; it should not be confused with an official biography unless the game publisher confirms the details.</p>`,
    ar: `<h2>من الغرب القديم إلى عقود المرتزقة</h2><p>يقدم المنشور Dean كشخصية مستوحاة من مقاتلي الغرب الأمريكي الكلاسيكي. تنتقل قصته من مجموعة مسلحين قاسية في الغرب القديم إلى العمل كمرتزق في العصر الحديث، مع ربط مظهره بصراع CrossFire الأوسع.</p><h3>تفاصيل التصميم</h3><p>يُستخدم الاسم وطريقة الأداء الصوتي ولهجة الجنوب الأمريكي لبناء صورة مقاتل يعتمد على الحسم السريع. كما تجمع الملصقات بين الطابع القديم وأسلحة حديثة مثل Remington 870 وM37 Stakeout.</p><p>هذه قراءة قصصية مجتمعية مخصصة للأرشيف، ولا ينبغي اعتبارها سيرة رسمية قبل تأكيدها من ناشر اللعبة.</p>`
  }
];

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
async function request(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await response.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return body;
}

async function writePost(path, method, payload) {
  let current = { ...payload };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await request(path, { method, body: JSON.stringify(current) });
    } catch (error) {
      const message = String(error?.message || error);
      const missing = message.match(/(?:column|field) '([^']+)'/i) || message.match(/the '([^']+)' column/i) || message.match(/column "([^"]+)"/i);
      if (!missing || !(missing[1] in current)) throw error;
      delete current[missing[1]];
    }
  }
  throw new Error('Could not write post after removing unsupported columns.');
}

async function upsertPost(post) {
  const sourceUrl = post.sourceId ? `${channelBase}/${post.sourceId}` : channelBase;
  const payload = {
    title: post.title, title_ar: post.titleAr, post_slug: post.slug,
    content: post.en, content_ar: post.ar, summary: post.summary, summary_ar: post.summaryAr,
    image_url: '', og_image: '', gallery: [], category: post.category,
    tags: ['CrossFire West', post.category, 'WhatsApp Channel'], author: 'CrossFire Wiki',
    featured: post.featured, preview_on_home: true, language: 'en', template: 'wiki', full_layout: true,
    seo_title: post.title, seo_description: post.summary, focus_keyword: post.title,
    canonical_url: `https://crossfire.wiki/posts/${post.slug}`, source_url: sourceUrl,
    created_at: post.date, updated_at: new Date().toISOString()
  };
  const existing = await request(`posts?post_slug=eq.${encodeURIComponent(post.slug)}&select=id&limit=1`);
  if (Array.isArray(existing) && existing[0]?.id) {
    await writePost(`posts?id=eq.${encodeURIComponent(existing[0].id)}`, 'PATCH', payload);
    return 'updated';
  }
  await writePost('posts', 'POST', payload);
  return 'inserted';
}

(async () => {
  let inserted = 0; let updated = 0;
  for (const post of rows) {
    const result = await upsertPost({ ...post, sourceId: ['632','638','639','640','641','644','645','655'][rows.indexOf(post)] });
    if (result === 'inserted') inserted += 1; else updated += 1;
    console.log(`${result}: ${post.slug}`);
  }
  console.log(`Completed: ${inserted} inserted, ${updated} updated. Image fields intentionally remain empty for admin upload.`);
})().catch((error) => { console.error(error); process.exit(1); });
