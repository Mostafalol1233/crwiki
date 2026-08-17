import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Search, ShieldAlert, Tag, Clock3, UserRound, ArrowRight } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSellerBrandAsset } from "@/lib/sellerBrandAssets";

interface ServiceListing {
  seller: string;
  profileUrl: string;
  service: string;
  serviceAr: string;
  price: string;
  age: string;
  confidence: "higher" | "limited" | "unverified";
  note: string;
  noteAr: string;
}

const listings: ServiceListing[] = [
  {
    seller: "GamesCF",
    profileUrl: "https://funpay.com/en/users/10548313/",
    service: "ZM4 stages 0–6 / stage progression",
    serviceAr: "مراحل ZM4 من 0 إلى 6 وتطوير التقدم",
    price: "Snapshot: 0–6 €45.50; 0–9 €262.13",
    age: "Offer snapshot observed about 2 years old",
    confidence: "higher",
    note: "Large review history and several positive CrossFire comments; reviews are not all ZM4-specific.",
    noteAr: "سجل مراجعات كبير وتعليقات إيجابية متعددة عن CrossFire، لكن ليست كل المراجعات خاصة بـ ZM4.",
  },
  {
    seller: "MOIRA20",
    profileUrl: "https://funpay.com/en/users/8286674/",
    service: "General ZM4 progress, cards, stages and weapons",
    serviceAr: "تقدم ZM4 والكروت والمراحل والأسلحة",
    price: "Snapshot: combined service €50.56",
    age: "Offer snapshot observed about 3 years old",
    confidence: "higher",
    note: "Strong general marketplace history, but confirm the exact current ZM4 deliverables before payment.",
    noteAr: "سجل قوي عموماً على المنصة، لكن يجب تأكيد تفاصيل خدمة ZM4 الحالية قبل الدفع.",
  },
  {
    seller: "PlayGamesMarket",
    profileUrl: "https://funpay.com/en/users/12993317/",
    service: "ZM4 stage progression",
    serviceAr: "تطوير مراحل ZM4",
    price: "Snapshot: stage 2–6 offers around €25–€35",
    age: "Offer snapshot observed about 2 years old",
    confidence: "limited",
    note: "Positive CrossFire comments were visible, but the listing is not a current price guarantee.",
    noteAr: "ظهرت تعليقات إيجابية عن CrossFire، لكن السعر الظاهر ليس ضماناً للسعر الحالي.",
  },
  {
    seller: "Xiaoda1",
    profileUrl: "https://funpay.com/en/users/11484926/",
    service: "ZM4 stages and card bundles",
    serviceAr: "مراحل ZM4 وحزم الكروت",
    price: "Snapshot: stage 1–5 $36.28; ZM cards $4.68",
    age: "Offer snapshot observed about 2 years old",
    confidence: "limited",
    note: "Small but positive review sample in the research snapshot; verify availability and currency.",
    noteAr: "عينة المراجعات صغيرة وإيجابية في لقطة البحث؛ تحقق من التوفر والعملة.",
  },
  {
    seller: "Antifarming",
    profileUrl: "https://funpay.com/en/users/20387228/",
    service: "ZM4 stages, Arena assistance and gems",
    serviceAr: "مراحل ZM4 ومساعدة Arena والجواهر",
    price: "Snapshot: stages 1–6 €64.36; stage 6 €31.60",
    age: "Offer snapshot observed about 2 months old",
    confidence: "limited",
    note: "Relatively recent listing, but the public review sample is very small. No endorsement is implied.",
    noteAr: "العرض أحدث نسبياً، لكن عينة المراجعات العامة صغيرة جداً. الإدراج لا يعني تزكية.",
  },
  {
    seller: "DrAllspark",
    profileUrl: "https://funpay.com/en/users/20710675/",
    service: "ZM4 stages and Arena assistance",
    serviceAr: "مراحل ZM4 ومساعدة Arena",
    price: "Snapshot: stages 1–6 €55.61; stage 6 €27.30",
    age: "Offer snapshot observed about 1 month old",
    confidence: "unverified",
    note: "Recent-looking offer with no public reviews in the snapshot; verify identity and terms carefully.",
    noteAr: "عرض يبدو حديثاً دون مراجعات عامة في اللقطة؛ تحقق من الهوية والشروط بعناية.",
  },
];

const localPath = (path: string, language: "en" | "ar") => language === "ar" ? `/ar${path}` : path;

