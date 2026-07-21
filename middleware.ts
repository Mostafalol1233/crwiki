/**
 * Vercel Edge Middleware — Bot detection & prerender routing
 *
 * Social media crawlers (Facebook, Discord, WhatsApp, Telegram, Slack, etc.)
 * do NOT execute JavaScript, so they cannot see client-side injected <meta>
 * tags. This middleware intercepts their requests and serves a prerendered
 * HTML page with correct OG/Twitter/Schema tags from /api/prerender.
 */

export const config = {
  matcher: [
    "/events/:path*",
    "/news/:path*",
    "/posts/:path*",
    "/tutorials/:path*",
    "/weapons",
    "/modes",
    "/ranks",
    "/mercenaries",
    "/maps",
  ],
};

const SOCIAL_BOT_RE =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|discordbot|telegrambot|applebot|googlebot|bingbot|yandexbot|baiduspider|duckduckbot|sogou|exabot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|screaming\s?frog|sitebulb|seobility|serpstat|serpapi|curl\//i;

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get("user-agent") ?? "";
  if (!SOCIAL_BOT_RE.test(ua)) return undefined; // pass through normally

  const url = new URL(request.url);
  const prerenderUrl = new URL("/api/prerender", url.origin);
  prerenderUrl.searchParams.set("path", url.pathname);

  try {
    const response = await fetch(prerenderUrl.toString(), {
      signal: AbortSignal.timeout(8000),
      headers: {
        "x-prerender-bot": "1",
        "user-agent": ua,
      },
    });
    if (response.ok) {
      const body = await response.text();
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Prerendered": "1",
        },
      });
    }
  } catch {
    // On timeout / error → fall through to normal static serving
  }
  return undefined;
}
