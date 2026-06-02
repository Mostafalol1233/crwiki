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
  Link2,
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
  const isArabic = typeof window !== "undefined" && (document.documentElement.lang === "ar" || localStorage.getItem("lang") === "ar");
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
    queryFn: async () => {
      const { getSiteSettings } = await import("@/lib/supabaseApi");
      return getSiteSettings();
    },
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

      <div className="min-h-screen" style={{ background: "var(--background)" }} dir={isArabic ? "rtl" : "ltr"}>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden py-20 md:py-28 text-center" style={{ background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 70%)" }} />
          <div className="relative max-w-4xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Crown className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>{isArabic ? "خطة الربح" : "Monetization Blueprint"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none mb-4" style={{ color: "var(--foreground)" }}>
              {isArabic ? "ابنِ مصادر دخل" : "Build Revenue"}
              <br />
              <span style={{ color: "#f5a623" }}>{isArabic ? "حول مجتمع CrossFire" : "Around CrossFire"}</span>
            </h1>
            <p className="text-sm md:text-base max-w-2xl mx-auto mb-8" style={{ color: "#666" }}>
              {isArabic
                ? "بدلاً من الاعتماد فقط على الإعلانات، يمكن للموقع تحقيق دخل من التجارة الموثوقة والأدوات المميزة والخدمات."
                : "Instead of relying on ads, earn from trusted commerce, premium tools, sponsored visibility, and player services."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/sellers" className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110" style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}>
                {isArabic ? "استعرض البائعين" : "Explore Sellers"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:border-[#f5a623] hover:text-[#f5a623]" style={{ background: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                {isArabic ? "كن شريكاً" : "Become a Partner"}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20 space-y-14">

          {/* ── Offer Cards ── */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => {
              const Icon = offer.icon;
              return (
                <div key={offer.title} className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: "rgba(245,166,35,0.12)", borderRadius: "3px" }}>
                      <Icon className="h-5 w-5" style={{ color: "#f5a623" }} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1" style={{ background: "rgba(245,166,35,0.1)", color: "#f5a623", borderRadius: "2px" }}>{offer.badge}</span>
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>{offer.title}</h3>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: "#666" }}>{offer.description}</p>
                  <div className="p-3 mb-4" style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "3px" }}>
                    <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: "#f5a623" }}>How it makes money</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#777" }}>{offer.monetization}</p>
                  </div>
                  <ul className="space-y-2">
                    {offer.operations.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px]" style={{ color: "#666" }}>
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: "#4ade80" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* ── Roadmap + Stack ── */}
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-5 md:p-6" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <div className="flex items-center gap-2 mb-5">
                <Target className="h-4 w-4" style={{ color: "#f5a623" }} />
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                  {isArabic ? "ترتيب التنفيذ المقترح" : "Recommended Rollout Order"}
                </h2>
              </div>
              <p className="text-[11px] mb-5" style={{ color: "#666" }}>
                {isArabic ? "ابدأ بالموجود حالياً ثم أضف الخدمات والأدوات الأعلى قيمة." : "Start with features that use the current stack, then add higher-value services and tools."}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {roadmap.map((step, i) => (
                  <div key={step.phase} className="p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5" style={{ background: "rgba(245,166,35,0.1)", color: "#f5a623", borderRadius: "2px" }}>{step.phase}</span>
                    <h3 className="mt-3 font-black text-xs uppercase tracking-tight mb-3" style={{ color: "var(--foreground)" }}>{step.title}</h3>
                    <ul className="space-y-2">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[11px]" style={{ color: "#666" }}>
                          <Gem className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: "#f5a623" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 md:p-6" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <div className="flex items-center gap-2 mb-5">
                <Link2 className="h-4 w-4" style={{ color: "#f5a623" }} />
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                  Already Supported
                </h2>
              </div>
              <p className="text-[11px] mb-4" style={{ color: "#666" }}>
                {isArabic ? "لديك بالفعل أساس قوي يمكن تحويله إلى باقات وخدمات أوضح." : "You already have strong building blocks ready to monetize."}
              </p>
              <div className="space-y-2">
                {[
                  { title: isArabic ? "صفحات البائعين + المراجعات" : "Seller pages + reviews", desc: isArabic ? "أساس للبائعين الموثوقين والباقات المميزة." : "Foundation for verified vendors and featured placements." },
                  { title: isArabic ? "الأخبار + الإيفينتات" : "Events + news engine", desc: isArabic ? "مناسبة للرعايات وصفحات الشركاء." : "Perfect for sponsored events and partner posts." },
                  { title: isArabic ? "الإدارة + الصفحات المخصصة" : "Admin + custom pages", desc: isArabic ? "لصفحات الهبوط والعروض المميزة." : "Useful for landing pages and premium offers." },
                  { title: isArabic ? "التحليلات" : "Analytics", desc: isArabic ? "تابع الزيارات والنقرات." : "Track seller views, clicks, and engagement." },
                ].map((item) => (
                  <div key={item.title} className="p-3" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}>
                    <p className="font-black text-[11px] uppercase tracking-tight mb-0.5" style={{ color: "var(--foreground)" }}>{item.title}</p>
                    <p className="text-[11px]" style={{ color: "#555" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Revenue Estimator ── */}
          <div className="p-5 md:p-6" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" style={{ color: "#f5a623" }} />
              <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Revenue Estimator</h2>
            </div>
            <p className="text-[11px] mb-6" style={{ color: "#666" }}>Change the assumptions to estimate monthly and yearly revenue potential from core monetization streams.</p>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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

              {/* ── Breakdown sidebar ── */}
              <div className="space-y-3 p-4" style={{ background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "3px" }}>
                <h3 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: "var(--foreground)" }}>Estimated Breakdown</h3>
                <div className="space-y-2 text-[12px]">
                  {[
                    { label: "Verified sellers", value: estimatedRevenue.sellersRevenue },
                    { label: "Boosting/coaching", value: estimatedRevenue.servicesRevenue },
                    { label: "Premium subscriptions", value: estimatedRevenue.premiumRevenue },
                    { label: "Affiliate commission", value: estimatedRevenue.affiliateRevenue },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "#666" }}>{row.label}</span>
                      <strong style={{ color: "var(--foreground)" }}>${row.value.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Monthly Total</span>
                    <strong className="text-lg font-black" style={{ color: "#f5a623" }}>${estimatedRevenue.monthlyTotal.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Yearly Total</span>
                    <strong style={{ color: "var(--foreground)" }}>${estimatedRevenue.yearlyTotal.toFixed(2)}</strong>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed pt-2" style={{ color: "#444" }}>
                  Tip: default values can be managed from Admin → Dashboard → Monetization Controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
