import * as React from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { useEffect, useState, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import DataSeeder from "@/components/DataSeeder";

// ── Chunk-load error boundary ─────────────────────────────────────────────────
// After a new deployment, hashed JS chunk filenames change. Old cached HTML pages
// try to load non-existent chunks and crash. This catches those specific errors
// and does a single hard-reload to pick up the fresh index.html.
class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: Error) {
    const msg = err?.message || "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module");
    if (isChunkError) return { hasError: true };
    return null; // let other errors bubble up
  }

  componentDidCatch(err: Error) {
    const msg = err?.message || "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module");
    if (!isChunkError) return;

    const key = "__cf_chunk_reload";
    // Only reload once per session to avoid infinite loop
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#09090b", color: "#fafafa",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 16, fontFamily: "Inter, sans-serif",
        }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Updating to the latest version…</div>
          <div style={{ fontSize: 13, color: "#71717a" }}>The page will reload automatically.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
// Home & Maintenance load synchronously — they are the entry points
import Home from "@/pages/Home";
import Maintenance from "@/pages/Maintenance";
import { SEOHead } from "@/components/SEOHead";
import AnnouncementModal from "@/components/AnnouncementModal";
import TargetCursor from "@/components/TargetCursor";

// ══════════════════════════════════════════════
// 🔧 MAINTENANCE MODE — غير true لـ false لفتح الموقع
const MAINTENANCE_MODE = false;
// ══════════════════════════════════════════════

// ── Lazy page chunks ──────────────────────────────────────────────────────────
// Every page except Home/Maintenance is code-split. They only load when the
// user navigates to that route, keeping the initial bundle small.
const Article        = lazy(() => import("@/pages/Article"));
const About          = lazy(() => import("@/pages/About"));
const Contact        = lazy(() => import("@/pages/Contact"));
const Download       = lazy(() => import("@/pages/Download"));
const News           = lazy(() => import("@/pages/News"));
const NewsDetail     = lazy(() => import("@/pages/NewsDetail"));
const EventDetail    = lazy(() => import("@/pages/EventDetail"));
const GraveGames     = lazy(() => import("@/pages/GraveGames"));
const Category       = lazy(() => import("@/pages/Category"));
const CategoryNews   = lazy(() => import("@/pages/CategoryNews"));
const EventsList     = lazy(() => import("@/pages/EventsList"));
const Profile        = lazy(() => import("@/pages/Profile"));
const Reviews        = lazy(() => import("@/pages/Reviews"));
const Sellers        = lazy(() => import("@/pages/Sellers"));
const Services       = lazy(() => import("@/pages/Services"));
const Support        = lazy(() => import("@/pages/Support"));
const FAQ            = lazy(() => import("@/pages/FAQ"));
const MyTickets      = lazy(() => import("@/pages/MyTickets"));
const Tutorials      = lazy(() => import("@/pages/Tutorials"));
const TutorialDetail = lazy(() => import("@/pages/TutorialDetail"));
const Videos         = lazy(() => import("@/pages/Videos"));
const VideosCategory = lazy(() => import("@/pages/VideosCategory"));
const Posts          = lazy(() => import("@/pages/Posts"));
const Forum          = lazy(() => import("@/pages/Forum"));
const ForumCategory  = lazy(() => import("@/pages/ForumCategory"));
const ForumThread    = lazy(() => import("@/pages/ForumThread"));
const NewThread      = lazy(() => import("@/pages/NewThread"));
const Terms          = lazy(() => import("@/pages/Terms"));
const Privacy        = lazy(() => import("@/pages/Privacy"));
const NotFound       = lazy(() => import("@/pages/not-found"));
const Login          = lazy(() => import("@/pages/Login"));
const Register       = lazy(() => import("@/pages/Register"));
const Chat           = lazy(() => import("@/pages/Chat"));
const AIAssistant    = lazy(() => import("@/pages/AIAssistant"));
const ResetPassword  = lazy(() => import("@/pages/ResetPassword"));
// Admin & heavy wiki pages
const Admin              = lazy(() => import("@/pages/admin/index"));
const AdminLogin         = lazy(() => import("@/pages/AdminLogin"));
const AdminAnnouncements = lazy(() => import("@/pages/AdminAnnouncements"));
const MediaUpload        = lazy(() => import("@/pages/MediaUpload"));
const BulkSEO            = lazy(() => import("@/pages/BulkSEO"));
const SearchPage         = lazy(() => import("@/pages/Search"));
const Mercenaries        = lazy(() => import("@/pages/Mercenaries"));
const Weapons            = lazy(() => import("@/pages/Weapons"));
const Modes              = lazy(() => import("@/pages/Modes"));
const Maps               = lazy(() => import("@/pages/Maps"));
const Ranks              = lazy(() => import("@/pages/Ranks"));
const GlobalWiki         = lazy(() => import("@/pages/GlobalWiki"));
const GlobalContentHub   = lazy(() => import("@/pages/GlobalContentHub"));
const CustomPagesIndex   = lazy(() => import("@/pages/CustomPagesIndex"));
const CustomPageRoute    = lazy(() => import("@/pages/CustomPageRoute"));

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#f5a623", borderTopColor: "transparent" }} />
    </div>
  );
}

