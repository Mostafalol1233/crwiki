export interface LatestWestWeaponRelease {
  id: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  categoryEn: string;
  categoryAr: string;
  releaseDate: string;
  imageUrl: string;
  sourceUrl: string;
  sourceLabelEn: string;
  sourceLabelAr: string;
  isLatest?: boolean;
}

const ROADMAP_URL = "https://crossfire.z8games.com/patches/2026";

/**
 * Publisher-confirmed CrossFire West weapon-release cards from the current
 * Z8Games 2026 roadmap. The roadmap confirms names, dates, and artwork; it
 * does not publish numerical weapon stats for these cards, so none are
 * inferred here.
 */
export const LATEST_CROSSFIRE_WEST_WEAPONS: LatestWestWeaponRelease[] = [
  {
    id: "west-2026-08-12-alt4-weapons",
    titleEn: "ALT+F4 Weapons",
    titleAr: "أسلحة ALT+F4",
    summaryEn: "A new weapon-release card added to the CrossFire West August roadmap. The publisher confirms the release label and date; individual weapon names, stats, and acquisition rules are not listed on the roadmap card.",
    summaryAr: "بطاقة إصدار أسلحة جديدة أضيفت إلى خارطة طريق CrossFire West لشهر أغسطس. يؤكد الناشر اسم الإصدار وتاريخه، بينما لا تعرض البطاقة أسماء الأسلحة الفردية أو الإحصاءات أو طريقة الحصول عليها.",
    categoryEn: "Newest release",
    categoryAr: "أحدث إصدار",
    releaseDate: "2026-08-12",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260806_cfwe_rubycrates_roadmapthumb_weapons.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
    isLatest: true,
  },
  {
    id: "west-2026-08-06-qbz03-demon",
    titleEn: "QBZ-03-Demon",
    titleAr: "QBZ-03-Demon",
    summaryEn: "A named QBZ-03 weapon release listed by Z8Games for CrossFire West on August 6, 2026. This entry records the publisher-confirmed release and keeps unlisted performance values out of the wiki.",
    summaryAr: "إصدار سلاح باسم QBZ-03 أدرجته Z8Games لنسخة CrossFire West في 6 أغسطس 2026. يسجل هذا الإدخال الإصدار المؤكد من الناشر من دون إضافة قيم أداء غير منشورة.",
    categoryEn: "Assault rifle release",
    categoryAr: "إصدار بندقية هجومية",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260716_cfwe_sapphire_vip_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
  {
    id: "west-2026-08-06-equinox-lily",
    titleEn: "Equinox Lily Weapons",
    titleAr: "أسلحة Equinox Lily",
    summaryEn: "A themed weapon group included in the August 6 CrossFire West roadmap update. The official card confirms the group name, date, and artwork; detailed item-level specifications require a separate catalogue or patch record.",
    summaryAr: "مجموعة أسلحة ذات طابع موحد ظهرت في تحديث خارطة طريق CrossFire West بتاريخ 6 أغسطس. تؤكد البطاقة الرسمية الاسم والتاريخ والصورة، بينما تحتاج مواصفات العناصر التفصيلية إلى سجل مستقل.",
    categoryEn: "Themed weapon group",
    categoryAr: "مجموعة أسلحة ذات طابع موحد",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260716_cfwe_sapphire_RSL_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
  {
    id: "west-2026-08-06-vietnam-heritage",
    titleEn: "Vietnam Heritage Weapons",
    titleAr: "أسلحة تراث فيتنام",
    summaryEn: "A heritage-themed weapon group recorded in the official West roadmap for August 6, 2026. The wiki preserves the publisher's naming and artwork without treating the roadmap card as a complete item-stat sheet.",
    summaryAr: "مجموعة أسلحة مستوحاة من التراث سجلتها خارطة طريق نسخة الغرب الرسمية في 6 أغسطس 2026. يحتفظ الويكي باسم الناشر وصورته من دون اعتبار البطاقة جدولاً كاملاً للإحصاءات.",
    categoryEn: "Themed weapon group",
    categoryAr: "مجموعة أسلحة ذات طابع موحد",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260716_cfwe_sapphire_LDH_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
  {
    id: "west-2026-08-06-ship-weapons",
    titleEn: "Ship Weapons",
    titleAr: "أسلحة السفينة",
    summaryEn: "A weapon release group shown on the August 6 CrossFire West roadmap. The entry is intentionally presented as a release group because the official card does not enumerate every included weapon.",
    summaryAr: "مجموعة إصدار أسلحة ظهرت في خارطة طريق CrossFire West بتاريخ 6 أغسطس. يعرضها الويكي كمجموعة إصدار لأن البطاقة الرسمية لا تسرد كل الأسلحة المشمولة.",
    categoryEn: "Release group",
    categoryAr: "مجموعة إصدار",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260728_cfwe_transportship_weapons_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
  {
    id: "west-2026-08-06-bcaxe-stormchaser",
    titleEn: "B.C.Axe-Stormchaser Beast",
    titleAr: "B.C.Axe-Stormchaser Beast",
    summaryEn: "A named melee-weapon release listed by Z8Games for August 6, 2026. The wiki records it as a West release and does not invent damage, reach, or special-effect values absent from the roadmap card.",
    summaryAr: "إصدار سلاح قتال قريب باسم محدد أدرجته Z8Games في 6 أغسطس 2026. يسجله الويكي كإصدار لنسخة الغرب من دون اختلاق قيم الضرر أو المدى أو التأثيرات الخاصة غير الموجودة في البطاقة.",
    categoryEn: "Melee release",
    categoryAr: "إصدار سلاح قتال قريب",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260721_cfwe_bp_aug_main_axe_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
  {
    id: "west-2026-08-06-at15-topographer",
    titleEn: "AT15-Topographer",
    titleAr: "AT15-Topographer",
    summaryEn: "A named AT15 weapon release included in the August 6 CrossFire West roadmap. This record keeps the official title and artwork while waiting for a first-party item detail page before adding numerical stats.",
    summaryAr: "إصدار سلاح باسم AT15 أدرجته خارطة طريق CrossFire West في 6 أغسطس. يحتفظ هذا السجل بالاسم والصورة الرسميين إلى حين توفر صفحة تفصيلية من المصدر لإضافة الإحصاءات الرقمية.",
    categoryEn: "Weapon release",
    categoryAr: "إصدار سلاح",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260721_cfwe_bp_aug_main_at15_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
  {
    id: "west-2026-08-06-mg3-ignite",
    titleEn: "MG3-Ignite",
    titleAr: "MG3-Ignite",
    summaryEn: "A named MG3 weapon release shown by Z8Games on the August 6 West roadmap. The page presents the confirmed release identity and date separately from unverified gameplay statistics.",
    summaryAr: "إصدار سلاح باسم MG3 أظهرته Z8Games في خارطة طريق الغرب بتاريخ 6 أغسطس. يعرض الموقع اسم الإصدار وتاريخه المؤكدين بشكل منفصل عن إحصاءات اللعب غير الموثقة.",
    categoryEn: "Machine-gun release",
    categoryAr: "إصدار رشاش",
    releaseDate: "2026-08-06",
    imageUrl: "https://z8games.akamaized.net/cfna/patches/2026/img/260728_cfwe_mg3ignite_roadmapthumb.jpg",
    sourceUrl: ROADMAP_URL,
    sourceLabelEn: "Z8Games 2026 Roadmap",
    sourceLabelAr: "خارطة طريق Z8Games لعام 2026",
  },
];
