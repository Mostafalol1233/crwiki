import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PageSEO from "@/components/PageSEO";
import { EventsRibbon } from "@/components/EventsRibbon";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { getPosts, getEvents, getWeapons, getNews, getSiteSettings } from "@/lib/supabaseApi";
import { HomepageHero } from "@/components/HomepageHero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { LatestWeapons } from "@/components/LatestWeapons";
import { CategoriesGrid } from "@/components/CategoriesGrid";
import { DiscordWidget } from "@/components/DiscordWidget";
import { HighlightsSection } from "@/components/HighlightsSection";
import { GMSection } from "@/components/GMSection";

const DEFAULT_HERO_BG = "/cf-heroes-bg.png";
const GOLD_BORDER = "rgba(154,124,63,0.25)";
const GOLD = "#9a7c3f";

function Divider() {
  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${GOLD_BORDER} 40%, ${GOLD_BORDER} 60%, transparent)` }} />
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, opacity: 0.5 }} />
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${GOLD_BORDER} 40%, ${GOLD_BORDER} 60%, transparent)` }} />
    </div>
  );
}

function SectionBg({ children, pattern = "crosshatch" }: { children: React.ReactNode; pattern?: string }) {
  const patterns: Record<string, string> = {
    crosshatch: `repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(154,124,63,0.04) 28px, rgba(154,124,63,0.04) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(154,124,63,0.04) 28px, rgba(154,124,63,0.04) 29px)`,
    diagonal: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(154,124,63,0.03) 40px, rgba(154,124,63,0.03) 41px)`,
    dots: `radial-gradient(circle, rgba(154,124,63,0.08) 1px, transparent 1px)`,
  };
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: patterns[pattern], backgroundSize: pattern === "dots" ? "24px 24px" : undefined, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export default function Home() {
  const { t } = useLanguage();

  const { data: siteSettingsData } = useQuery({
    queryKey: ["site-settings-home"],
    queryFn: () => getSiteSettings(),
    staleTime: 2 * 60 * 1000,
  });
  const siteSettings = siteSettingsData as any;

  const heroImage = siteSettings?.heroImage || DEFAULT_HERO_BG;
  const adminFeaturedEventId: string = siteSettings?.featuredEventId || "";
  const adminSecondaryEventIds: string[] = Array.isArray(siteSettings?.secondaryEventIds) ? siteSettings.secondaryEventIds : [];
  const adminFeaturedWeaponIds: string[] = Array.isArray(siteSettings?.featuredWeapons) ? siteSettings.featuredWeapons : [];

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
    queryFn: () => getWeapons({ page: 1, pageSize: 20 }),
  });
  const allWeapons = recentWeaponsData?.items || [];

  const { data: latestNewsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/news", { limit: 6, home: true }],
    queryFn: () => getNews({ limit: 6, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });
  const latestNews = latestNewsData?.items || [];

  const scrapedEvents = allEvents.filter((e: any) => e.rawHtmlContent);
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(0, 10);

  // Resolve featured event: admin pick or fallback to first
  const featuredEvent = useMemo(() => {
    if (adminFeaturedEventId) {
      const found = displayEvents.find((e: any) => String(e.id || e._id) === adminFeaturedEventId);
      if (found) return found;
    }
    return displayEvents[0] || null;
  }, [displayEvents, adminFeaturedEventId]);

  // Resolve secondary events: admin picks or fallback to next 2
  const secondaryEvents = useMemo(() => {
    if (adminSecondaryEventIds.length > 0) {
      const picked = adminSecondaryEventIds
        .map((id) => displayEvents.find((e: any) => String(e.id || e._id) === id))
        .filter(Boolean);
      if (picked.length > 0) return picked.slice(0, 2);
    }
    return displayEvents.filter((e: any) => e !== featuredEvent).slice(0, 2);
  }, [displayEvents, featuredEvent, adminSecondaryEventIds]);

  // Resolve featured weapons: admin picks or fallback to latest
  const displayWeapons = useMemo(() => {
    if (adminFeaturedWeaponIds.length > 0) {
      const picked = adminFeaturedWeaponIds
        .map((id) => allWeapons.find((w: any) => String(w.id || w._id) === id))
        .filter(Boolean);
      if (picked.length > 0) return picked.slice(0, 4);
    }
    return allWeapons.slice(0, 4);
  }, [allWeapons, adminFeaturedWeaponIds]);

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
        <HomepageHero heroImage={heroImage} />

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
          <SectionBg pattern="diagonal">
            <FeaturedSection
              featured={featuredForSection}
              secondary={secondaryForSection}
              sectionLabel="Latest"
              sectionTitle="Events & News"
              allLink="/category/events"
            />
          </SectionBg>

          <Divider />

          {/* LATEST NEWS */}
          {latestNews.length > 0 && (
            <SectionBg pattern="crosshatch">
              <section style={{ padding: "48px 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "28px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                  <div>
                    <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.8rem", letterSpacing: "0.15em", color: GOLD, display: "block", marginBottom: 4 }}>
                      stay informed
                    </span>
                    <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, fontSize: "clamp(1.3rem, 3vw, 1.9rem)", letterSpacing: "0.15em", color: "hsl(var(--foreground))", margin: 0 }}>
                      LATEST NEWS
                    </h2>
                  </div>
                  <a href="/news" style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.9rem", color: GOLD, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    All news →
                  </a>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }} className="news-grid">
                  {latestNews.slice(0, 6).map((item: any, idx: number) => {
                    const href = item.news_slug ? `/news/${item.news_slug}` : `/news/${item.id}`;
                    const excerpt = stripHtml(String(item.summary || item.content || "")).trim().slice(0, 100);
                    const isFeatured = idx === 0;
                    return (
                      <a key={item.id} href={href} style={{ textDecoration: "none", gridColumn: isFeatured ? "span 1" : "span 1" }}>
                        <div style={{
                          background: "hsl(var(--card))",
                          border: `1px solid ${GOLD_BORDER}`,
                          height: "100%",
                          transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                          overflow: "hidden",
                        }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(154,124,63,0.6)";
                            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = GOLD_BORDER;
                            (e.currentTarget as HTMLElement).style.transform = "none";
                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                          }}
                        >
                          {item.image && (
                            <div style={{ height: "140px", overflow: "hidden", position: "relative" }}>
                              <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", transition: "transform 0.4s" }} loading="lazy" />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 60%)" }} />
                            </div>
                          )}
                          <div style={{ padding: "16px" }}>
                            {item.category && (
                              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.2em", color: GOLD, display: "block", marginBottom: "6px", textTransform: "uppercase" }}>
                                {item.category}
                              </span>
                            )}
                            <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 400, fontSize: "0.88rem", letterSpacing: "0.06em", color: "hsl(var(--foreground))", margin: "0 0 8px", lineHeight: 1.4 }}>
                              {item.title}
                            </h3>
                            {excerpt && (
                              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.6, opacity: 0.7 }}>
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
            </SectionBg>
          )}

          <Divider />

          {/* LATEST WEAPONS */}
          <SectionBg pattern="dots">
            <LatestWeapons weapons={displayWeapons} />
          </SectionBg>

          <Divider />

          {/* HIGHLIGHTS */}
          <HighlightsSection />

          <Divider />

          {/* GAME MASTERS */}
          <SectionBg pattern="crosshatch">
            <GMSection />
          </SectionBg>

          <Divider />

          {/* CATEGORIES */}
          <CategoriesGrid />

          <Divider />

          {/* DISCORD COMMUNITY */}
          <SectionBg pattern="diagonal">
            <section style={{ padding: "48px 0" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                <div>
                  <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.8rem", letterSpacing: "0.15em", color: GOLD, display: "block", marginBottom: 4 }}>
                    join us
                  </span>
                  <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, fontSize: "clamp(1.3rem, 3vw, 1.9rem)", letterSpacing: "0.15em", color: "hsl(var(--foreground))", margin: 0 }}>
                    COMMUNITY
                  </h2>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start gap-8">
                <DiscordWidget />
                <div className="flex-1">
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", letterSpacing: "0.1em", color: "hsl(var(--foreground))", marginBottom: "14px" }}>
                    Join the CrossFire Wiki Discord
                  </p>
                  <p style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "hsl(var(--muted-foreground))", opacity: 0.75, lineHeight: 1.7, marginBottom: "20px" }}>
                    Connect with hundreds of CrossFire players. Share loadouts, discuss strategies, get event alerts first,
                    and stay ahead of the meta — all in one place.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["Strategy Talk", "Weapon Builds", "Tournament Info", "Event Alerts", "Clan Recruiting"].map((label) => (
                      <div key={label} className="px-3 py-2" style={{ background: "hsl(var(--card))", border: `1px solid ${GOLD_BORDER}`, borderRadius: "4px" }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.12em", color: "hsl(var(--foreground))", opacity: 0.75 }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </SectionBg>

        </div>
      </div>
    </>
  );
}