// Wraps any lazy component in ChunkErrorBoundary + Suspense so we don't have
// to repeat the boilerplate on every single Route.
function L({ C, params }: { C: React.ComponentType<any>; params?: any }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<PageSpinner />}>
        <C {...(params ? { params } : {})} />
      </Suspense>
    </ChunkErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      {/* Home loads synchronously for best LCP */}
      <Route path="/" component={Home} />

      {/* Admin routes must come before the generic /:region route below.
         Otherwise "/admin" is interpreted as an unknown wiki region. */}
      <Route path="/admin/login"               component={() => <L C={AdminLogin} />} />
      <Route path="/admin/announcements-manage" component={() => <L C={AdminAnnouncements} />} />
      <Route path="/admin/media-upload"        component={() => <L C={MediaUpload} />} />
      <Route path="/admin/seo-bulk"            component={() => <L C={BulkSEO} />} />
      <Route path="/admin"                     component={() => <L C={Admin} />} />
      <Route path="/admin/:rest*"              component={() => <L C={Admin} />} />

      {/* Content */}
      <Route path="/search"                    component={() => <L C={SearchPage} />} />
      <Route path="/category/news"             component={() => <L C={CategoryNews} />} />
      <Route path="/events"                    component={() => <L C={EventsList} />} />
      <Route path="/blog"                      component={() => <L C={Posts} />} />
      <Route path="/posts"                     component={() => <L C={Posts} />} />
      <Route path="/posts/:slug"               component={() => <L C={Article} />} />
      <Route path="/article/:slug"             component={() => <L C={Article} />} />
      <Route path="/article/id/:legacyId"      component={() => <L C={Article} />} />
      <Route path="/profile"                   component={() => <L C={Profile} />} />
      <Route path="/category/:category"        component={() => <L C={Category} />} />
      <Route path="/reviews"                   component={() => <L C={Reviews} />} />
      <Route path="/community/reviews"         component={() => <L C={Reviews} />} />
      <Route path="/reviews/seller/:sellerName" component={() => <L C={Reviews} />} />
      <Route path="/reviews/seller/slug/:slug" component={() => <L C={Reviews} />} />
      <Route path="/sellers"                   component={() => <L C={Sellers} />} />
      <Route path="/seller/:slug"              component={() => <L C={Sellers} />} />
      <Route path="/services"                 component={() => <L C={Services} />} />
      <Route path="/ar/sellers"               component={() => <L C={Sellers} />} />
      <Route path="/ar/seller/:slug"          component={() => <L C={Sellers} />} />
      <Route path="/ar/services"              component={() => <L C={Services} />} />
      <Route path="/news"                      component={() => <L C={News} />} />
      <Route path="/news/:slug"                component={() => <L C={NewsDetail} />} />
      <Route path="/news/id/:legacyId"         component={() => <L C={NewsDetail} />} />
      <Route path="/events/:slug"              component={() => <L C={EventDetail} />} />
      <Route path="/events/id/:legacyId"       component={() => <L C={EventDetail} />} />

      {/* Wiki */}
      <Route path="/mercenaries"               component={() => <L C={Mercenaries} />} />
      <Route path="/grave-games"               component={() => <L C={GraveGames} />} />
      <Route path="/weapons"                   component={() => <L C={Weapons} />} />
      <Route path="/modes"                     component={() => <L C={Modes} />} />
      <Route path="/maps"                      component={() => <L C={Maps} />} />
      <Route path="/ranks"                     component={() => <L C={Ranks} />} />
      <Route path="/global-wiki"               component={() => <L C={GlobalWiki} />} />
      <Route path="/content-hub"              component={() => <L C={GlobalContentHub} />} />
      <Route path="/content-hub/:slug"        component={(p: any) => <L C={GlobalContentHub} params={p.params} />} />
      <Route path="/pages"                    component={() => <L C={CustomPagesIndex} />} />
      <Route path="/pages/:slug"              component={(p: any) => <L C={CustomPageRoute} params={p.params} />} />
      <Route path="/compare/:slug"            component={(p: any) => <L C={GlobalWiki} params={p.params} />} />

      {/* Support */}
      <Route path="/support"                   component={() => <L C={Support} />} />
      <Route path="/faq"                       component={() => <L C={FAQ} />} />
      <Route path="/my-tickets"                component={() => <L C={MyTickets} />} />

      {/* Info */}
      <Route path="/about"                     component={() => <L C={About} />} />
      <Route path="/contact"                   component={() => <L C={Contact} />} />
      <Route path="/download"                  component={() => <L C={Download} />} />
      <Route path="/terms"                     component={() => <L C={Terms} />} />
      <Route path="/privacy"                   component={() => <L C={Privacy} />} />

      {/* Media */}
      <Route path="/videos"                    component={() => <L C={Videos} />} />
      <Route path="/videos/:category"          component={() => <L C={VideosCategory} />} />
      <Route path="/videos/:category/:slug"    component={() => <L C={TutorialDetail} />} />
      <Route path="/tutorials"                 component={() => <L C={Tutorials} />} />
      <Route path="/tutorials/:slug"           component={() => <L C={TutorialDetail} />} />
      <Route path="/tutorials/id/:legacyId"    component={() => <L C={TutorialDetail} />} />

      {/* Forum */}
      <Route path="/forum"                     component={() => <L C={Forum} />} />
      <Route path="/forum/:categorySlug/new"   component={(p: any) => <L C={NewThread} params={p.params} />} />
      <Route path="/forum/:categorySlug/:threadId" component={(p: any) => <L C={ForumThread} params={p.params} />} />
      <Route path="/forum/:categorySlug"       component={(p: any) => <L C={ForumCategory} params={p.params} />} />

      {/* Auth */}
      <Route path="/login"                     component={() => <L C={Login} />} />
      <Route path="/register"                  component={() => <L C={Register} />} />
      <Route path="/reset-password"            component={() => <L C={ResetPassword} />} />

      {/* Community */}
      <Route path="/chat"                      component={() => <L C={Chat} />} />
      <Route path="/ai"                        component={() => <L C={AIAssistant} />} />

      {/* Regional wiki fallbacks must follow every fixed public route. */}
      <Route path="/:region/weapons/:slug"    component={(p: any) => <L C={GlobalWiki} params={p.params} />} />
      <Route path="/:region"                  component={(p: any) => <L C={GlobalWiki} params={p.params} />} />

      <Route component={() => <L C={NotFound} />} />
    </Switch>
  );
}

