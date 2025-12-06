import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import DataSeeder from "@/components/DataSeeder";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
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
import Reviews from "@/pages/Reviews";
import Sellers from "@/pages/Sellers";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Support from "@/pages/Support";
import MyTickets from "@/pages/MyTickets";
import Tutorials from "@/pages/Tutorials";
import TutorialDetail from "@/pages/TutorialDetail";
import Weapons from "@/pages/Weapons";
import Modes from "@/pages/Modes";
import Ranks from "@/pages/Ranks";
import Posts from "@/pages/Posts";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Chat from "@/pages/Chat";
import ResetPassword from "@/pages/ResetPassword";
import { SEOHead } from "@/components/SEOHead";
import AnnouncementModal from "@/components/AnnouncementModal";
import TargetCursor from "@/components/TargetCursor";
import AdminAnnouncements from "@/pages/AdminAnnouncements";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
  <Route path="/category/news" component={CategoryNews} />
  <Route path="/events" component={Category} />
  <Route path="/category/:category" component={Category} />
      <Route path="/reviews" component={Reviews} />
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
      <Route path="/article/:slug" component={Article} />
      <Route path="/article/id/:legacyId" component={Article} />
      <Route path="/support" component={Support} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/download" component={Download} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/tutorials/:slug" component={TutorialDetail} />
      <Route path="/tutorials/id/:legacyId" component={TutorialDetail} />
      <Route path="/weapons" component={Weapons} />
      <Route path="/modes" component={Modes} />
      <Route path="/ranks" component={Ranks} />
      <Route path="/posts" component={Posts} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/announcements-manage" component={AdminAnnouncements} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/:rest*" component={Admin} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/chat" component={Chat} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Layout() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  const [showNeon, setShowNeon] = useState(false);
  const [neonFade, setNeonFade] = useState(false);
  const audioRef = (typeof window !== "undefined") ? (window as any).__introAudioRef || { current: null } : { current: null };
  if ((window as any).__introAudioRef === undefined) {
    (window as any).__introAudioRef = { current: null };
  }
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
    } catch {}
  };

  useEffect(() => {
    animateScrollTop(300);
  }, [location]);

  useEffect(() => {
    try {
      const el = document.getElementById("intro-audio") as HTMLAudioElement | null;
      if (!el) return;
      audioRef.current = el;
      const onEnded = () => { setNeonFade(true); setTimeout(() => setShowNeon(false), 800); };
      const onPlaying = () => { setNeonFade(false); setShowNeon(true); setTimeout(() => setShowNeon(false), 2000); };
      el.addEventListener("ended", onEnded);
      el.addEventListener("playing", onPlaying);
      const tryPlay = async () => {
        try {
          el.muted = true;
          await el.play();
          // unmute shortly after to respect autoplay policies
          setTimeout(() => { try { el.muted = false; } catch {} }, 300);
        } catch {
          // show subtle prompt if autoplay blocked
          setShowNeon(true);
          setTimeout(() => setShowNeon(false), 2000);
        }
      };
      tryPlay();
      return () => { el.removeEventListener("ended", onEnded); el.removeEventListener("playing", onPlaying); };
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const audio = new Audio('/sounds/startup.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const routeEl = document.getElementById("route-audio") as HTMLAudioElement | null;
      if (!routeEl) return;
      const playOnRoutes = ["/mercenaries", "/modes", "/ranks", "/weapons"];
      const shouldPlay = playOnRoutes.some((p) => location.startsWith(p));
      if (shouldPlay) {
        (async () => {
          try { routeEl.currentTime = 0; routeEl.muted = true; await routeEl.play(); setTimeout(() => { try { routeEl.muted = false; } catch {} }, 300); } catch {}
        })();
      } else {
        try { routeEl.pause(); } catch {}
      }
    } catch {}
  }, [location]);

  if (isAdminPage) {
    return <Router />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <audio id="intro-audio" src={introOverride || "https://files.catbox.moe/imua96.mp3"} preload="auto" playsInline autoPlay muted />
      <audio id="route-audio" src="https://files.catbox.moe/7ljomr.mp3" preload="auto" playsInline />
      {showNeon && (
        <div className={`vox-neon-text ${neonFade ? "vox-fade-out" : ""}`} aria-live="polite" role="status">
          <div className="vox-electric">
            <h1 className="vox-text vox-pulse" aria-label="trust us with your news">trust us with your news</h1>
          </div>
        </div>
      )}
      <Header />
      <main className="flex-1">
        <AnnouncementModal location={location} />
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SEOHead
              onlySchema
              schemaType="Organization"
              schemaData={{
                name: "CrossFire Wiki",
                url: (typeof window !== "undefined" ? window.location.origin : "https://crossfire.wiki"),
                logo: "https://images.seeklogo.com/logo-png/42/1/crossfire-logo-png_seeklogo-429200.png",
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
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
