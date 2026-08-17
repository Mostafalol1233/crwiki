export const REGIONAL_EDITION_RECORDS = [
  {
    slug: "china-pc",
    region: "china",
    name: "CrossFire China PC",
    platform: "PC",
    publisher: "Tencent Games",
    status: "active",
    sourceUrl: "https://cf.qq.com/main.shtml",
    sourceLabel: "Tencent CrossFire official portal",
    checkedAt: "2026-08-17",
    summaryEn: "Tencent's mainland China PC service has separate official sections for weapons, maps, modes, guides, activities, and esports. Its records should be treated as China-PC data rather than assumed to apply to every regional client.",
    summaryAr: "تحتوي نسخة CrossFire الصينية للحاسوب التابعة لـ Tencent على أقسام رسمية منفصلة للأسلحة والخرائط والأنماط والأدلة والفعاليات والرياضات الإلكترونية. يجب التعامل مع بياناتها كبيانات خاصة بنسخة الصين، وليس كبيانات مشتركة مع كل الإصدارات.",
    factsEn: ["Official weapons and item catalogue", "Dedicated activity and guide indexes", "China-specific maps, modes, and patch coverage"],
    factsAr: ["كتالوج رسمي للأسلحة والعناصر", "فهارس مستقلة للفعاليات والأدلة", "خرائط وأنماط وتحديثات خاصة بالصين"],
  },
  {
    slug: "west-pc",
    region: "west",
    name: "CrossFire West",
    platform: "PC",
    publisher: "Z8Games",
    status: "active",
    sourceUrl: "https://crossfire.z8games.com/weapons.html",
    sourceLabel: "Z8Games official weapons catalogue",
    checkedAt: "2026-08-17",
    summaryEn: "The Z8Games client exposes a searchable weapons catalogue with ZP, GP, MP, Zombie, VIP, and New filters, eight weapon classes, and 37 catalogue pages at the time of review.",
    summaryAr: "يعرض موقع Z8Games كتالوجاً رسمياً قابلاً للبحث يضم فلاتر ZP وGP وMP وZombie وVIP وNew، وثماني فئات للأسلحة، و37 صفحة في وقت المراجعة.",
    factsEn: ["Searchable first-party catalogue", "ZP, GP, MP, Zombie, VIP, and New filters", "Eight weapon classes and 37 pages checked"],
    factsAr: ["كتالوج رسمي قابل للبحث", "فلاتر ZP وGP وMP وZombie وVIP وNew", "ثماني فئات و37 صفحة تمت مراجعتها"],
  },
  {
    slug: "vietnam-legends-mobile",
    region: "vietnam",
    name: "Crossfire: Legends Vietnam",
    platform: "Mobile",
    publisher: "VNG Games",
    status: "active",
    sourceUrl: "https://cfl.vnggames.com/",
    sourceLabel: "VNG Games official Crossfire: Legends portal",
    checkedAt: "2026-08-17",
    summaryEn: "VNG's Vietnam mobile edition documents Bomb, Team Deathmatch, Survival, and Zombie Mode alongside a localized character and map roster. These records must remain separate from PC CrossFire catalogues.",
    summaryAr: "توثق نسخة Crossfire: Legends المحمولة في فيتنام التابعة لـ VNG أنماط Bomb وTeam Deathmatch وSurvival وZombie Mode، إلى جانب قائمة محلية من الشخصيات والخرائط. يجب إبقاء هذه البيانات منفصلة عن كتالوجات CrossFire للحاسوب.",
    factsEn: ["Mobile edition with VNG publisher data", "Four named modes on the official portal", "Localized characters and map list"],
    factsAr: ["نسخة محمولة ببيانات ناشر VNG", "أربعة أنماط مذكورة رسمياً", "قائمة محلية للشخصيات والخرائط"],
  },
  {
    slug: "crossfire-stars-regional-leagues",
    region: "global",
    name: "CrossFire Stars regional league structure",
    platform: "Esports",
    publisher: "Smilegate Entertainment",
    status: "active",
    sourceUrl: "https://www.crossfirestars.com/en/index",
    sourceLabel: "CrossFire Stars official esports portal",
    checkedAt: "2026-08-17",
    summaryEn: "The official CrossFire Stars structure distinguishes CFPL in China, CFBL in Brazil, CFVL in Vietnam, CFWL in the West, and SEA MASTERS in Southeast Asia, with regional paths leading toward the CFS Grand Finals.",
    summaryAr: "يفصل الهيكل الرسمي لـ CrossFire Stars بين CFPL في الصين وCFBL في البرازيل وCFVL في فيتنام وCFWL في الغرب وSEA MASTERS في جنوب شرق آسيا، مع مسارات إقليمية تؤدي إلى نهائيات CFS الكبرى.",
    factsEn: ["CFPL, CFBL, CFVL, and CFWL regional labels", "SEA MASTERS for Southeast Asia", "Regional qualification path to CFS Grand Finals"],
    factsAr: ["مسميات CFPL وCFBL وCFVL وCFWL الإقليمية", "بطولة SEA MASTERS لجنوب شرق آسيا", "مسار تأهل إقليمي إلى نهائيات CFS الكبرى"],
  },
];