function Layout() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");

  // Site Background Logic
  useEffect(() => {
    let cancelled = false;
    const updateBg = async () => {
      try {
        const { getSiteSettings } = await import("@/lib/supabaseApi");
        const data = await getSiteSettings();
        if (cancelled) return;
        const bgUrl = (data as any)?.background_image_url || (data as any)?.backgroundImageUrl || "";
        if (bgUrl) {
          document.documentElement.style.setProperty('--site-bg-image', `url(${bgUrl})`);
        } else {
          document.documentElement.style.setProperty('--site-bg-image', 'none');
        }
      } catch (e) {
        // Gracefully ignore when Supabase is unavailable
      }
    };
    updateBg();
    return () => { cancelled = true; };
  }, []);

  const introOverride = (typeof window !== "undefined") ? (localStorage.getItem("intro_audio_url") || "") : "";

  const animateScrollTop = (duration: number) => {
    try {
      const start = window.scrollY || window.pageYOffset || 0;
      if (start <= 0) return;
      const startTime = performance.now();
      const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const y = Math.round(start * (1 - ease(t)));
        window.scrollTo(0, y);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } catch { }
  };

  useEffect(() => {
    animateScrollTop(300);
  }, [location]);



  useEffect(() => {
    try {
      const el = document.getElementById("intro-audio") as HTMLAudioElement | null;
      if (!el) return;
      const tryPlay = async () => {
        try {
          el.muted = true;
          await el.play();
          setTimeout(() => { try { el.muted = false; } catch { } }, 300);
        } catch { }
      };
      tryPlay();
    } catch { }
  }, []);

  // startup.mp3 removed — sound file not present in public/sounds/

  useEffect(() => {
    try {
      const routeEl = document.getElementById("route-audio") as HTMLAudioElement | null;
      if (!routeEl) return;
      const playOnRoutes = ["/mercenaries", "/modes", "/ranks", "/weapons"];
      const shouldPlay = playOnRoutes.some((p) => location.startsWith(p));
      if (shouldPlay) {
        (async () => {
          try { routeEl.currentTime = 0; routeEl.muted = true; await routeEl.play(); setTimeout(() => { try { routeEl.muted = false; } catch { } }, 300); } catch { }
        })();
      } else {
        try { routeEl.pause(); } catch { }
      }
    } catch { }
  }, [location]);

  if (isAdminPage) {
    return (
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    );
  }

  // 🔧 Maintenance mode — admin يقدر يدخل على /admin عادي
  if (MAINTENANCE_MODE) {
    return (
      <ErrorBoundary>
        <Maintenance />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className="flex flex-col min-h-screen"
      >
        <Header />
        <main className="flex-1">
          <AnnouncementModal location={location} />
          <Router />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

// Reads language from LanguageProvider and sets wouter's base path so that
// /ar/weapons is matched as /weapons, /ar/events as /events, etc.
// Handles Google OAuth first-login: ensures username is set in user_metadata
function useGoogleOAuthFirstLogin() {
  useEffect(() => {
    let mounted = true;
    import("@/lib/supabase").then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        if (!mounted || event !== "SIGNED_IN" || !session?.user) return;
        const user = session.user;
        // Only act for OAuth providers (not email/password logins)
        const isOAuth = user.app_metadata?.provider && user.app_metadata.provider !== "email";
        if (!isOAuth) return;
        // If username is already set, nothing to do
        if (user.user_metadata?.username) return;
        // Derive a username from Google's full_name or email prefix
        const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || "";
        const emailPrefix: string = (user.email || "").split("@")[0];
        const username = fullName.trim().replace(/\s+/g, "_") || emailPrefix || "user";
        try {
          await supabase.auth.updateUser({
            data: {
              username,
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
            },
          });
        } catch { /* non-critical */ }
      });
      return () => { mounted = false; subscription.unsubscribe(); };
    });
    return () => { mounted = false; };
  }, []);
}

