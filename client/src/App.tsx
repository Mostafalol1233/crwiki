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
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Maintenance from "@/pages/Maintenance";
import Article from "@/pages/Article";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Download from "@/pages/Download";

import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import EventDetail from "@/pages/EventDetail";
import Mercenaries from "@/pages/Mercenaries";
import GraveGames from "@/pages/GraveGames";
import Category from "@/pages/Category";
import CategoryNews from "@/pages/CategoryNews";
import EventsList from "@/pages/EventsList";
import Profile from "@/pages/Profile";
import Reviews from "@/pages/Reviews";
import Sellers from "@/pages/Sellers";
import Support from "@/pages/Support";
import FAQ from "@/pages/FAQ";
import MyTickets from "@/pages/MyTickets";
import Tutorials from "@/pages/Tutorials";
import TutorialDetail from "@/pages/TutorialDetail";
import Videos from "@/pages/Videos";
import VideosCategory from "@/pages/VideosCategory";
import Weapons from "@/pages/Weapons";
import Modes from "@/pages/Modes";
import Maps from "@/pages/Maps";
import Ranks from "@/pages/Ranks";
import Posts from "@/pages/Posts";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Chat from "@/pages/Chat";
import AIAssistant from "@/pages/AIAssistant";
import ResetPassword from "@/pages/ResetPassword";
import BulkSEO from "@/pages/BulkSEO";
import { SEOHead } from "@/components/SEOHead";
import AnnouncementModal from "@/components/AnnouncementModal";
import TargetCursor from "@/components/TargetCursor";


// ══════════════════════════════════════════════
// 🔧 MAINTENANCE MODE — غير true لـ false لفتح الموقع
const MAINTENANCE_MODE = false;
// ══════════════════════════════════════════════

// Lazy load admin pages
const Admin = lazy(() => import("@/pages/admin/index"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminAnnouncements = lazy(() => import("@/pages/AdminAnnouncements"));
const MediaUpload = lazy(() => import("@/pages/MediaUpload"));
const SearchPage = lazy(() => import("@/pages/Search"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={() => <Suspense fallback={<div>Loading...</div>}><SearchPage /></Suspense>} />
      <Route path="/category/news" component={CategoryNews} />
      <Route path="/events" component={EventsList} />
      <Route path="/blog" component={Posts} />
      <Route path="/profile" component={Profile} />
      <Route path="/category/:category" component={Category} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/community/reviews" component={Reviews} />
      <Route path="/reviews/seller/:sellerName" component={Reviews} />
      <Route path="/reviews/seller/slug/:slug" component={Reviews} />
      <Route path="/sellers" component={Sellers} />
      <Route path="/seller/:slug" component={Sellers} />
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsDetail} />
      <Route path="/news/id/:legacyId" component={NewsDetail} />
      <Route path="/events/:slug" component={EventDetail} />
      <Route path="/events/id/:legacyId" component={EventDetail} />
      <Route path="/mercenaries" component={Mercenaries} />
      <Route path="/grave-games" component={GraveGames} />
      <Route path="/posts/:slug" component={Article} />
      <Route path="/article/:slug" component={Article} />
      <Route path="/article/id/:legacyId" component={Article} />
      <Route path="/support" component={Support} />
      <Route path="/faq" component={FAQ} />

      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/download" component={Download} />
      <Route path="/videos" component={Videos} />
      <Route path="/videos/:category" component={VideosCategory} />
      <Route path="/videos/:category/:slug" component={TutorialDetail} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/tutorials/:slug" component={TutorialDetail} />
      <Route path="/tutorials/id/:legacyId" component={TutorialDetail} />
      <Route path="/weapons" component={Weapons} />
      <Route path="/modes" component={Modes} />
      <Route path="/maps" component={Maps} />
      <Route path="/ranks" component={Ranks} />
      <Route path="/posts" component={Posts} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/admin/login" component={() => <Suspense fallback={<div>Loading...</div>}><AdminLogin /></Suspense>} />
      <Route path="/admin/announcements-manage" component={() => <Suspense fallback={<div>Loading...</div>}><AdminAnnouncements /></Suspense>} />
      <Route path="/admin/media-upload" component={() => <Suspense fallback={<div>Loading...</div>}><MediaUpload /></Suspense>} />
      <Route path="/admin/seo-bulk" component={() => <Suspense fallback={<div>Loading...</div>}><BulkSEO /></Suspense>} />
      <Route path="/admin" component={() => <Suspense fallback={<div>Loading...</div>}><Admin /></Suspense>} />
      <Route path="/admin/:rest*" component={() => <Suspense fallback={<div>Loading...</div>}><Admin /></Suspense>} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/chat" component={Chat} />
      <Route path="/ai" component={AIAssistant} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
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

  useEffect(() => {
    try {
      const audio = new Audio('/sounds/startup.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => { });
    } catch { }
  }, []);

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
        <audio id="intro-audio" src={introOverride || "https://files.catbox.moe/imua96.mp3"} preload="auto" playsInline autoPlay muted />
        <audio id="route-audio" src="https://files.catbox.moe/7ljomr.mp3" preload="auto" playsInline />
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
function LocalizedApp() {
  const { language } = useLanguage();
  const base = language === "ar" ? "/ar" : "";
  return (
    <WouterRouter base={base}>
      <SEOHead
        title="CrossFire Wiki — Complete CrossFire Gaming Guide"
        description="CrossFire Wiki: news, events, guides, modes, weapons, ranks, mercenaries, and community updates. كروس فاير ويكي: شرح ايفنتات واسلحة وخرائط ومودات كروس فاير."
        keywords={["CrossFire", "Crossfire", "CF", "CrossFire Wiki", "Z8Games", "FPS", "Shooter", "كروس فاير ويكي", "شرح كروس فاير", "ايفنتات كروس فاير", "خرائط كروس فاير", "اسلحة كروس فاير"]}
        ogType="website"
        ogImage="https://crossfire.wiki/logo-new.png"
        ogImageAlt="CrossFire Wiki default Open Graph image"
        ogImageWidth={1200}
        ogImageHeight={630}
      />
      <SEOHead
        onlySchema
        schemaType="Organization"
        schemaData={{
          name: "CrossFire Wiki",
          url: (typeof window !== "undefined" ? window.location.origin : "https://crossfire.wiki"),
          logo: (typeof window !== "undefined" ? `${window.location.origin}/logo-new.png` : "https://crossfire.wiki/logo-new.png"),
        }}
      />
      <SEOHead
        onlySchema
        schemaType="WebSite"
        schemaData={{
          name: "CrossFire Wiki",
          url: (typeof window !== "undefined" ? window.location.origin : "https://crossfire.wiki"),
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
