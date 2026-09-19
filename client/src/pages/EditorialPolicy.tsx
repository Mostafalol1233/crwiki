import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";
import { Link } from "wouter";
import { ShieldCheck, FileSearch, RefreshCw, Scale, Users, AlertTriangle } from "lucide-react";

export default function EditorialPolicy() {
  const { language } = useLanguage();
  const ar = language === "ar";
  return (
    <>
      <PageSEO
        title={ar ? "سياسة التحرير — CrossFire Wiki" : "Editorial Policy — CrossFire Wiki"}
        description={ar ? "كيف نتحقق من معلومات CrossFire وننشرها في CrossFire Wiki." : "How CrossFire Wiki verifies and publishes CrossFire information."}
        canonicalPath="/editorial-policy"
      />
      <div className="min-h-screen py-12 md:py-16" style={{ background: "var(--background)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#f5a623" }}>
            ← {ar ? "الرئيسية" : "Home"}
          </Link>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--foreground)" }}>
            {ar ? "سياسة التحرير" : "Editorial Policy"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#888" }}>
            {ar ? "آخر تحديث: مايو 2026 — مشروع مجتمعي مستقل، غير تابع لـ Smilegate أو Z8Games." : "Last updated: May 2026 — Independent community project, not affiliated with Smilegate or Z8Games."}
          </p>

          {[
            {
              icon: ShieldCheck,
              title: ar ? "1. المبدأ" : "1. Principle",
              body: ar
                ? "CrossFire Wiki مرجع مستقل. ننشر المعلومة الموثقة فقط، ونفرّق بوضوح بين المعلومة المؤكدة والمعلومة المجتمعية غير المؤكدة."
                : "CrossFire Wiki is an independent reference. We publish verified information only and clearly distinguish verified facts from unverified community submissions.",
            },
            {
              icon: FileSearch,
              title: ar ? "2. المصادر" : "2. Sources",
              body: ar
                ? "المصدر الأساسي هو موقع وإعلانات CrossFire الرسمية (Z8Games) وملفات اللعبة. كل صفحة بيانات تدعم رابط المصدر وتاريخ التحقق."
                : "Primary sources are the official CrossFire website, announcements (Z8Games) and game files. Every database page supports source URL and verification date.",
            },
            {
              icon: RefreshCw,
              title: ar ? "3. التحقق والتحديث" : "3. Verification & Updates",
              body: ar
                ? "قبل النشر نتأكد من: العنوان، الوصف، الرابط (slug)، الصورة، وتاريخ الإصدار. الصفحات الناقصة لا تُفهرس حتى تكتمل."
                : "Before publishing we check: title, description, slug, image and release date. Thin pages stay noindex until complete.",
            },
            {
              icon: Scale,
              title: ar ? "4. عدم التلفيق" : "4. No Fabrication",
              body: ar
                ? "لا نخترع إحصائيات أسلحة أو تواريخ إيفنتات أو توفر إقليمي. إذا كانت المعلومة غير متوفرة نكتب \"البيانات غير متوفرة\" بدل التخمين."
                : 'We never fabricate weapon stats, event dates or regional availability. When data is unavailable we show "Data unavailable" rather than guessing.',
            },
            {
              icon: Users,
              title: ar ? "5. مساهمات المجتمع" : "5. Community Contributions",
              body: ar
                ? "المساهمات تُراجع يدوياً قبل النشر. نحتفظ بسجل المصدر وتاريخ الاستيراد وحالة التحقق لكل عنصر."
                : "Community contributions are human-reviewed before publishing. We track source, import date and verification status for every item.",
            },
            {
              icon: AlertTriangle,
              title: ar ? "6. التصحيح" : "6. Corrections",
              body: ar
                ? "لو وجدت خطأ، راسلنا عبر /contact أو /support. نصحح خلال 48 ساعة ونذكر تاريخ التحديث في الصفحة."
                : "Found an error? Contact us via /contact or /support. We correct within 48 hours and show the updated date on the page.",
            },
          ].map((s) => (
            <div key={s.title} className="flex gap-4 mb-8 p-5" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
              <s.icon className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: "#f5a623" }} />
              <div>
                <h2 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>{s.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{s.body}</p>
              </div>
            </div>
          ))}

          <div className="text-sm p-4" style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 6, color: "#f5a623" }}>
            {ar ? "CrossFire Wiki مشروع مستقل — لا يوحي بأي ارتباط رسمي بالناشر." : "CrossFire Wiki is an independent fan project — no official publisher affiliation is implied."}
          </div>
        </div>
      </div>
    </>
  );
}
