export const REGIONS = [
  {
    slug: "west",
    name: "CrossFire West",
    shortName: "CF West",
    base: "z8games.com",
    focus: "Official West builds, shop, and seasonal events",
    status: "active",
    seoTitle: "CrossFire West | Global Wiki",
    seoDescription: "Explore CrossFire West weapons, events, and regional coverage in the global wiki.",
  },
  {
    slug: "china",
    name: "CrossFire China",
    shortName: "CF China",
    base: "cf.qq.com",
    focus: "Largest content volume and patch note coverage",
    status: "active",
    seoTitle: "CrossFire China | Global Wiki",
    seoDescription: "Browse the broadest Chinese CrossFire content archive and patch-note coverage.",
  },
  {
    slug: "vietnam",
    name: "CrossFire Vietnam",
    shortName: "CF Vietnam",
    base: "cf.vtcgame.vn",
    focus: "Community and regional event tracking",
    status: "active",
    seoTitle: "CrossFire Vietnam | Global Wiki",
    seoDescription: "Track Vietnam-focused CrossFire content, events, and locally discussed weapons.",
  },
  {
    slug: "brazil",
    name: "CrossFire Brazil",
    shortName: "CF Brazil",
    base: "crossfire.lat",
    focus: "Regional availability and localized content",
    status: "active",
    seoTitle: "CrossFire Brazil | Global Wiki",
    seoDescription: "Discover Brazil-specific CrossFire availability notes and community coverage.",
  },
  {
    slug: "philippines",
    name: "CrossFire Philippines",
    shortName: "CF PH",
    base: "crossfire.ph",
    focus: "Localized events and community content",
    status: "active",
    seoTitle: "CrossFire Philippines | Global Wiki",
    seoDescription: "Follow the Philippines CrossFire community, updates, and regional weapon notes.",
  },
  {
    slug: "korea",
    name: "CrossFire Korea",
    shortName: "CF Korea",
    base: "crossfire.co.kr",
    focus: "Korean client trends and localized updates",
    status: "active",
    seoTitle: "CrossFire Korea | Global Wiki",
    seoDescription: "Explore Korean CrossFire content, regional updates, and live community notes.",
  },
  {
    slug: "russia",
    name: "CrossFire Russia",
    shortName: "CF Russia",
    base: "crossfire.rus",
    focus: "Russia-specific community and regional tracking",
    status: "active",
    seoTitle: "CrossFire Russia | Global Wiki",
    seoDescription: "Track Russia-focused CrossFire updates, weapon availability, and community records.",
  },
];

export const REGION_ALIASES = {
  cfhd: "china",
};

