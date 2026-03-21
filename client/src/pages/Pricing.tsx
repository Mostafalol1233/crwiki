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
import { useLanguage } from "@/components/LanguageProvider";

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
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const offers = isArabic ? [
    {
      icon: ShieldCheck,
      title: "المتاجر الموثوقة",
      badge: "جاهز للتشغيل",
      description: "حوّل قسم البائعين الحالي إلى قناة تجارية موثوقة مع شارات توثيق، وترتيب أفضل، وصفحات أغنى بالمحتوى والتقييمات.",
      monetization: "فرض اشتراك شهري أو رسوم ظهور مميز أو باقات ترويج للبائعين المعتمدين وشركاء الشحن.",
      operations: ["اعتماد البائعين وترتيبهم من لوحة الإدارة", "بيع مساحات ظهور مميز", "قياس النقرات والتفاعل والمراجعات"],
    },
    {
      icon: Swords,
      title: "طلبات البوستينج والتدريب",
      badge: "طلب مرتفع",
      description: "أضف نماذج واضحة لطلبات رفع الرتبة أو التدريب أو تجهيز السكريم مع إدارة الطلبات من الموقع بدل الرسائل العشوائية.",
      monetization: "أخذ عمولة من كل طلب ناجح أو بيع ترتيب أولوية للمدربين المميزين.",
      operations: ["استقبال تفاصيل الطلب والمهلة", "إدارة الإسناد والمتابعة من الأدمن", "تأكيد الإنجاز قبل إنهاء الطلب"],
    },
    {
      icon: Crown,
      title: "عضوية ويكي مميزة",
      badge: "دخل متكرر",
      description: "قدّم محتوى حصرياً مثل تحليلات متقدمة، وأدوات مقارنة، وتسريبات منظمة، وأدلة احترافية للمشتركين فقط.",
      monetization: "اشتراك شهري منخفض مقابل أدوات ومحتوى حصري بدون إزعاج.",
      operations: ["حجب محتوى محدد للأعضاء", "حزم تنبيهات وأدوات خاصة", "صفحات مخصصة للعروض والباقات"],
    },
    {
      icon: ShoppingBag,
      title: "روابط أفلييت للأدوات والشحن",
      badge: "تنفيذ سريع",
      description: "أضف عروضاً مرتبطة بالمحتوى مثل ماوسات اللاعبين، الكيبوردات، السماعات أو بطاقات الشحن.",
      monetization: "عمولة على الشراء بدون تكلفة إضافية على اللاعب.",
      operations: ["ويدجتات مخصصة داخل الصفحات", "تقسيم حسب نوع اللاعب", "قياس معدل النقر والتحويل"],
    },
    {
      icon: Trophy,
      title: "رعاية الكلانات والفعاليات",
      badge: "نمو العلامة",
      description: "استخدم الأخبار والإيفينتات لبيع ظهور مدفوع للبطولات، والكلانات، وشركاء المجتمع.",
      monetization: "باقات رعاية، وظهور في الصفحة الرئيسية، وصفحات هبوط مخصصة.",
      operations: ["بطاقات فعاليات ممولة", "تقارير أداء للشركاء", "إبراز الشركاء في الأخبار والفعاليات"],
    },
    {
      icon: Wrench,
      title: "أدوات برمجية وبيانات",
      badge: "تقني",
      description: "ابنِ أدوات مثل حاسبة الضرر، وتخطيط الخرائط، ولوحات الأداء، وواجهات API للكلانات وصناع المحتوى.",
      monetization: "اشتراك مميز أو API مدفوعة أو أدوات خاصة قابلة للترخيص.",
      operations: ["إطلاق الأدوات كخدمات مدفوعة", "واجهات API للمشتركين", "صفحات مخصصة للأدوات عبر Custom Pages"],
    },
  ] : offers;
  const roadmap = isArabic ? [
    { phase: "المرحلة 1", title: "استثمار الموجود حالياً", items: ["إبراز البائعين الموثوقين", "إضافة باقات ظهور مميز", "إدخال ويدجتات أفلييت في الصفحات المهمة"] },
    { phase: "المرحلة 2", title: "خدمات الطلبات", items: ["نماذج بوستينج وتدريب", "إدارة الإسناد والمتابعة", "البدء في العمولات"] },
    { phase: "المرحلة 3", title: "الأدوات المميزة", items: ["أدلة وآلات حاسبة", "تنبيهات وأدوات للأعضاء", "وصول بيانات وواجهات API"] },
  ] : roadmap;
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
        </div>
      </div>
    </>
  );
}
