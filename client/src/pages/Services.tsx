import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Search, ShieldAlert, Tag, Clock3, UserRound, ArrowRight, Link2, Mail, Phone, MessageCircle } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSellerBrandAsset } from "@/lib/sellerBrandAssets";
import { getServiceListings } from "@/lib/supabaseApi";
import { getDefaultServiceListings, getListingContactLinks } from "../../../shared/services-directory.js";

interface ServiceListing {
  id?: string;
  seller: string;
  sellerSlug?: string;
  profileUrl: string;
  service: string;
  serviceAr: string;
  price: string;
  priceAr?: string;
  age: string;
  ageAr?: string;
  confidence: "higher" | "limited" | "unverified";
  note: string;
  noteAr: string;
  mediaUrl: string;
  gallery: string[];
  mediaSource: string;
  mediaSourceAr?: string;
  contacts: Record<string, string>;
  published?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

const localPath = (path: string, language: "en" | "ar") => language === "ar" ? `/ar${path}` : path;

function contactHref(key: string, value: string) {
  if (key === "email" && !value.startsWith("mailto:")) return `mailto:${value}`;
  if (key === "phone" && !value.startsWith("tel:")) return `tel:${value}`;
  return value;
}

function contactIcon(key: string) {
  if (key === "email") return <Mail className="h-3.5 w-3.5" />;
  if (key === "phone") return <Phone className="h-3.5 w-3.5" />;
  if (["whatsapp", "discord", "telegram"].includes(key)) return <MessageCircle className="h-3.5 w-3.5" />;
  return <Link2 className="h-3.5 w-3.5" />;
}

const AR_CONTACT_LABELS: Record<string, string> = {
  funpay: "FunPay",
  website: "الموقع",
  whatsapp: "واتساب",
  discord: "ديسكورد",
  telegram: "تيليجرام",
  facebook: "فيسبوك",
  twitter: "إكس / تويتر",
  instagram: "إنستغرام",
  youtube: "يوتيوب",
  tiktok: "تيك توك",
  email: "البريد الإلكتروني",
  phone: "الهاتف",
};

export default function Services() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<ServiceListing[]>(() => getDefaultServiceListings() as ServiceListing[]);
  const isArabic = language === "ar";