export const REGIONAL_WEAPON_RECORDS = [
  {
    slug: "china-ak103-red-shadow",
    name: "AK103-赤影",
    englishName: "AK103 — Red Shadow",
    category: "Assault Rifle",
    edition: "china-pc",
    region: "china",
    sourceUrl: "https://cf.qq.com/main.shtml",
    sourceLabel: "Tencent CrossFire official guide index",
    checkedAt: "2026-08-17",
    verification: "Official guide-index mention; direct article metadata still pending",
    notesEn: "Listed in the current Tencent guide/news index as a newly introduced hero weapon. The wiki records the official Chinese name and keeps the English rendering clearly marked as a translation.",
    notesAr: "ظهرت في فهرس الأدلة والأخبار الحالي لدى Tencent كسلاح Hero جديد. يحتفظ الويكي بالاسم الصيني الرسمي ويعرض الترجمة الإنجليزية بوصفها ترجمة لا اسماً رسمياً.",
  },
  {
    slug: "west-qbz03-demon",
    name: "QBZ-03-Demon",
    category: "Assault Rifle",
    edition: "west-pc",
    region: "west",
    imageUrl: "https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/C5469.png",
    sourceUrl: "https://crossfire.z8games.com/weapons.html",
    sourceLabel: "Z8Games official weapons catalogue",
    checkedAt: "2026-08-17",
    verification: "Visible in the first loaded catalogue page",
    notesEn: "The official catalogue places this item in its weapon inventory. The page supplies the image through the Z8Games CDN; the wiki stores the source URL and does not infer damage or availability outside West.",
    notesAr: "يظهر هذا العنصر في مخزون الأسلحة الرسمي. توفر الصفحة الصورة عبر شبكة Z8Games، بينما يحتفظ الويكي برابط المصدر ولا يستنتج الضرر أو التوفر خارج نسخة الغرب.",
  },
  {
    slug: "west-ak47-k-cf-stars-beast",
    name: "AK-47-K-CF Stars Beast",
    category: "Assault Rifle",
    edition: "west-pc",
    region: "west",
    imageUrl: "https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/W9773.png",
    sourceUrl: "https://crossfire.z8games.com/weapons.html",
    sourceLabel: "Z8Games official weapons catalogue",
    checkedAt: "2026-08-17",
    verification: "Visible in the first loaded catalogue page",
    notesEn: "A CF Stars-branded item visible in the official West catalogue. Regional availability outside the Z8Games catalogue is not assumed.",
    notesAr: "عنصر يحمل علامة CF Stars ويظهر في كتالوج الغرب الرسمي. لا يفترض الويكي توفره في المناطق الأخرى دون مصدر مستقل.",
  },
  {
    slug: "west-an94-transformer-cf-stars",
    name: "AN94-Transformer-CF Stars",
    category: "Assault Rifle",
    edition: "west-pc",
    region: "west",
    imageUrl: "https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/W9769.png",
    sourceUrl: "https://crossfire.z8games.com/weapons.html",
    sourceLabel: "Z8Games official weapons catalogue",
    checkedAt: "2026-08-17",
    verification: "Visible in the first loaded catalogue page",
    notesEn: "The item name and image are recorded from the first loaded page of the official catalogue. Detailed stats are intentionally left blank until the item detail response is captured.",
    notesAr: "تم تسجيل الاسم والصورة من الصفحة الأولى المحملة في الكتالوج الرسمي. تُترك الإحصاءات فارغة عمداً إلى أن يتم التقاط استجابة تفاصيل العنصر.",
  },
  {
    slug: "west-hk417-cf-stars-spitfire-beast",
    name: "HK417-CF Stars Spitfire Beast",
    category: "Assault Rifle",
    edition: "west-pc",
    region: "west",
    imageUrl: "https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/W9751.png",
    sourceUrl: "https://crossfire.z8games.com/weapons.html",
    sourceLabel: "Z8Games official weapons catalogue",
    checkedAt: "2026-08-17",
    verification: "Visible in the first loaded catalogue page",
    notesEn: "A catalogued CF Stars weapon with an official CDN image. No cross-region or numerical-stat claims are added without another source.",
    notesAr: "سلاح CF Stars مدرج في الكتالوج مع صورة رسمية من شبكة CDN. لا يضيف الويكي ادعاءات إقليمية أو أرقام إحصاءات دون مصدر آخر.",
  },
  {
    slug: "west-m4a1s-prometheus",
    name: "M4A1-S-Prometheus",
    category: "Assault Rifle",
    edition: "west-pc",
    region: "west",
    imageUrl: "https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/W9518.png",
    sourceUrl: "https://crossfire.z8games.com/weapons.html",
    sourceLabel: "Z8Games official weapons catalogue",
    checkedAt: "2026-08-17",
    verification: "Visible in the first loaded catalogue page",
    notesEn: "The official West catalogue lists this M4A1-S variant. Stats, acquisition method, and other regional availability remain unverified in this first import.",
    notesAr: "يسجل كتالوج الغرب الرسمي هذا الإصدار من M4A1-S. تبقى الإحصاءات وطريقة الحصول والتوفر الإقليمي غير مؤكدة في هذا الاستيراد الأول.",
  },
];

