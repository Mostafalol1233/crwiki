export type AdminRoute = {
  path: string;
  section: string;
  breadcrumb: string[];
};

export const ADMIN_ROUTES: AdminRoute[] = [
  { path: '/admin', section: 'dashboard', breadcrumb: ['Dashboard'] },
  { path: '/admin/analytics', section: 'analytics', breadcrumb: ['Analytics'] },
  { path: '/admin/posts', section: 'posts', breadcrumb: ['Content', 'Posts'] },
  { path: '/admin/posts/new', section: 'posts', breadcrumb: ['Content', 'Posts', 'New Post'] },
  { path: '/admin/events', section: 'events', breadcrumb: ['Content', 'Events'] },
  { path: '/admin/events/new', section: 'events', breadcrumb: ['Content', 'Events', 'New Event'] },
  { path: '/admin/news', section: 'news', breadcrumb: ['Content', 'News'] },
  { path: '/admin/news/new', section: 'news', breadcrumb: ['Content', 'News', 'New Article'] },
  { path: '/admin/tutorials', section: 'tutorials', breadcrumb: ['Content', 'Tutorials'] },
  { path: '/admin/announcements', section: 'announcements', breadcrumb: ['Content', 'Announcements'] },
  { path: '/admin/competition', section: 'competition', breadcrumb: ['Content', 'Competition'] },
  { path: '/admin/voice-guesses', section: 'voice-guesses', breadcrumb: ['Content', 'Voice Guesses'] },
  { path: '/admin/weapons', section: 'weapons', breadcrumb: ['Game', 'Weapons'] },
  { path: '/admin/modes', section: 'modes', breadcrumb: ['Game', 'Modes'] },
  { path: '/admin/maps', section: 'maps', breadcrumb: ['Game', 'Maps'] },
  { path: '/admin/ranks', section: 'ranks', breadcrumb: ['Game', 'Ranks'] },
  { path: '/admin/mercenaries', section: 'mercenaries', breadcrumb: ['Game', 'Mercenaries'] },
  { path: '/admin/scraper', section: 'scraper', breadcrumb: ['Game', 'Scraper'] },
  { path: '/admin/wiki-rescraper', section: 'wiki-rescraper', breadcrumb: ['Game', 'Wiki Rescraper'] },
  { path: '/admin/sellers', section: 'sellers', breadcrumb: ['Commerce', 'Sellers'] },
  { path: '/admin/services', section: 'services', breadcrumb: ['Commerce', 'Service Listings'] },
  { path: '/admin/seller-reviews', section: 'seller-reviews', breadcrumb: ['Commerce', 'Seller Reviews'] },
  { path: '/admin/media', section: 'media', breadcrumb: ['Media'] },
  { path: '/admin/highlights', section: 'highlights', breadcrumb: ['Media', 'Highlights'] },
  { path: '/admin/portals', section: 'portals', breadcrumb: ['Media', 'Portal Images'] },
  { path: '/admin/users', section: 'users', breadcrumb: ['System', 'Users'] },
  { path: '/admin/tickets', section: 'tickets', breadcrumb: ['System', 'Tickets'] },
  { path: '/admin/newsletter', section: 'newsletter', breadcrumb: ['System', 'Newsletter'] },
  { path: '/admin/bulk-seo', section: 'bulk-seo', breadcrumb: ['System', 'Bulk SEO'] },
  { path: '/admin/custom-pages', section: 'custom-pages', breadcrumb: ['System', 'Custom Pages'] },
  { path: '/admin/faq', section: 'faq', breadcrumb: ['System', 'FAQ'] },
  { path: '/admin/site-settings', section: 'site-settings', breadcrumb: ['System', 'Site Settings'] },
  { path: '/admin/hardcoded-config', section: 'hardcoded-config', breadcrumb: ['System', 'Hardcoded Config'] },
];

export function getAdminRoute(location: string): AdminRoute | undefined {
  return ADMIN_ROUTES
    .filter((route) => location === route.path || location.startsWith(`${route.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function getAdminSection(location: string): string {
  return getAdminRoute(location)?.section || 'dashboard';
}

export function getAdminBreadcrumb(location: string): string[] {
  const route = getAdminRoute(location);
  if (!route) return ['Admin'];

  const suffix = location.slice(route.path.length).replace(/^\/+/, '');
  return suffix
    ? [...route.breadcrumb, suffix.charAt(0).toUpperCase() + suffix.slice(1)]
    : route.breadcrumb;
}