  useEffect(() => {
    let active = true;
    getServiceListings()
      .then((items) => { if (active && items.length > 0) setListings(items as ServiceListing[]); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => [listing.seller, listing.service, listing.serviceAr, listing.price, listing.priceAr, Object.values(listing.contacts || {}).join(" ")].join(" ").toLowerCase().includes(q));
  }, [listings, query]);

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
              <Badge variant="outline" className="mb-4 border-primary/30 bg-background/60 text-primary"><Tag className="mr-2 h-3.5 w-3.5" /> {isArabic ? "دليل الخدمات" : "SERVICE DIRECTORY"}</Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{isArabic ? "خدمات CrossFire وZM4" : "CrossFire & ZM4 Services"}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">{isArabic ? "دليل منظم لخدمات المراحل والكروت والتقدم، مع هوية كل متجر وروابط التواصل المتاحة. الأسعار لقطات بحثية وليست عروضاً لحظية أو تزكية من CrossFire Wiki." : "A structured directory for stage, card and progression services, with each storefront identity and every available contact channel. Prices are research snapshots—not live quotes or endorsements by CrossFire Wiki."}</p>
              <div className="mt-7 flex flex-wrap gap-3"><Button asChild><Link href={localPath("/sellers", language)}>{isArabic ? "تصفح بائعي الكروت" : "Browse top-up sellers"}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><a href="https://funpay.com/en/lots/257/" target="_blank" rel="noreferrer">{isArabic ? "فتح تصنيف FunPay" : "Open FunPay category"}<ExternalLink className="ml-2 h-4 w-4" /></a></Button></div>
            </div>
            <div className="rounded-3xl border border-white/40 bg-card/70 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10"><div className="rounded-2xl border bg-background/70 p-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{isArabic ? "طريقة العرض" : "DIRECTORY FORMAT"}</p><h2 className="mt-2 text-2xl font-black tracking-tight">{isArabic ? "هوية المتجر أولاً" : "Storefront-first discovery"}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{isArabic ? "كل بطاقة تعرض الشعار أو صورة الملف، نوع الخدمة، لقطة السعر، رابط FunPay، وأي موقع أو حساب اجتماعي أضافه المشرف." : "Every card surfaces the logo or profile identity, service type, price snapshot, FunPay profile, and any website or social account added by an administrator."}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-muted/60 p-3"><div className="text-xl font-black text-primary">{listings.length}</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{isArabic ? "ملفات" : "Profiles"}</div></div><div className="rounded-xl bg-muted/60 p-3"><div className="text-xl font-black text-primary">{listings.filter((listing) => getListingContactLinks(listing).length > 1).length}</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{isArabic ? "قنوات إضافية" : "Extra channels"}</div></div><div className="rounded-xl bg-muted/60 p-3"><div className="text-xl font-black text-primary">2</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{isArabic ? "لغات" : "Languages"}</div></div></div></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
          <div className="mb-7 grid gap-4 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="text-2xl font-bold">{isArabic ? "العروض المرصودة" : "Observed listings"}</h2><p className="mt-1 text-sm text-muted-foreground">{isArabic ? "تحقق من العرض الأصلي قبل أي تواصل أو دفع." : "Always confirm the original listing before contacting or paying."}</p></div><div className="relative w-full md:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? "ابحث عن بائع أو خدمة..." : "Search seller or service..."} className="pl-9" /></div></div>
          {filteredListings.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">{isArabic ? "لا توجد نتائج مطابقة." : "No matching listings found."}</CardContent></Card> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredListings.map((listing) => {
            const brand = getSellerBrandAsset(listing.seller);
            const initials = listing.seller.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
            const mediaGallery = brand.gallery.length > 0 ? brand.gallery : listing.gallery;
            const mediaLogo = brand.logoUrl || listing.mediaUrl;
            const mediaHero = mediaGallery[0] || listing.mediaUrl || mediaLogo;
            const heroIsProfile = Boolean(!mediaGallery[0] && mediaLogo);
            const contacts = getListingContactLinks({
              ...listing,
              contacts: {
                ...(listing.contacts || {}),
                website: listing.contacts?.website || brand.sourceUrl || '',
                ...(brand.contacts || {}),
              },
            });
            return <Card key={`${listing.id || listing.seller}-${listing.profileUrl}`} className="group flex h-full flex-col overflow-hidden border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className={`relative overflow-hidden bg-gradient-to-br ${brand.accent} px-5 pb-5 pt-4}`}><div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/25 blur-2xl" />{mediaHero && <div className="relative mb-4 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-slate-950/10 p-3 shadow-inner"><img src={mediaHero} alt={`${listing.seller} CrossFire service`} className={heroIsProfile ? "h-28 w-28 rounded-full object-cover ring-2 ring-white/30" : "max-h-44 w-full object-contain"} loading="lazy" /></div>}<div className="relative flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-2 shadow-lg dark:bg-slate-950/80">{mediaLogo ? <img src={mediaLogo} alt={`${listing.seller} logo`} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-xl font-black text-primary">{initials}</span>}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/60">{isArabic ? "متجر الخدمة" : "Service storefront"}</p><h3 className="truncate text-xl font-black tracking-tight">{listing.seller}</h3><Badge variant="outline" className="mt-2 border-foreground/15 bg-background/60 text-[10px]">{isArabic ? "الملف متاح" : "Profile available"}</Badge></div></div>{mediaGallery.length > 1 && <div className="relative mt-4 grid grid-cols-3 gap-2">{mediaGallery.slice(1, 4).map((image, idx) => <div key={`${image}-${idx}`} className="aspect-[4/3] overflow-hidden rounded-lg border border-white/40 bg-black/10 p-1"><img src={image} alt={`${listing.seller} CrossFire service artwork ${idx + 2}`} className="h-full w-full object-contain" loading="lazy" /></div>)}</div>}</div>
              <CardHeader className="space-y-2 pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg leading-6">{isArabic ? listing.serviceAr : listing.service}</CardTitle><Badge variant="secondary" className="shrink-0 text-[10px]">{confidenceLabel(listing.confidence)}</Badge></div><CardDescription className="leading-5">{isArabic ? listing.noteAr : listing.note}</CardDescription></CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm"><div className="flex gap-2 rounded-xl border bg-muted/40 p-3"><Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{isArabic && listing.priceAr ? listing.priceAr : listing.price}</span></div><div className="flex gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" /><span>{isArabic && listing.ageAr ? listing.ageAr : listing.age}</span></div><p className="text-xs leading-5 text-muted-foreground">{isArabic ? `الصورة المعروضة مأخوذة من الملف العام للبائع، وليست صورة عشوائية من تصنيفات CrossFire. لا توجد صورة مستقلة للعرض موثقة حالياً؛ راجع العرض الأصلي قبل التواصل.` : `The image shown comes from the public seller profile, not random CrossFire category artwork. No separate service image is currently verified; review the original listing before contacting the seller.`}</p><div className="flex flex-wrap gap-2 pt-1">{contacts.map((contact) => <a key={`${contact.key}-${contact.value}`} href={contactHref(contact.key, contact.value)} target={contact.key === "email" || contact.key === "phone" ? undefined : "_blank"} rel={contact.key === "email" || contact.key === "phone" ? undefined : "noreferrer"} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">{contactIcon(contact.key)}{isArabic ? AR_CONTACT_LABELS[contact.key] || contact.label : contact.label}</a>)}</div></CardContent>
              <CardFooter className="border-t bg-muted/20 p-4"><Button asChild className="w-full" size="sm"><a href={listing.profileUrl || listing.contacts?.funpay || "#"} target="_blank" rel="noreferrer"><UserRound className="mr-2 h-4 w-4" />{isArabic ? "فتح الملف الشخصي" : "Open seller profile"}<ExternalLink className="ml-auto h-3.5 w-3.5" /></a></Button></CardFooter>
            </Card>;
          })}</div>}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 md:px-8"><Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="flex gap-4 p-5 md:p-6"><ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-amber-600" /><div><h2 className="font-bold">{isArabic ? "تنبيه قبل الشراء" : "Before you buy"}</h2><p className="mt-1 text-sm leading-7 text-muted-foreground">{isArabic ? "CrossFire Wiki لا يستلم الأموال ولا يضمن البائعين أو النتائج. افحص الرابط الأصلي، العملة، تفاصيل التسليم، سياسة الاسترجاع، وأمان الحساب. لا تشارك كلمة المرور أو رموز التحقق، ولا تعتمد على سعر قديم." : "CrossFire Wiki does not take payment and does not guarantee sellers or outcomes. Check the original listing, currency, delivery terms, refund policy and account safety. Never share your password or verification codes, and do not rely on an old snapshot price."}</p></div></CardContent></Card></section>
      </main>
    </>
  );
}