export const REGIONAL_EVENT_RECORDS = [
  {
    slug: "cfbl-2026-season-1",
    titleEn: "CrossFire Brazil League 2026 Season 1",
    titleAr: "الدوري البرازيلي لـ CrossFire — الموسم الأول 2026",
    kind: "Esports league",
    region: "brazil",
    startDate: "2026-03-20",
    endDate: "2026-05-10",
    status: "archived",
    sourceUrl: "https://www.crossfirestars.com/en/league?kind=03&detail=044",
    sourceLabel: "CrossFire Stars official league page",
    checkedAt: "2026-08-17",
    summaryEn: "The official CFBL Season 1 page records the 2026 Brazil league schedule from 20 March to 10 May, including its playoff and final stages.",
    summaryAr: "تسجل صفحة CFBL الرسمية جدول الموسم الأول للدوري البرازيلي في 2026 من 20 مارس إلى 10 مايو، بما في ذلك مراحل البلاي أوف والنهائي.",
  },
  {
    slug: "crossfire-legends-version-4",
    titleEn: "Crossfire: Legends Version 4.0 announcement",
    titleAr: "إعلان الإصدار 4.0 من Crossfire: Legends",
    kind: "Version announcement",
    region: "vietnam",
    startDate: "2026-06-30",
    status: "published",
    sourceUrl: "https://www.playcfl.com/",
    sourceLabel: "Crossfire: Legends official portal",
    checkedAt: "2026-08-17",
    summaryEn: "The official Crossfire: Legends portal advertises Version 4.0 for 30 June 2026 at 09:30 UTC+8 and highlights a tactical S&D: Economy experience. The wiki records the announcement and does not claim that every regional client received the same build.",
    summaryAr: "يعلن بوابة Crossfire: Legends الرسمية عن الإصدار 4.0 في 30 يونيو 2026 الساعة 09:30 بتوقيت UTC+8، مع تجربة تكتيكية لنمط S&D: Economy. يسجل الويكي الإعلان دون افتراض وصول الإصدار نفسه إلى كل المناطق.",
  },
];