function LocalizedApp() {
  useGoogleOAuthFirstLogin();
  const { language } = useLanguage();

  // Keep Arabic admin URLs canonical. The app uses /ar as the router base, but
  // old bookmarks and admin links may still point to /admin/* without it.
  React.useEffect(() => {
    const path = window.location.pathname;
    if (language === "ar" && path === "/") {
      window.history.replaceState(null, "", "/ar");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }
    if (language === "ar" && path.startsWith("/admin")) {
      window.history.replaceState(null, "", `/ar${path}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [language]);

  const base = language === "ar" ? "/ar" : "";
  return (
    <WouterRouter base={base}>
      <SEOHead
        title="CrossFire Wiki — Weapons, Ranks, Events & Guides | Z8Games CF"
        description="An independent CrossFire reference covering weapons, characters, game modes, ranks, maps, events, tutorials, and community guides in English and Arabic. كروس فاير ويكي: مراجع للأسلحة والشخصيات والخرائط والفعاليات وأنظمة اللعب."
        keywords={["CrossFire", "Crossfire", "CF", "Cross Fire", "CrossFire Wiki", "Z8Games", "FPS", "Shooter", "CrossFire events", "CrossFire weapons", "CrossFire ranks", "CrossFire mercenaries", "CrossFire news", "كروس فاير ويكي", "شرح كروس فاير", "ايفنتات كروس فاير", "خرائط كروس فاير", "اسلحة كروس فاير"]}
        ogType="website"
        ogImage="https://crossfire.wiki/feature-crossfire.jpg"
        ogImageAlt="CrossFire Wiki — CrossFire weapons, maps, characters, and events reference"
        ogImageWidth={1200}
        ogImageHeight={630}
        hreflangAlternates={[
          { lang: "en", url: "https://crossfire.wiki/" },
          { lang: "ar", url: "https://crossfire.wiki/ar/" },
        ]}
        breadcrumbs={[
          { name: "CrossFire Wiki", url: "https://crossfire.wiki/" },
        ]}
      />
      <SEOHead
        onlySchema
        schemaType="Organization"
        schemaData={{
          "@id": "https://crossfire.wiki/#organization",
          name: "CrossFire Wiki",
          alternateName: ["CF Wiki", "CrossFire Database"],
          url: "https://crossfire.wiki",
          logo: {
            "@type": "ImageObject",
            "@id": "https://crossfire.wiki/#logo",
            url: "https://crossfire.wiki/logo-new.png",
            width: 512,
            height: 512,
            caption: "CrossFire Wiki",
          },
          description: "An independent CrossFire reference covering weapons, characters, modes, ranks, maps, events, tutorials, and community guides.",
          sameAs: ["https://twitter.com/crossfirewiki"],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            availableLanguage: ["English", "Arabic"],
          },
        }}
      />
      <SEOHead
        onlySchema
        schemaType="WebSite"
        schemaData={{
          "@id": "https://crossfire.wiki/#website",
          name: "CrossFire Wiki",
          alternateName: "CF Wiki",
          url: "https://crossfire.wiki",
          publisher: { "@id": "https://crossfire.wiki/#organization" },
          inLanguage: ["en-US", "ar"],
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://crossfire.wiki/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Layout />
      <TargetCursor spinDuration={2} hideDefaultCursor={true} parallaxOn={true} />
      <Toaster />
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <LocalizedApp />
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    try { console.error("[App ErrorBoundary]", error, info); } catch { }
  }
  render() {
    if (this.state?.hasError) {
      const message =
        (this.state?.error && (this.state.error.message || String(this.state.error))) ||
        "Unknown error";
      const stack = this.state?.error?.stack ? String(this.state.error.stack) : "";
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="max-w-lg w-full p-6 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">An error occurred</h2>
            <p className="text-sm mb-4">Unexpected runtime error. Try reloading or navigating back.</p>
            <div className="text-sm mb-4 p-3 rounded bg-muted border">
              <div className="font-semibold mb-2">Error</div>
              <div className="break-words whitespace-pre-wrap">{message}</div>
              {stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack trace</summary>
                  <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">{stack}</pre>
                </details>
              )}
            </div>
            <div className="flex gap-2">
              <button className="min-h-9 px-4 py-2 border rounded-md" onClick={() => { try { window.location.reload(); } catch { } }}>Reload</button>
              <button className="min-h-9 px-4 py-2 border rounded-md" onClick={() => { try { history.back(); } catch { } }}>Go Back</button>
              <button className="min-h-9 px-4 py-2 border rounded-md" onClick={() => { try { this.setState({ hasError: false, error: undefined }); } catch { } }}>Try Again</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}