export const WEAPONS = [
  {
    slug: "ak47-beast",
    name: "AK47 Beast",
    category: "Assault Rifle",
    releaseEra: "Classic / modern coverage",
    description: "A high-impact assault rifle featured across several CrossFire builds and recurring regional event lists.",
    regions: {
      west: { available: true, damage: 35, notes: "Available in official West events" },
      china: { available: true, damage: 37, notes: "Popular in Chinese patch notes" },
      cfhd: { available: true, damage: 36, notes: "Present in modern CFHD content" },
      vietnam: { available: false, damage: null, notes: "No verified Vietnamese record yet" },
      brazil: { available: true, damage: 34, notes: "Listed in regional catalogs" },
      philippines: { available: true, damage: 33, notes: "Seen in regional community catalogs" },
    },
  },
  {
    slug: "m4a1-ranger",
    name: "M4A1 Ranger",
    category: "Assault Rifle",
    releaseEra: "Core weapon",
    description: "A standard-issue carbine known for strong accuracy and broad usage across the global wiki.",
    regions: {
      west: { available: true, damage: 31, notes: "Available in West loadouts" },
      china: { available: true, damage: 32, notes: "Supported in China content" },
      cfhd: { available: true, damage: 31, notes: "Consistent across CFHD patches" },
      vietnam: { available: true, damage: 30, notes: "Seen in Vietnamese community notes" },
      brazil: { available: true, damage: 30, notes: "Common in Brazil regional data" },
      philippines: { available: true, damage: 31, notes: "Broadly available in PH coverage" },
    },
  },
  {
    slug: "mp5-scout",
    name: "MP5 Scout",
    category: "SMG",
    releaseEra: "Classic / modern coverage",
    description: "A lightweight submachine gun valued for speed and control in close fights.",
    regions: {
      west: { available: true, damage: 24, notes: "Available in West region metadata" },
      china: { available: true, damage: 25, notes: "Frequently documented in China builds" },
      cfhd: { available: true, damage: 24, notes: "Retained in modern CFHD lists" },
      vietnam: { available: true, damage: 23, notes: "Present in community lists" },
      brazil: { available: false, damage: null, notes: "No public Brazil record" },
      philippines: { available: true, damage: 24, notes: "Listed in local inventories" },
    },
  },
  {
    slug: "awp-ghost",
    name: "AWP Ghost",
    category: "Sniper Rifle",
    releaseEra: "Featured in recent archival content",
    description: "A long-range precision weapon used for high-stakes engagements and elite loadouts.",
    regions: {
      west: { available: true, damage: 42, notes: "Official West guides reference it" },
      china: { available: true, damage: 44, notes: "High-value China weapon data" },
      cfhd: { available: true, damage: 43, notes: "Featured in CFHD patch summaries" },
      vietnam: { available: true, damage: 41, notes: "Community pages mention it" },
      brazil: { available: true, damage: 41, notes: "Regional catalog lists it" },
      philippines: { available: true, damage: 42, notes: "Supported in PH event lists" },
    },
  },
  {
    slug: "ak12-commando",
    name: "AK12 Commando",
    category: "Assault Rifle",
    releaseEra: "Newer-era variant",
    description: "A modernized AK-family weapon with stronger handling and more tactical utility in newer-era content.",
    regions: {
      west: { available: true, damage: 38, notes: "Seen in West event build notes" },
      china: { available: true, damage: 39, notes: "Heavily documented in China update pages" },
      cfhd: { available: true, damage: 38, notes: "Included in CFHD modernization lists" },
      vietnam: { available: true, damage: 36, notes: "Mentioned in Vietnamese community posts" },
      brazil: { available: true, damage: 37, notes: "Appears in Brazil item listings" },
      philippines: { available: true, damage: 37, notes: "Listed in PH local loadout trackers" },
    },
  },
  {
    slug: "scar-l-nova",
    name: "SCAR-L Nova",
    category: "Assault Rifle",
    releaseEra: "Recent additions",
    description: "A versatile tactical rifle used in modern loadouts that prioritize stability and quick follow-up shots.",
    regions: {
      west: { available: true, damage: 33, notes: "Covered in West tactical guides" },
      china: { available: true, damage: 34, notes: "Documented in China patch references" },
      cfhd: { available: true, damage: 33, notes: "Present in CFHD event rotations" },
      vietnam: { available: false, damage: null, notes: "No verified public record yet" },
      brazil: { available: true, damage: 32, notes: "Cataloged in Brazil community trackers" },
      philippines: { available: true, damage: 33, notes: "Used in PH community experiments" },
    },
  },
  {
    slug: "p90-phantom",
    name: "P90 Phantom",
    category: "SMG",
    releaseEra: "Modern-era variant",
    description: "A compact submachine gun that excels in aggressive close-range play and burst-control scenarios.",
    regions: {
      west: { available: true, damage: 27, notes: "Tracked in West community notes" },
      china: { available: true, damage: 28, notes: "Seen in China weapon roundups" },
      cfhd: { available: true, damage: 27, notes: "Retained in CFHD specialist lists" },
      vietnam: { available: true, damage: 26, notes: "Discussed in Vietnam forum posts" },
      brazil: { available: true, damage: 26, notes: "Listed in Brazil local guides" },
      philippines: { available: true, damage: 27, notes: "Included in PH loadout updates" },
    },
  },
  {
    slug: "famas-elite",
    name: "FAMAS Elite",
    category: "Assault Rifle",
    releaseEra: "Recent additions",
    description: "A high-rate burst weapon that has become a recurring reference point in modern CrossFire discussions.",
    regions: {
      west: { available: true, damage: 30, notes: "Appears in West loadout discussions" },
      china: { available: true, damage: 31, notes: "Popular in China event summaries" },
      cfhd: { available: true, damage: 30, notes: "Featured in CFHD upgrade content" },
      vietnam: { available: true, damage: 29, notes: "Covered in Vietnamese community maps" },
      brazil: { available: false, damage: null, notes: "No public Brazilian record yet" },
      philippines: { available: true, damage: 30, notes: "Referenced in PH community posts" },
    },
  },
  {
    slug: "m249-hades",
    name: "M249 Hades",
    category: "Light Machine Gun",
    releaseEra: "Heavy weapon additions",
    description: "A heavy-support machine gun that adds sustained suppression and squad support coverage.",
    regions: {
      west: { available: true, damage: 45, notes: "Tracked in West support loadout guides" },
      china: { available: true, damage: 46, notes: "Highlighted in China support pages" },
      cfhd: { available: true, damage: 45, notes: "Noted in CFHD tactical content" },
      vietnam: { available: true, damage: 43, notes: "Mentioned in Vietnam forum summaries" },
      brazil: { available: true, damage: 44, notes: "Listed in Brazil support guides" },
      philippines: { available: true, damage: 44, notes: "Included in PH squad updates" },
    },
  },
  {
    slug: "m82a1-sniper",
    name: "M82A1 Sniper",
    category: "Sniper Rifle",
    releaseEra: "Modern-era variant",
    description: "A high-impact anti-material sniper that is often cited in newer cross-region weapon overviews.",
    regions: {
      west: { available: true, damage: 49, notes: "Observed in West advanced loadout lists" },
      china: { available: true, damage: 50, notes: "Common in China elite weapon pages" },
      cfhd: { available: true, damage: 49, notes: "Covered in CFHD performance breakdowns" },
      vietnam: { available: true, damage: 47, notes: "Mentioned in Vietnamese community content" },
      brazil: { available: true, damage: 48, notes: "Listed in Brazil archive notes" },
      philippines: { available: true, damage: 48, notes: "Used in PH high-skill guides" },
    },
  },
];