export const REGIONAL_MODE_RECORDS = [
  {
    slug: "china-team-deathmatch",
    nameEn: "Team Deathmatch",
    nameAr: "مباراة الفرق",
    edition: "china-pc",
    sourceUrl: "https://cf.qq.com/main.shtml",
    sourceLabel: "Tencent CrossFire official game-information index",
    checkedAt: "2026-08-17",
  },
  {
    slug: "china-bomb-mode",
    nameEn: "Bomb mode",
    nameAr: "نمط القنابل",
    edition: "china-pc",
    sourceUrl: "https://cf.qq.com/main.shtml",
    sourceLabel: "Tencent CrossFire official game-information index",
    checkedAt: "2026-08-17",
  },
  {
    slug: "vietnam-legends-bomb",
    nameEn: "Bomb",
    nameAr: "وضع زرع القنبلة",
    edition: "vietnam-legends-mobile",
    sourceUrl: "https://cfl.vnggames.com/",
    sourceLabel: "VNG Games official Crossfire: Legends portal",
    checkedAt: "2026-08-17",
  },
  {
    slug: "vietnam-legends-team-deathmatch",
    nameEn: "Team Deathmatch",
    nameAr: "مباراة الفرق",
    edition: "vietnam-legends-mobile",
    sourceUrl: "https://cfl.vnggames.com/",
    sourceLabel: "VNG Games official Crossfire: Legends portal",
    checkedAt: "2026-08-17",
  },
  {
    slug: "vietnam-legends-survival",
    nameEn: "Survival",
    nameAr: "البقاء",
    edition: "vietnam-legends-mobile",
    sourceUrl: "https://cfl.vnggames.com/",
    sourceLabel: "VNG Games official Crossfire: Legends portal",
    checkedAt: "2026-08-17",
  },
  {
    slug: "vietnam-legends-zombie",
    nameEn: "Zombie Mode",
    nameAr: "نمط الزومبي",
    edition: "vietnam-legends-mobile",
    sourceUrl: "https://cfl.vnggames.com/",
    sourceLabel: "VNG Games official Crossfire: Legends portal",
    checkedAt: "2026-08-17",
  },
];

export const REGIONAL_MAP_RECORDS = [
  { slug: "china-new-black-town", nameEn: "New Black Town", nameAr: "مدينة بلاك تاون الجديدة", edition: "china-pc", sourceUrl: "https://cf.qq.com/main.shtml", checkedAt: "2026-08-17" },
  { slug: "china-satellite-base", nameEn: "Satellite Base", nameAr: "قاعدة الأقمار الصناعية", edition: "china-pc", sourceUrl: "https://cf.qq.com/main.shtml", checkedAt: "2026-08-17" },
  { slug: "china-port", nameEn: "Port", nameAr: "الميناء", edition: "china-pc", sourceUrl: "https://cf.qq.com/main.shtml", checkedAt: "2026-08-17" },
  { slug: "china-eagle-eye", nameEn: "Eagle Eye", nameAr: "عين النسر", edition: "china-pc", sourceUrl: "https://cf.qq.com/main.shtml", checkedAt: "2026-08-17" },
  { slug: "vietnam-cargo-ship", nameEn: "Cargo Ship", nameAr: "سفينة الشحن", edition: "vietnam-legends-mobile", sourceUrl: "https://cfl.vnggames.com/", checkedAt: "2026-08-17" },
  { slug: "vietnam-alley-tdm", nameEn: "Alley TDM", nameAr: "ممر مباراة الفرق", edition: "vietnam-legends-mobile", sourceUrl: "https://cfl.vnggames.com/", checkedAt: "2026-08-17" },
  { slug: "vietnam-deadly-intersection", nameEn: "Deadly Intersection", nameAr: "التقاطع الخطير", edition: "vietnam-legends-mobile", sourceUrl: "https://cfl.vnggames.com/", checkedAt: "2026-08-17" },
  { slug: "vietnam-desert-storm", nameEn: "Desert Storm", nameAr: "عاصفة الصحراء", edition: "vietnam-legends-mobile", sourceUrl: "https://cfl.vnggames.com/", checkedAt: "2026-08-17" },
  { slug: "vietnam-radio-station", nameEn: "Radio Station", nameAr: "محطة الراديو", edition: "vietnam-legends-mobile", sourceUrl: "https://cfl.vnggames.com/", checkedAt: "2026-08-17" },
  { slug: "vietnam-power-plant", nameEn: "Power Plant", nameAr: "محطة الطاقة", edition: "vietnam-legends-mobile", sourceUrl: "https://cfl.vnggames.com/", checkedAt: "2026-08-17" },
];

