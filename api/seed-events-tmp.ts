import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

const EVENTS = [
  {
    title: "CrossFire Brazil League 2026 — Season 2",
    event_name_slug: "cfbl-2026-season-2",
    title_ar: "دوري كروس فاير البرازيلي 2026 — الموسم الثاني",
    description: "The CrossFire Brazil League 2026 Season 2 is the premier professional CrossFire competition in Brazil, running June 12 – August 2, 2026. The top six teams will earn invitations to the CFBL 2027 Season 1 Championship. With a massive $228,000 USD prize pool, this season features the region's best professional squads battling online across group stage and playoff brackets.",
    description_ar: "دوري كروس فاير البرازيلي 2026 الموسم الثاني هو أبرز بطولة كروس فاير احترافية في البرازيل، تمتد من 12 يونيو حتى 2 أغسطس 2026. يُمنح أفضل ستة فرق دعوات لبطولة CFBL الموسم الأول 2027. تتنافس أبرز الفرق البرازيلية الاحترافية بجائزة إجمالية 228,000 دولار.",
    date: "2026-08-02T23:59:00Z",
    location: "Brazil (Online)",
    type: "Championship",
    image_url: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg",
    featured: false,
    seo_title: "CrossFire Brazil League 2026 Season 2 – $228,000 CFBL Tournament",
    seo_description: "Follow the CrossFire Brazil League 2026 Season 2 – the top 6 teams qualify for CFBL 2027. $228,000 prize pool, online, June 12 – August 2.",
    canonical_url: "https://crossfire.wiki/events/cfbl-2026-season-2",
    source_url: "https://liquipedia.net/crossfire/CrossFire_Brazil_League/2026/Season_2",
    sort_order: 10,
  },
  {
    title: "CrossFire West League 2026 — Season 2 Playoffs",
    event_name_slug: "cfwl-2026-season-2-playoffs",
    title_ar: "دوري كروس فاير الغربي 2026 — بلايوف الموسم الثاني",
    description: "The CrossFire West League 2026 Season 2 Playoffs run July 17 – August 2, 2026, featuring the best teams from Europe, MENA, and North America. The Bo5 Double Elimination format ensures every team fights for their chance at the championship. Broadcast live every Friday at 6:00 PM CEST and weekends at 4:00 PM CEST.",
    description_ar: "تنطلق بلايوف دوري كروس فاير الغربي 2026 الموسم الثاني من 17 يوليو حتى 2 أغسطس 2026، بمشاركة أفضل الفرق من أوروبا والشرق الأوسط وشمال أفريقيا وأمريكا الشمالية. تُبث المباريات مباشرةً.",
    date: "2026-08-02T23:59:00Z",
    location: "Europe / MENA / North America (Online)",
    type: "Tournament",
    image_url: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg",
    featured: false,
    seo_title: "CrossFire West League 2026 Season 2 Playoffs – CFWL EU/MENA/NA",
    seo_description: "CFWL 2026 Season 2 Playoffs: July 17–August 2. Europe, MENA, and NA's finest compete in Bo5 double elimination. Watch live.",
    canonical_url: "https://crossfire.wiki/events/cfwl-2026-season-2-playoffs",
    source_url: "https://liquipedia.net/crossfire/CrossFire_West_League/2026/Season_2",
    sort_order: 20,
  },
  {
    title: "CrossFire Vietnam Professional League 2026 — Season 2",
    event_name_slug: "cfvl-2026-season-2",
    title_ar: "الدوري الاحترافي لكروس فاير فيتنام 2026 — الموسم الثاني",
    description: "The CrossFire Vietnam Professional League 2026 Season 2 (CFVL S2) is the top domestic CrossFire competition in Vietnam, organized by Smilegate and VTC Online. Vietnam's elite squads compete through regular season and playoff stages for regional glory and CFS qualification points.",
    description_ar: "الدوري الاحترافي لكروس فاير فيتنام 2026 الموسم الثاني هو أبرز بطولة كروس فاير محلية في فيتنام، تنظمها Smilegate و VTC Online. تتنافس النخبة الفيتنامية للتأهل إلى بطولة CFS.",
    date: "2026-08-31T23:59:00Z",
    location: "Vietnam (Online)",
    type: "Tournament",
    image_url: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg",
    featured: false,
    seo_title: "CrossFire Vietnam Professional League 2026 Season 2 – CFVL S2",
    seo_description: "CFVL 2026 Season 2 – Vietnam's top CrossFire teams compete for regional supremacy and CFS qualification. Organized by Smilegate & VTC Online.",
    canonical_url: "https://crossfire.wiki/events/cfvl-2026-season-2",
    source_url: "https://liquipedia.net/crossfire/CrossFire_Vietnam_Professional_League/2026/Season_2",
    sort_order: 30,
  },
  {
    title: "CFS 2026 Regional Finals — All Regions",
    event_name_slug: "cfs-2026-regional-finals",
    title_ar: "نهائيات CFS 2026 الإقليمية — جميع المناطق",
    description: "The CFS 2026 Regional Finals are the gateway to the CrossFire Stars World Grand Final. Held across five regions — China, Brazil, EUMENA, Vietnam, and Philippines — the top teams from each domestic league earn their spot on the global stage. Based on the established CFS calendar, the regional finals are expected September–October 2026, following the same format as CFS 2025.",
    description_ar: "تُعدّ النهائيات الإقليمية CFS 2026 البوابة إلى النهائي العالمي لبطولة كروس فاير ستارز. تُقام في خمس مناطق: الصين، البرازيل، أوروبا والشرق الأوسط وشمال أفريقيا، فيتنام، والفلبين، ومن المتوقع إجراؤها في سبتمبر-أكتوبر 2026.",
    date: "2026-10-31T23:59:00Z",
    location: "China / Brazil / EUMENA / Vietnam / Philippines",
    type: "Championship",
    image_url: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg",
    featured: true,
    seo_title: "CFS 2026 Regional Finals – CrossFire Stars All Regions Sep–Oct 2026",
    seo_description: "CFS 2026 Regional Finals across China, Brazil, EUMENA, Vietnam and Philippines. Top teams qualify for the CrossFire Stars 2026 World Grand Final.",
    canonical_url: "https://crossfire.wiki/events/cfs-2026-regional-finals",
    source_url: "https://www.crossfirestars.com/en/schedule",
    sort_order: 40,
  },
  {
    title: "CrossFire Stars 2026 — World Grand Final",
    event_name_slug: "cfs-2026-grand-final",
    title_ar: "كروس فاير ستارز 2026 — النهائي العالمي",
    description: "The CrossFire Stars 2026 World Grand Final is the pinnacle of competitive CrossFire, bringing together 16 elite teams from every region after months of qualifying battles. Following the 2025 tradition (held December 3–14 in Chengdu, China), the 2026 Grand Final is expected in November–December 2026, with Smilegate and Hero Esports co-organizing the event. Millions of dollars in prize money and the world title are on the line.",
    description_ar: "يُمثّل النهائي العالمي لبطولة كروس فاير ستارز 2026 قمة المنافسة في كروس فاير، بمشاركة 16 فريقاً نخبوياً من جميع مناطق العالم. بعد نهائي 2025 الذي أُقيم في تشنغدو بالصين، يُتوقع انعقاد نهائي 2026 في نوفمبر–ديسمبر 2026 بجائزة ملايين الدولارات.",
    date: "2026-12-14T23:59:00Z",
    location: "TBA (Expected China)",
    type: "Championship",
    image_url: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg",
    featured: true,
    seo_title: "CrossFire Stars 2026 Grand Final – CFS World Championship Nov/Dec",
    seo_description: "The CFS 2026 World Grand Final gathers 16 top global teams for the CrossFire world title. Expected November–December 2026, prize pool TBA.",
    canonical_url: "https://crossfire.wiki/events/cfs-2026-grand-final",
    source_url: "https://www.crossfirestars.com/en/schedule",
    sort_order: 50,
  },
  {
    title: "CrossFire Ranked Season 2026-2 — New Map Pool",
    event_name_slug: "ranked-season-2026-2",
    title_ar: "موسم الرانك 2026-2 — خريطة جديدة",
    description: "CrossFire Ranked Season 2026-2 is the second competitive ranked ladder of 2026. Following Season 1 (which closed in mid-2026), Season 2 brings a refreshed map pool, updated rank thresholds, and new seasonal rewards for top performers. Expected launch August–September 2026 based on Smilegate's bi-annual ranked schedule.",
    description_ar: "موسم الرانك 2026-2 هو الموسم التنافسي الثاني لعام 2026. يأتي بخريطة محدّثة ومكافآت موسمية جديدة للاعبين المتميزين. يُتوقع إطلاقه في أغسطس-سبتمبر 2026.",
    date: "2026-11-30T23:59:00Z",
    location: "CrossFire NA (Online)",
    type: "Ranked",
    image_url: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg",
    featured: false,
    seo_title: "CrossFire Ranked Season 2026-2 – New Map Pool & Seasonal Rewards",
    seo_description: "CrossFire Ranked Season 2026-2 starts August–September 2026. New map pool, updated rank thresholds, and seasonal rewards await top players on CF NA.",
    canonical_url: "https://crossfire.wiki/events/ranked-season-2026-2",
    source_url: "https://crossfire.z8games.com",
    sort_order: 60,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();

  // Simple key guard
  const auth = req.headers.authorization || "";
  if (auth !== "Bearer seed-events-2026-tmp") {
    return res.status(401).setHeaders(CORS).json({ error: "Unauthorized" });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || "";

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).setHeaders(CORS).json({ error: "Missing Supabase config", url: !!SUPABASE_URL, key: !!SERVICE_KEY });
  }

  const results: any[] = [];
  for (const event of EVENTS) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({ ...event, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });
    const body = await r.text();
    results.push({ slug: event.event_name_slug, status: r.status, body: body.slice(0, 200) });
  }

  return res.status(200).setHeaders(CORS).json({ inserted: results });
}
