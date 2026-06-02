import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PageSEO from "@/components/PageSEO";
import { EventsRibbon } from "@/components/EventsRibbon";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { getPosts, getEvents, getWeapons, getNews } from "@/lib/supabaseApi";
import { HomepageHero } from "@/components/HomepageHero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { LatestWeapons } from "@/components/LatestWeapons";
import { CategoriesGrid } from "@/components/CategoriesGrid";

const HERO_BG = "/cf-heroes-bg.png";
const GOLD_BORDER = "rgba(154,124,63,0.25)";

function Divider() {
  return <div style={{ width: "100%", height: "1px", background: GOLD_BORDER }} />;
}

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export default function Home() {
  const { t } = useLanguage();

  const { data: eventsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", { limit: 10 }],
    queryFn: () => getEvents({ limit: 10 }),
  });
  const allEvents = eventsData?.items || [];

  const displayEvents = useMemo(() =>
    allEvents
      .filter((e: any) => !e.rawHtmlContent)
      .filter((e: any) => String(e.title || "").trim())
      .slice(0, 7),
    [allEvents]
  );

  const { data: recentWeaponsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/weapons/search", "home-recent"],
    queryFn: () => getWeapons({ page: 1, pageSize: 4 }),
  });
  const recentWeapons = recentWeaponsData?.items || [];

  const { data: latestNewsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/news", { limit: 6, home: true }],
    queryFn: () => getNews({ limit: 6, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });
  const latestNews = latestNewsData?.items || [];

  const scrapedEvents = allEvents.filter((e: any) => e.rawHtmlContent);
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(0, 10);

  const [featuredEvent, ...restEvents] = displayEvents;
  const secondaryEvents = restEvents.slice(0, 2);

  const featuredForSection = featuredEvent
    ? { ...featuredEvent, tag: featuredEvent.type === "upcoming" ? "Upcoming" : "Featured", description: featuredEvent.description || featuredEvent.content || "" }
    : null;

  const secondaryForSection = secondaryEvents.map((e: any) => ({
    ...e,
    tag: e.type === "upcoming" ? "Upcoming" : "Event",
  }));

  return (
    <>
      <PageSEO
        title="CrossFire Wiki — Guides, Weapons, Modes & Community"
        description="CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources."
      />

      <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }}>

        {/* HERO */}
        <HomepageHero heroImage={HERO_BG} />

        {/* EVENTS RIBBON */}
        <div
          className="sticky top-0 z-20"
          style={{
            borderTop: `1px solid ${GOLD_BORDER}`,
            borderBottom: `1px solid ${GOLD_BORDER}`,
            background: "hsl(var(--background) / 0.97)",
            backdropFilter: "blur(8px)",
          }}
        >
          <EventsRibbon events={ribbonEvents} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

          {/* Scraped/Forum Announcements */}
          {scrapedEvents.map((event: any) => (
            <div
              key={event.id}
              className="mt-10 relative overflow-hidden"
              style={{ background: "hsl(var(--card))", border: `1px solid ${GOLD_BORDER}` }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(to right, #9a7c3f, transparent)" }} />
              <div style={{ padding: "10px 20px", borderBottom: `1px solid ${GOLD_BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.2em", color: "#9a7c3f" }}>Forum Announcement</span>
                <span style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>{event.date}</span>
              </div>
              <div style={{ padding: "24px 32px" }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, letterSpacing: "0.12em", fontSize: "1.5rem", color: "hsl(var(--foreground))", marginBottom: "16px" }}>
                  {event.title}
                </h2>
                <RawHtmlPreview html={event.rawHtmlContent} className="min-h-[150px]" />
              </div>
            </div>
          ))}

          {/* FEATURED EVENTS */}
          <FeaturedSection
            featured={featuredForSection}
            secondary={secondaryForSection}
            sectionLabel="Latest"
            sectionTitle="Events & News"
            allLink="/category/events"
          />

          <Divider />

          {/* LATEST NEWS */}
          {latestNews.length > 0 && (
            <section style={{ padding: "48px 0" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "28px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, fontSize: "clamp(1.3rem, 3vw, 1.9rem)", letterSpacing: "0.15em", color: "hsl(var(--foreground))", margin: 0 }}>
                  LATEST NEWS
                </h2>
                <a href="/news" style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.9rem", color: "#9a7c3f", textDecoration: "none" }}>
                  All news →
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="news-grid">
                {latestNews.slice(0, 6).map((item: any) => {
                  const href = item.news_slug ? `/news/${item.news_slug}` : `/news/${item.id}`;
                  const excerpt = stripHtml(String(item.summary || item.content || "")).trim().slice(0, 90);
                  return (
                    <a key={item.id} href={href} style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          background: "hsl(var(--card))",
                          border: `1px solid ${GOLD_BORDER}`,
                          height: "100%",
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,124,63,0.55)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = GOLD_BORDER)}
                      >
                        {item.image && (
                          <div style={{ height: "120px", overflow: "hidden" }}>
                            <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} loading="lazy" />
                          </div>
                        )}
                        <div style={{ padding: "14px" }}>
                          {item.category && (
                            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.18em", color: "#9a7c3f", display: "block", marginBottom: "6px" }}>
                              {item.category}
                            </span>
                          )}
                          <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, fontSize: "0.85rem", letterSpacing: "0.08em", color: "hsl(var(--foreground))", margin: "0 0 6px", lineHeight: 1.35 }}>
                            {item.title}
                          </h3>
                          {excerpt && (
                            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.5, opacity: 0.7 }}>
                              {excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
              <style>{`@media(max-width:768px){.news-grid{grid-template-columns:1fr!important;}}`}</style>
            </section>
          )}

          <Divider />

          {/* LATEST WEAPONS */}
          <LatestWeapons weapons={recentWeapons} />

          <Divider />

          {/* CATEGORIES */}
          <CategoriesGrid />

        </div>
      </div>
    </>
  );
}