export const REGIONAL_POSTS = [
  {
    slug: "china-pc-source-brief",
    titleEn: "China PC edition: what the official portal documents",
    titleAr: "نسخة الصين للحاسوب: ماذا يوثق المصدر الرسمي؟",
    region: "china",
    category: "Regional research",
    date: "2026-08-17",
    sourceUrls: ["https://cf.qq.com/main.shtml"],
    excerptEn: "A source-backed overview of the Tencent portal’s separate weapon, map, mode, activity, and guide sections, with clear boundaries around what can be generalized to other regions.",
    excerptAr: "نظرة موثقة إلى أقسام Tencent المنفصلة للأسلحة والخرائط والأنماط والفعاليات والأدلة، مع تحديد واضح لما يمكن تعميمه على المناطق الأخرى.",
  },
  {
    slug: "west-catalogue-first-page",
    titleEn: "West weapons catalogue: the first official records",
    titleAr: "كتالوج أسلحة الغرب: أول السجلات الرسمية",
    region: "west",
    category: "Weapon research",
    date: "2026-08-17",
    sourceUrls: ["https://crossfire.z8games.com/weapons.html"],
    excerptEn: "The first import from the Z8Games catalogue records official names and images without inventing damage values, release dates, or cross-region availability.",
    excerptAr: "يسجل الاستيراد الأول من كتالوج Z8Games الأسماء والصور الرسمية دون اختراع أرقام ضرر أو تواريخ إصدار أو توفر خارج المنطقة.",
  },
  {
    slug: "vietnam-legends-edition-boundary",
    titleEn: "Vietnam mobile edition: why it stays separate from PC data",
    titleAr: "النسخة المحمولة في فيتنام: لماذا تبقى منفصلة عن بيانات الحاسوب؟",
    region: "vietnam",
    category: "Regional review",
    date: "2026-08-17",
    sourceUrls: ["https://cfl.vnggames.com/"],
    excerptEn: "The VNG portal confirms a mobile edition with its own modes, characters, and map roster. This brief explains how the wiki avoids mixing mobile records with PC editions.",
    excerptAr: "تؤكد بوابة VNG وجود نسخة محمولة لها أنماط وشخصيات وقائمة خرائط مستقلة. يشرح هذا الملخص كيف يتجنب الويكي خلط بيانات الهاتف بإصدارات الحاسوب.",
  },
];

export const REGIONAL_REVIEWS = [
  {
    slug: "china-vs-west-vs-legends",
    titleEn: "Regional edition review: China PC, West PC, and Vietnam mobile",
    titleAr: "مراجعة الإصدارات: الصين للحاسوب والغرب للحاسوب وفيتنام للهاتف",
    category: "Regional review",
    date: "2026-08-17",
    verdictEn: "The editions share the CrossFire identity but should be researched as separate products. China provides the broadest official PC content index, West provides the clearest public searchable weapons catalogue, and Vietnam Legends provides the clearest accessible mobile roster and mode list in the first pass.",
    verdictAr: "تشترك الإصدارات في هوية CrossFire، لكن يجب بحثها كمنتجات منفصلة. تقدم الصين أكبر فهرس رسمي لمحتوى الحاسوب، بينما يقدم الغرب أوضح كتالوج أسلحة عام قابل للبحث، وتوفر Legends في فيتنام أوضح قائمة محمولة متاحة للشخصيات والأنماط في الجولة الأولى.",
    sourceUrls: ["https://cf.qq.com/main.shtml", "https://crossfire.z8games.com/weapons.html", "https://cfl.vnggames.com/"],
  },
];

export function getRegionalEdition(slug) {
  return REGIONAL_EDITION_RECORDS.find((item) => item.slug === slug) || null;
}

export function getRegionalWeaponRecords() {
  return REGIONAL_WEAPON_RECORDS;
}

export function getRegionalEventRecords() {
  return REGIONAL_EVENT_RECORDS;
}

export function getRegionalPosts() {
  return REGIONAL_POSTS;
}

export function getRegionalModeRecords() {
  return REGIONAL_MODE_RECORDS;
}

export function getRegionalMapRecords() {
  return REGIONAL_MAP_RECORDS;
}

export function getRegionalReviews() {
  return REGIONAL_REVIEWS;
}