export const FORUM_POSTS = [
  {
    slug: "new-region-weapon-tracker",
    title: "New region weapon tracker is live",
    author: "Ari",
    region: "global",
    tags: ["tracker", "global-wiki"],
    excerpt: "A compact overview of all shared weapon data across West, China, CFHD, Vietnam, Brazil, and the Philippines.",
    date: "2026-07-27",
    link: "/global-wiki",
  },
  {
    slug: "west-seasonal-event-notes",
    title: "West seasonal event notes",
    author: "Mina",
    region: "west",
    tags: ["events", "west"],
    excerpt: "An updated roundup of seasonal event drops and the weapons that appear most often in official West coverage.",
    date: "2026-07-24",
    link: "/west",
  },
  {
    slug: "china-patch-roundup",
    title: "China patch roundup and weapon highlights",
    author: "Kaito",
    region: "china",
    tags: ["patches", "china"],
    excerpt: "The latest community-friendly recap of weapon changes and rising favorites from China pages.",
    date: "2026-07-22",
    link: "/china",
  },
  {
    slug: "cfhd-modern-loadouts",
    title: "CFHD modern loadouts and event rotation",
    author: "Tess",
    region: "cfhd",
    tags: ["cfhd", "loadouts"],
    excerpt: "The current CFHD event rotation is covered with a quick overview of the most active weapons and maps.",
    date: "2026-07-20",
    link: "/cfhd",
  },
  {
    slug: "vietnam-community-archive",
    title: "Vietnam community archive update",
    author: "Linh",
    region: "vietnam",
    tags: ["community", "vietnam"],
    excerpt: "A fresh set of community notes capturing the most discussed weapons and event changes from Vietnam.",
    date: "2026-07-19",
    link: "/vietnam",
  },
  {
    slug: "brazil-locals-guide",
    title: "Brazil local guide for new weapon arrivals",
    author: "Rafael",
    region: "brazil",
    tags: ["brazil", "guides"],
    excerpt: "A quick explanation of where new weapon profiles are most visible in Brazil-based community coverage.",
    date: "2026-07-18",
    link: "/brazil",
  },
  {
    slug: "philippines-community-preview",
    title: "Philippines community preview for this week",
    author: "Jessa",
    region: "philippines",
    tags: ["philippines", "preview"],
    excerpt: "A preview of the local community themes and the weapons that saw the most attention this week.",
    date: "2026-07-17",
    link: "/philippines",
  },
  {
    slug: "global-weapon-comparison",
    title: "Global weapon comparison thread",
    author: "Noah",
    region: "global",
    tags: ["comparison", "global"],
    excerpt: "A thread that compares the new weapons across regions and highlights the most consistent performers.",
    date: "2026-07-15",
    link: "/compare/ak47-beast",
  },
  {
    slug: "drop-calendar-keep-up",
    title: "Drop calendar and community notes",
    author: "Sora",
    region: "global",
    tags: ["calendar", "events"],
    excerpt: "A lightweight community calendar to follow the newest weapon entries and special event drops.",
    date: "2026-07-13",
    link: "/events",
  },
  {
    slug: "featured-loadouts-for-players",
    title: "Featured loadouts for players who want more depth",
    author: "Drew",
    region: "global",
    tags: ["loadouts", "players"],
    excerpt: "A practical guide to build a stronger page experience around the newest weapons and their regional availability.",
    date: "2026-07-10",
    link: "/weapons",
  },
];

