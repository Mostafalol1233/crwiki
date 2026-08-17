import { useLocation, Redirect } from 'wouter';
import { Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { isAdminAuthenticated } from '@/lib/supabaseAdmin';

const Dashboard = lazy(() => import('./Dashboard'));
const Analytics = lazy(() => import('./Analytics'));
const PostsManager = lazy(() => import('./PostsManager'));
const EventsManager = lazy(() => import('./EventsManager'));
const NewsManager = lazy(() => import('./NewsManager'));
const TutorialsManager = lazy(() => import('./TutorialsManager'));
const AnnouncementsManager = lazy(() => import('./AnnouncementsManager'));
const WeaponsManager = lazy(() => import('./WeaponsManager'));
const ModesManager = lazy(() => import('./ModesManager'));
const MapsManager = lazy(() => import('./MapsManager'));
const RanksManager = lazy(() => import('./RanksManager'));
const MercenariesManager = lazy(() => import('./MercenariesManager'));
const ScraperManager = lazy(() => import('./ScraperManager'));
const WikiRescraper = lazy(() => import('./WikiRescraper'));
const SellersManager = lazy(() => import('./SellersManager'));
const ServicesManager = lazy(() => import('./ServicesManager'));
const SellerReviews = lazy(() => import('./SellerReviews'));
const MediaManager = lazy(() => import('./MediaManager'));
const UsersManager = lazy(() => import('./UsersManager'));
const TicketsManager = lazy(() => import('./TicketsManager'));
const BulkSEO = lazy(() => import('./BulkSEO'));
const CustomPages = lazy(() => import('./CustomPages'));
const FAQManager = lazy(() => import('./FAQManager'));
const SiteSettings = lazy(() => import('./SiteSettings'));
const HighlightsManager = lazy(() => import('./HighlightsManager'));
const PortalsManager = lazy(() => import('./PortalsManager'));
const HardcodedConfig = lazy(() => import('./HardcodedConfig'));

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%', color: '#52525b', fontSize: 14 }}>
      Loading...
    </div>
  );
}

function getSection(location: string) {
  if (location === '/admin' || location === '/admin/') return 'dashboard';
  const seg = location.replace('/admin/', '').split('/')[0];
  return seg || 'dashboard';
}

function SectionContent({ section }: { section: string }) {
  switch (section) {
    case 'dashboard': return <Dashboard />;
    case 'analytics': return <Analytics />;
    case 'posts': return <PostsManager />;
    case 'events': return <EventsManager />;
    case 'news': return <NewsManager />;
    case 'tutorials': return <TutorialsManager />;
    case 'announcements': return <AnnouncementsManager />;
    case 'weapons': return <WeaponsManager />;
    case 'modes': return <ModesManager />;
    case 'maps': return <MapsManager />;
    case 'ranks': return <RanksManager />;
    case 'mercenaries': return <MercenariesManager />;
    case 'scraper': return <ScraperManager />;
    case 'wiki-rescraper': return <WikiRescraper />;
    case 'sellers': return <SellersManager />;
    case 'services': return <ServicesManager />;
    case 'seller-reviews': return <SellerReviews />;
    case 'media': return <MediaManager />;
    case 'users': return <UsersManager />;
    case 'tickets': return <TicketsManager />;
    case 'bulk-seo': return <BulkSEO />;
    case 'custom-pages': return <CustomPages />;
    case 'faq': return <FAQManager />;
    case 'site-settings': return <SiteSettings />;
    case 'highlights': return <HighlightsManager />;
    case 'portals': return <PortalsManager />;
    case 'hardcoded-config': return <HardcodedConfig />;
    default: return <Dashboard />;
  }
}

export default function AdminPanel() {
  const [location] = useLocation();

  if (!isAdminAuthenticated()) {
    return <Redirect to="/admin/login" />;
  }

  const section = getSection(location);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b', fontFamily: 'Inter, sans-serif', color: '#fafafa' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AdminTopbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#09090b' }}>
          <Suspense fallback={<Loading />}>
            <SectionContent section={section} />
          </Suspense>
        </main>
      </div>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: { background: '#18181b', border: '1px solid #3f3f46', color: '#fafafa', fontFamily: 'Inter,sans-serif', fontSize: 14 },
        }}
      />
    </div>
  );
}
