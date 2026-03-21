import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageSEO from "@/components/PageSEO";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Gem,
  Link as LinkIcon,
  ShieldCheck,
  ShoppingBag,
  Swords,
  Target,
  Trophy,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";

const offers = [
  {
    icon: ShieldCheck,
    title: "Verified Sellers Marketplace",
    badge: "Live-ready",
    description:
      "Turn the existing sellers section into a trusted commercial channel. Give approved merchants better placement, verified badges, richer store pages, and review-backed credibility.",
    monetization:
      "Charge monthly listing fees, premium placement upgrades, or featured campaign slots for top-up sellers and approved service providers.",
    operations: [
      "Approve and rank trusted sellers from the admin panel",
      "Offer featured placement and homepage exposure",
      "Track clicks, reviews, and conversion intent from seller analytics",
    ],
  },
  {
    icon: Swords,
    title: "Boosting & Coaching Requests",
    badge: "High demand",
    description:
      "Add structured request forms for rank boosting, coaching sessions, scrim prep, or aim-training help. Match players with trusted providers instead of random Discord DMs.",
    monetization:
      "Take a platform commission on each accepted request or sell priority placement to elite coaches and boosters.",
    operations: [
      "Collect request details, preferred rank, and deadlines",
      "Create an admin queue for approval and assignment",
      "Release payment only after completion confirmation",
    ],
  },
  {
    icon: Crown,
    title: "Premium Wiki Membership",
    badge: "Recurring revenue",
    description:
      "Offer a premium layer with advanced guides, early event breakdowns, optimized loadout calculators, and members-only tutorial packs.",
    monetization:
      "Sell low-cost monthly subscriptions with perks like no interruptions, early access content, exclusive strategy breakdowns, and premium tools.",
    operations: [
      "Lock selected guides or tools behind membership",
      "Bundle premium event alerts and weapon comparison tools",
      "Create premium-only landing pages and newsletters",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Affiliate Gear & Top-up Recommendations",
    badge: "Low friction",
    description:
      "Place relevant affiliate offers on weapon, tutorial, and equipment pages: mice, keyboards, headsets, capture cards, or regional top-up vouchers.",
    monetization:
      "Earn commission from affiliate links without charging the player extra.",
    operations: [
      "Add curated gear widgets under tactical content",
      "Tag content by audience: sniper, rifler, streamer, beginner",
      "Measure click-through rate per page or seller campaign",
    ],
  },
  {
    icon: Trophy,
    title: "Sponsored Clans, Tournaments & Events",
    badge: "Brand growth",
    description:
      "Use the event/news system to host premium placements for clans, tournaments, and community partners that want traffic and visibility.",
    monetization:
      "Sell sponsored homepage modules, event spotlights, and branded content packages.",
    operations: [
      "Offer sponsored event cards and custom landing pages",
      "Bundle analytics screenshots for sponsors",
      "Feature partners in event detail pages and newsletters",
    ],
  },
  {
    icon: Wrench,
    title: "Developer Tools & Data Products",
    badge: "Programming angle",
    description:
      "Build practical tools for serious players and creators: damage calculators, map callout trainers, API widgets, scrim planners, or ranked stat dashboards.",
    monetization:
      "Charge for premium access, white-label embeds, API usage, or downloadable pro toolkits for clans and creators.",
    operations: [
      "Package tools as premium utilities or B2B widgets",
      "Expose stats or calculators through authenticated APIs",
      "Use the custom pages system to launch tool landing pages fast",
    ],
  },
];

const roadmap = [
  {
    phase: "Phase 1",
    title: "Monetize what already exists",
    items: [
      "Promote verified sellers more clearly",
      "Add featured seller packages",
      "Place affiliate widgets on buyer-intent pages",
    ],
  },
  {
    phase: "Phase 2",
    title: "Launch service demand capture",
    items: [
      "Create boosting/coaching request intake forms",
      "Add admin workflows for assignment and completion",
      "Start taking service commissions",
    ],
  },
  {
    phase: "Phase 3",
    title: "Ship premium tools",
    items: [
      "Premium strategy guides and calculators",
      "Members-only event alerts and tutorials",
      "API/data access for clans and creators",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageSEO
        title="Pricing & Revenue Programs — CrossFire Wiki"
        description="Explore CrossFire Wiki monetization programs including verified sellers, premium access, affiliate gear offers, coaching services, and sponsor packages."
        canonicalPath="/pricing"
        schemaType="WebPage"
        schemaData={{
          name: "CrossFire Wiki Pricing & Revenue Programs",
          description:
            "Revenue program overview for CrossFire Wiki including verified sellers, premium memberships, affiliate recommendations, and service offerings.",
          url: "/pricing",
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4">
              Monetization blueprint
            </Badge>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Build revenue streams around the CrossFire Wiki community
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground">
              Instead of relying only on distracting ads, the site can earn from trusted commerce,
              premium tools, sponsored visibility, and player services that actually help the
              CrossFire audience.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sellers">
                  Explore sellers
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/support">Request a feature</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">Become a partner</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => {
              const Icon = offer.icon;
              return (
                <Card key={offer.title} className="border-border/70 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary">{offer.badge}</Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{offer.title}</CardTitle>
                      <CardDescription className="mt-2 text-sm leading-6">
                        {offer.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-sm font-semibold text-primary">How it makes money</p>
                      <p className="mt-1 text-sm text-muted-foreground">{offer.monetization}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold">What to manage in dashboard</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {offer.operations.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Target className="h-5 w-5 text-primary" />
                  Recommended rollout order
                </CardTitle>
                <CardDescription>
                  Start with features that use the current stack, then add higher-value services and tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {roadmap.map((step) => (
                  <div key={step.phase} className="rounded-xl border bg-muted/30 p-4">
                    <Badge variant="outline">{step.phase}</Badge>
                    <h3 className="mt-3 font-semibold">{step.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Gem className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  Already supported by the site
                </CardTitle>
                <CardDescription>
                  You already have strong building blocks that can be monetized with cleaner packaging.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">Seller pages + reviews</p>
                  <p className="mt-1">Use them as the foundation for verified vendors and featured placements.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">Events + news content engine</p>
                  <p className="mt-1">Perfect for sponsored events, partner posts, and affiliate placements.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">Admin + custom pages</p>
                  <p className="mt-1">Useful for landing pages, premium offers, and future calculators or gated tools.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">Analytics</p>
                  <p className="mt-1">Track seller views, clicks, and engagement so partners can see measurable value.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