export function normalizeRegionSlug(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return "";
  return REGION_ALIASES[normalized] || normalized;
}

export function getRegionBySlug(slug) {
  const normalized = normalizeRegionSlug(slug);
  return REGIONS.find((region) => region.slug === normalized) || null;
}

export function getWeaponBySlug(slug) {
  return WEAPONS.find((weapon) => weapon.slug === slug) || null;
}

export function getForumPosts() {
  return FORUM_POSTS;
}

export function getRegionBreadcrumbs(regionSlug) {
  const region = getRegionBySlug(regionSlug);
  return [
    { name: "Home", url: "/" },
    { name: "Global wiki", url: "/global-wiki" },
    ...(region ? [{ name: region.name, url: `/${region.slug}` }] : []),
  ];
}

export function getWeaponBreadcrumbs(regionSlug, weaponSlug) {
  const region = getRegionBySlug(regionSlug);
  const weapon = getWeaponBySlug(weaponSlug);
  return [
    { name: "Home", url: "/" },
    { name: "Global wiki", url: "/global-wiki" },
    ...(region ? [{ name: region.name, url: `/${region.slug}` }] : []),
    ...(weapon ? [{ name: weapon.name, url: `/${region?.slug || "global-wiki"}/weapons/${weapon.slug}` }] : []),
  ];
}

export function getRegionLanding(regionSlug) {
  const region = getRegionBySlug(regionSlug);
  if (!region) return null;

  return {
    region,
    featuredWeapons: WEAPONS.slice(0, 4),
    summary: `${region.name} is now part of the global CrossFire wiki expansion plan, linking region-specific content to a single global archive.`,
  };
}

export function buildComparisonRows(slug) {
  const weapon = getWeaponBySlug(slug);
  if (!weapon) {
    return [];
  }

  return REGIONS.map((region) => {
    const data = weapon.regions?.[region.slug];
    return {
      region: region.slug,
      name: region.name,
      available: data?.available ?? false,
      damage: data?.damage ?? "-",
      notes: data?.notes ?? "No verified data",
    };
  });
}
