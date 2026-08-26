import { Download, Cpu, Zap, HardDrive, Monitor, CircleDot, CheckCircle2, Info, ArrowRight, ChevronRight } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";

export default function DownloadPage() {
  const { t, language } = useLanguage();
  const isArabic = language === "ar";
  const downloadUrl = "https://crossfire.z8games.com/download.html";
  const patchNotesUrl = "https://crossfire.z8games.com/news.html";

  const specs = [
    {
      category: "Processor (CPU)",
      icon: Cpu,
      color: "#f5a623",
      items: [
        { label: "Minimum", specs: ["AMD Athlon™ 64 X2 Dual Core 4600+ 2.4GHz", "Intel® Core™2 Duo T6400 2.0GHz"] },
        { label: "Recommended", specs: ["AMD Ryzen™ 3 1200 @ 3.1GHz (4 Cores)", "Intel® Core™ i5-3470 @ 3.20GHz (4 Cores)"] },
      ],
    },
    {
      category: "Memory (RAM)",
      icon: Zap,
      color: "#818cf8",
      items: [
        { label: "Minimum", specs: ["4 GB RAM"] },
        { label: "Recommended", specs: ["8 GB RAM"] },
      ],
    },
    {
      category: "Video Card",
      icon: Monitor,
      color: "#4ade80",
      items: [
        { label: "Minimum", specs: ["NVIDIA® GeForce® 9500 GT", "AMD Radeon™ HD 6450", "Intel® HD Graphics 3000"] },
        { label: "Recommended", specs: ["NVIDIA® GeForce® GT 630", "AMD Radeon™ HD 6570", "Intel® HD Graphics 6000"] },
      ],
    },
    {
      category: "Storage (HDD)",
      icon: HardDrive,
      color: "#fbbf24",
      items: [
        { label: "Required", specs: ["15 GB free disk space"] },
      ],
    },
    {
      category: "Operating System",
      icon: CircleDot,
      color: "#38bdf8",
      items: [
        { label: "Minimum", specs: ["Windows 7 / 8 / 10 (64-bit)"] },
      ],
    },
    {
      category: "DirectX® + Internet",
      icon: Zap,
      color: "#f43f5e",
      items: [
        { label: "DirectX", specs: ["DirectX® 9.0c or higher"] },
        { label: "Internet", specs: ["Cable / DSL or better"] },
      ],
    },
  ];

  const steps = [
    { n: "01", title: "Download Installer", titleAr: "تنزيل المثبت", desc: "Click the button below to get the official CrossFire West installer from Z8Games.", descAr: "اضغط الزر التالي للحصول على مثبت CrossFire West الرسمي من Z8Games." },
    { n: "02", title: "Run Setup", titleAr: "تشغيل التثبيت", desc: "Launch the installer and follow the on-screen instructions to install the game client.", descAr: "شغّل المثبت واتبع التعليمات الظاهرة لتثبيت عميل اللعبة." },
    { n: "03", title: "Create Account", titleAr: "إنشاء حساب", desc: "Register a free account on z8games.com or log in with an existing account.", descAr: "أنشئ حسابًا مجانيًا على z8games.com أو سجّل الدخول بحساب موجود." },
    { n: "04", title: "Play Now", titleAr: "ابدأ اللعب", desc: "Launch CrossFire, pick a mode, and join millions of players around the world.", descAr: "شغّل CrossFire واختر نمطًا وانضم إلى اللاعبين حول العالم." },
  ];
  const specCategoryAr: Record<string, string> = {
    "Processor (CPU)": "المعالج المركزي",
    "Memory (RAM)": "الذاكرة",
    "Video Card": "بطاقة الرسوميات",
    "Storage (HDD)": "التخزين",
    "Operating System": "نظام التشغيل",
    "DirectX® + Internet": "DirectX® والإنترنت",
  };

  return (
    <>
      <PageSEO
        title={isArabic ? "تنزيل CrossFire West ومتطلبات التشغيل | CrossFire Wiki" : "Download CrossFire West — System Requirements | CrossFire Wiki"}
        description={isArabic ? "تنزيل CrossFire West من Z8Games مع متطلبات التشغيل ودليل التثبيت وملاحظات التحديث." : "Download CrossFire West (crossfirewest) — the North American server by Z8Games. System requirements, installation guide, and latest patch notes."}
        canonicalPath="/download"
        schemaType="WebPage"
        schemaData={{ name: "CrossFire West Download", description: "Download CrossFire West", url: "/download" }}
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden py-14 md:py-20 text-center"
          style={{ background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,166,35,0.05) 0%, transparent 70%)" }} />
          <div className="relative max-w-4xl mx-auto px-6 md:px-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Download className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>
                {isArabic ? "العميل الرسمي من Z8Games" : "Z8Games · Official Client"}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-4" style={{ color: "var(--foreground)" }}>
              {isArabic ? <>تنزيل<br /><span style={{ color: "#f5a623" }}>CrossFire</span></> : <>Download<br /><span style={{ color: "#f5a623" }}>CrossFire</span></>}
            </h1>
            <p className="text-sm md:text-base max-w-xl mx-auto mb-8" style={{ color: "#777" }}>
              {isArabic ? "عميل CrossFire West الرسمي من Z8Games؛ خادم أمريكا الشمالية ومتاح للعب مجانًا." : "The official CrossFire West client by Z8Games — North American server, free to play, millions of players."}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-7 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
              >
                <Download className="h-4 w-4" /> {t("downloadNow") || "Download Now"}
              </a>
              <a
                href={patchNotesUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-7 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all hover:border-[#f5a623] hover:text-[#f5a623]"
                style={{ background: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px" }}
              >
                {isArabic ? "ملاحظات التحديث" : "Patch Notes"} <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 space-y-16">

          {/* ── Notice ── */}
          <div
            className="flex gap-4 items-start p-5"
            style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}
          >
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#f5a623" }} />
            <div>
              <p className="font-black text-sm uppercase tracking-tight mb-1" style={{ color: "#f5a623" }}>
                {isArabic ? "ملاحظة مهمة" : "Important Note"}
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#777" }}>
                {isArabic ? "يغطي هذا الموقع CrossFire West، خادم Z8Games الرسمي. نقدم أدلة للعبة ومعلومات عن الفعاليات وموارد للمجتمع، ولسنا تابعين لـSmilegate أو Z8Games ولا نوزع ملفات اللعبة أو تعديلات عليها." : "This wiki covers CrossFire West (crossfirewest) — the official Z8Games server. We provide game guides, event info, and community resources. We are not affiliated with Smilegate or Z8Games and do not distribute game files or modifications."}
              </p>
            </div>
          </div>

          {/* ── Steps ── */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, rgba(245,166,35,0.3), transparent)" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>
                {isArabic ? "البداية" : "Getting Started"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
              {isArabic ? "طريقة التثبيت" : "How to Install"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="p-5"
                  style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
                >
                  <div className="text-3xl font-black leading-none mb-3" style={{ color: "rgba(245,166,35,0.2)" }}>{step.n}</div>
                  <h3 className="font-black text-sm uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
                    {isArabic ? step.titleAr : step.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#666" }}>
                    {isArabic ? step.descAr : step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── System Requirements ── */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, rgba(245,166,35,0.3), transparent)" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>
                {isArabic ? "متطلبات الكمبيوتر" : "PC Requirements"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
              {isArabic ? "متطلبات التشغيل" : (t("systemRequirements") || "System Requirements")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {specs.map((spec, idx) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={idx}
                    className="p-5"
                    style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: `${spec.color}15` }}>
                        <Icon className="h-4 w-4" style={{ color: spec.color }} />
                      </div>
                      <h3 className="font-black text-[11px] uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                        {isArabic ? (specCategoryAr[spec.category] || spec.category) : spec.category}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {spec.items.map((item, i) => (
                        <div key={i}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: spec.color }}>{item.label}</p>
                          <ul className="space-y-1">
                            {item.specs.map((s, si) => (
                              <li key={si} className="flex items-start gap-2 text-[11px]" style={{ color: "#666" }}>
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: spec.color, opacity: 0.6 }} />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="relative text-center py-12" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #f5a623, transparent)" }} />
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3" style={{ color: "var(--foreground)" }}>
              {t("readyToJoin") || "Ready to Join the Fight?"}
            </h3>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "#666" }}>
              {t("readyToJoinDesc") || "Download CrossFire and join millions of players in intense FPS combat today."}
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
              style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
            >
              <Download className="h-4 w-4" /> {t("downloadCrossFire") || "Download CrossFire"}
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
