import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageSEO from "@/components/PageSEO";
import { useQuery } from "@tanstack/react-query";
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
import { useEffect, useMemo, useState } from "react";

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
  const [verifiedSellers, setVerifiedSellers] = useState(20);
  const [sellerMonthlyFee, setSellerMonthlyFee] = useState(30);
  const [monthlyServiceOrders, setMonthlyServiceOrders] = useState(100);
  const [avgServiceOrderValue, setAvgServiceOrderValue] = useState(12);
  const [serviceCommissionPct, setServiceCommissionPct] = useState(12);
  const [premiumMembers, setPremiumMembers] = useState(300);
  const [premiumMonthlyPrice, setPremiumMonthlyPrice] = useState(2);
  const [affiliateMonthlySales, setAffiliateMonthlySales] = useState(2000);
  const [affiliateCommissionPct, setAffiliateCommissionPct] = useState(4);
  const { data: monetizationDefaults } = useQuery<any>({
    queryKey: ["/api/public/settings/site"],
  });

  useEffect(() => {
    if (!monetizationDefaults) return;
    setSellerMonthlyFee(monetizationDefaults.monetizationVerifiedSellerFee ?? 30);
    setServiceCommissionPct(monetizationDefaults.monetizationBoostingCommissionPct ?? 12);
    setPremiumMonthlyPrice(monetizationDefaults.monetizationPremiumMonthlyPrice ?? 2);
    setAffiliateCommissionPct(monetizationDefaults.monetizationAffiliateCommissionPct ?? 4);
  }, [monetizationDefaults]);

  const estimatedRevenue = useMemo(() => {
    const sellersRevenue = verifiedSellers * sellerMonthlyFee;
    const servicesRevenue =
      monthlyServiceOrders * avgServiceOrderValue * (serviceCommissionPct / 100);
    const premiumRevenue = premiumMembers * premiumMonthlyPrice;
    const affiliateRevenue = affiliateMonthlySales * (affiliateCommissionPct / 100);
    const monthlyTotal = sellersRevenue + servicesRevenue + premiumRevenue + affiliateRevenue;

    return {
      sellersRevenue,
      servicesRevenue,
      premiumRevenue,
      affiliateRevenue,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
    };
  }, [
    verifiedSellers,
    sellerMonthlyFee,
    monthlyServiceOrders,
    avgServiceOrderValue,
    serviceCommissionPct,
    premiumMembers,
    premiumMonthlyPrice,
    affiliateMonthlySales,
    affiliateCommissionPct,
  ]);

  return (
    <>
      <PageSEO
        title={isArabic ? "التسعير وبرامج الربح — CrossFire Wiki" : "Pricing & Revenue Programs — CrossFire Wiki"}
        description={isArabic ? "استكشف برامج الربح في CrossFire Wiki مثل البائعين الموثوقين، والعضويات المميزة، والأفلييت، والخدمات." : "Explore CrossFire Wiki monetization programs including verified sellers, premium access, affiliate gear offers, coaching services, and sponsor packages."}
        canonicalPath="/pricing"
        schemaType="WebPage"
        schemaData={{
          name: isArabic ? "برامج الربح في CrossFire Wiki" : "CrossFire Wiki Pricing & Revenue Programs",
          description: isArabic ? "نظرة عامة على برامج الربح والباقات والخدمات." : "Revenue program overview for CrossFire Wiki including verified sellers, premium memberships, affiliate recommendations, and service offerings.",
          url: "/pricing",
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4">
              {isArabic ? "خطة الربح" : "Monetization blueprint"}
            </Badge>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              {isArabic ? "ابنِ مصادر دخل حول مجتمع CrossFire Wiki" : "Build revenue streams around the CrossFire Wiki community"}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground">
              {isArabic
                ? "بدلاً من الاعتماد فقط على الإعلانات المزعجة، يمكن للموقع تحقيق دخل من التجارة الموثوقة، والأدوات المميزة، والرعايات، والخدمات المفيدة للاعبين."
                : "Instead of relying only on distracting ads, the site can earn from trusted commerce, premium tools, sponsored visibility, and player services that actually help the CrossFire audience."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sellers">
                  {isArabic ? "استعرض البائعين" : "Explore sellers"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/support">{isArabic ? "اطلب ميزة" : "Request a feature"}</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">{isArabic ? "كن شريكاً" : "Become a partner"}</Link>
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
                      {isArabic && <p className="text-sm font-semibold text-primary">كيف يحقق دخلاً</p>}
                      <p className="mt-1 text-sm text-muted-foreground">{offer.monetization}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold">{isArabic ? "ماذا تدير من لوحة التحكم" : "What to manage in dashboard"}</p>
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
                  {isArabic ? "ترتيب التنفيذ المقترح" : "Recommended rollout order"}
                </CardTitle>
                <CardDescription>
                  {isArabic ? "ابدأ بالموجود حالياً ثم أضف الخدمات والأدوات الأعلى قيمة." : "Start with features that use the current stack, then add higher-value services and tools."}
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
                  {isArabic ? "مدعوم بالفعل داخل الموقع" : "Already supported by the site"}
                </CardTitle>
                <CardDescription>
                  {isArabic ? "لديك بالفعل أساس قوي يمكن تحويله إلى باقات وخدمات أوضح." : "You already have strong building blocks that can be monetized with cleaner packaging."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">{isArabic ? "صفحات البائعين + المراجعات" : "Seller pages + reviews"}</p>
                  <p className="mt-1">{isArabic ? "استخدمها كأساس للبائعين الموثوقين والباقات المميزة." : "Use them as the foundation for verified vendors and featured placements."}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">{isArabic ? "الأخبار + الإيفينتات" : "Events + news content engine"}</p>
                  <p className="mt-1">{isArabic ? "مناسبة للرعايات، وصفحات الشركاء، وروابط الأفلييت." : "Perfect for sponsored events, partner posts, and affiliate placements."}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">{isArabic ? "الإدارة + الصفحات المخصصة" : "Admin + custom pages"}</p>
                  <p className="mt-1">{isArabic ? "مفيدة لصفحات الهبوط، والعروض المميزة، والأدوات المستقبلية." : "Useful for landing pages, premium offers, and future calculators or gated tools."}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-foreground">{isArabic ? "التحليلات" : "Analytics"}</p>
                  <p className="mt-1">{isArabic ? "تابع الزيارات والنقرات والتفاعل لتقديم قيمة واضحة للشركاء." : "Track seller views, clicks, and engagement so partners can see measurable value."}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 border-border/70">
            <CardHeader>
              <CardTitle className="text-2xl">Revenue estimator (quick planning tool)</CardTitle>
              <CardDescription>
                Change the assumptions to estimate monthly and yearly revenue potential from core
                monetization streams.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="verified-sellers">Verified sellers count</Label>
                  <Input
                    id="verified-sellers"
                    type="number"
                    min={0}
                    value={verifiedSellers}
                    onChange={(e) => setVerifiedSellers(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-monthly-fee">Seller monthly fee ($)</Label>
                  <Input
                    id="seller-monthly-fee"
                    type="number"
                    min={0}
                    value={sellerMonthlyFee}
                    onChange={(e) => setSellerMonthlyFee(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-orders">Monthly boosting/coaching orders</Label>
                  <Input
                    id="service-orders"
                    type="number"
                    min={0}
                    value={monthlyServiceOrders}
                    onChange={(e) =>
                      setMonthlyServiceOrders(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-order-value">Average service order value ($)</Label>
                  <Input
                    id="service-order-value"
                    type="number"
                    min={0}
                    value={avgServiceOrderValue}
                    onChange={(e) =>
                      setAvgServiceOrderValue(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-commission">Service commission (%)</Label>
                  <Input
                    id="service-commission"
                    type="number"
                    min={0}
                    max={100}
                    value={serviceCommissionPct}
                    onChange={(e) =>
                      setServiceCommissionPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premium-members">Premium members</Label>
                  <Input
                    id="premium-members"
                    type="number"
                    min={0}
                    value={premiumMembers}
                    onChange={(e) => setPremiumMembers(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premium-price">Premium price per month ($)</Label>
                  <Input
                    id="premium-price"
                    type="number"
                    min={0}
                    value={premiumMonthlyPrice}
                    onChange={(e) =>
                      setPremiumMonthlyPrice(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliate-sales">Affiliate tracked sales ($/month)</Label>
                  <Input
                    id="affiliate-sales"
                    type="number"
                    min={0}
                    value={affiliateMonthlySales}
                    onChange={(e) =>
                      setAffiliateMonthlySales(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliate-commission">Affiliate commission (%)</Label>
                  <Input
                    id="affiliate-commission"
                    type="number"
                    min={0}
                    max={100}
                    value={affiliateCommissionPct}
                    onChange={(e) =>
                      setAffiliateCommissionPct(
                        Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <h3 className="text-lg font-semibold">Estimated revenue breakdown</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center justify-between">
                    <span>Verified sellers</span>
                    <strong>${estimatedRevenue.sellersRevenue.toFixed(2)}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Boosting/coaching commissions</span>
                    <strong>${estimatedRevenue.servicesRevenue.toFixed(2)}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Premium subscriptions</span>
                    <strong>${estimatedRevenue.premiumRevenue.toFixed(2)}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Affiliate commission</span>
                    <strong>${estimatedRevenue.affiliateRevenue.toFixed(2)}</strong>
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="flex items-center justify-between text-base">
                    <span className="font-medium">Total monthly</span>
                    <strong className="text-primary">${estimatedRevenue.monthlyTotal.toFixed(2)}</strong>
                  </p>
                  <p className="mt-1 flex items-center justify-between text-base">
                    <span className="font-medium">Total yearly</span>
                    <strong>${estimatedRevenue.yearlyTotal.toFixed(2)}</strong>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: these default commission/price values can now be managed from Admin → Dashboard → Monetization Controls.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
