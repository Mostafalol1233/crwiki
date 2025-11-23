import { Switch, Route, useLocation } from "wouter";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
  <Route path="/category/news" component={CategoryNews} />
  <Route path="/events" component={Category} />
  <Route path="/category/:category" component={Category} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/sellers" component={Sellers} />
      <Route path="/news" component={News} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/mercenaries" component={Mercenaries} />
      <Route path="/grave-games" component={GraveGames} />
      <Route path="/article/:id" component={Article} />
      <Route path="/support" component={Support} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/download" component={Download} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/tutorials/:id" component={TutorialDetail} />
      <Route path="/weapons" component={Weapons} />
      <Route path="/modes" component={Modes} />
      <Route path="/ranks" component={Ranks} />
      <Route path="/posts" component={Posts} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
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

  if (isAdminPage) {
    return <Router />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
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
                logo: "/white-vafcoin.png",
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
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