export default function Services() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const isArabic = language === "ar";
  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => [listing.seller, listing.service, listing.serviceAr, listing.price].join(" ").toLowerCase().includes(q));
  }, [query]);

  const confidenceLabel = (confidence: ServiceListing["confidence"]) => {
    if (isArabic) return confidence === "higher" ? "إشارة أقوى نسبياً" : confidence === "limited" ? "دليل محدود" : "غير مثبت حالياً";
    return confidence === "higher" ? "Stronger market signal" : confidence === "limited" ? "Limited evidence" : "Not verified currently";
  };

  return (
    <>
      <PageSEO
        title={isArabic ? "خدمات CrossFire وZM4 | CrossFire Wiki" : "CrossFire & ZM4 Services | CrossFire Wiki"}
        description={isArabic ? "دليل معلوماتي لخدمات CrossFire وZM4 مع روابط المصدر والأسعار الظاهرة كلقطة زمنية." : "An informational directory of CrossFire and ZM4 services with source links and clearly dated snapshot prices."}
        canonicalPath="/services"
      />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/15 via-background to-amber-500/10">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 bg-background/60 text-primary">
                <Tag className="mr-2 h-3.5 w-3.5" /> {isArabic ? "دليل الخدمات" : "SERVICE DIRECTORY"}
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                {isArabic ? "خدمات CrossFire وZM4" : "CrossFire & ZM4 Services"}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {isArabic
                  ? "دليل منظم لخدمات المراحل والكروت والتقدم، مع هوية كل متجر ورابط ملفه الشخصي. الأسعار لقطات بحثية وليست عروضاً لحظية أو تزكية من CrossFire Wiki."
                  : "A structured directory for stage, card and progression services, with each storefront identity and profile link. Prices are research snapshots—not live quotes or endorsements by CrossFire Wiki."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild><Link href={localPath("/sellers", language)}>{isArabic ? "تصفح بائعي الكروت" : "Browse top-up sellers"}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild variant="outline"><a href="https://funpay.com/en/lots/257/" target="_blank" rel="noreferrer">{isArabic ? "فتح تصنيف FunPay" : "Open FunPay category"}<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/40 bg-card/70 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10">
              <div className="rounded-2xl border bg-background/70 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{isArabic ? "طريقة العرض" : "DIRECTORY FORMAT"}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{isArabic ? "هوية المتجر أولاً" : "Storefront-first discovery"}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{isArabic ? "كل بطاقة تعرض الشعار أو صورة الملف، نوع الخدمة، لقطة السعر، ووجهة التواصل المتاحة." : "Every card surfaces the logo or profile identity, service type, price snapshot, and the reachable contact destination."}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/60 p-3"><div className="text-xl font-black text-primary">{listings.length}</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{isArabic ? "ملفات" : "Profiles"}</div></div>
                  <div className="rounded-xl bg-muted/60 p-3"><div className="text-xl font-black text-primary">0</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{isArabic ? "عروض ميتة" : "Dead offers"}</div></div>
                  <div className="rounded-xl bg-muted/60 p-3"><div className="text-xl font-black text-primary">2</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{isArabic ? "لغات" : "Languages"}</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
          <div className="mb-7 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-bold">{isArabic ? "العروض المرصودة" : "Observed listings"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{isArabic ? "تحقق من العرض الأصلي قبل أي تواصل أو دفع." : "Always confirm the original listing before contacting or paying."}</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? "ابحث عن بائع أو خدمة..." : "Search seller or service..."} className="pl-9" />
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{isArabic ? "لا توجد نتائج مطابقة." : "No matching listings found."}</CardContent></Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => {
                const brand = getSellerBrandAsset(listing.seller);
                const initials = listing.seller.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <Card key={`${listing.seller}-${listing.profileUrl}`} className="group flex h-full flex-col overflow-hidden border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <div className={`relative overflow-hidden bg-gradient-to-br ${brand.accent} px-5 pb-5 pt-4`}>
                      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
                      <div className="relative flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-2 shadow-lg dark:bg-slate-950/80">
                          {brand.logoUrl ? <img src={brand.logoUrl} alt={`${listing.seller} logo`} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-xl font-black text-primary">{initials}</span>}
                        </div>
                        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/60">{isArabic ? "متجر الخدمة" : "Service storefront"}</p><h3 className="truncate text-xl font-black tracking-tight">{listing.seller}</h3><Badge variant="outline" className="mt-2 border-foreground/15 bg-background/60 text-[10px]">{isArabic ? "الملف متاح" : "Profile available"}</Badge></div>
                      </div>
                      {brand.gallery.length > 0 && <div className="relative mt-4 grid grid-cols-3 gap-2">{brand.gallery.slice(0, 3).map((image, idx) => <div key={`${image}-${idx}`} className="h-14 overflow-hidden rounded-lg border border-white/40 bg-black/10"><img src={image} alt={`${listing.seller} gallery ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" /></div>)}</div>}
                    </div>
                    <CardHeader className="space-y-2 pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg leading-6">{isArabic ? listing.serviceAr : listing.service}</CardTitle><Badge variant="secondary" className="shrink-0 text-[10px]">{confidenceLabel(listing.confidence)}</Badge></div><CardDescription className="leading-5">{isArabic ? listing.noteAr : listing.note}</CardDescription></CardHeader>
                    <CardContent className="flex-grow space-y-3 text-sm">
                      <div className="flex gap-2 rounded-xl border bg-muted/40 p-3"><Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{listing.price}</span></div>
                      <div className="flex gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" /><span>{listing.age}</span></div>
                      <p className="text-xs leading-5 text-muted-foreground">{isArabic ? "هذا دليل تعريفي؛ يتم فتح الملف الشخصي فقط لأن رابط العرض المباشر لم يعد مؤكداً." : "Directory entry only: the profile is shown, while no direct offer is published unless its live status is confirmed."}</p>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 p-4"><Button asChild className="w-full" size="sm"><a href={listing.profileUrl} target="_blank" rel="noreferrer"><UserRound className="mr-2 h-4 w-4" />{isArabic ? "فتح الملف الشخصي" : "Open seller profile"}<ExternalLink className="ml-auto h-3.5 w-3.5" /></a></Button></CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 md:px-8">
          <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="flex gap-4 p-5 md:p-6"><ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-amber-600" /><div><h2 className="font-bold">{isArabic ? "تنبيه قبل الشراء" : "Before you buy"}</h2><p className="mt-1 text-sm leading-7 text-muted-foreground">{isArabic ? "CrossFire Wiki لا يستلم الأموال ولا يضمن البائعين أو النتائج. افحص الرابط الأصلي، العملة، تفاصيل التسليم، سياسة الاسترجاع، وأمان الحساب. لا تشارك كلمة المرور أو رموز التحقق، ولا تعتمد على سعر قديم." : "CrossFire Wiki does not take payment and does not guarantee sellers or outcomes. Check the original listing, currency, delivery terms, refund policy and account safety. Never share your password or verification codes, and do not rely on an old snapshot price."}</p></div></CardContent></Card>
        </section>
      </main>
    </>
  );
}

