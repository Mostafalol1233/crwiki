import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";
import { Link } from "wouter";
import { Link2, Calendar, Shield, Archive, Mic, Image as ImageIcon } from "lucide-react";

export default function Sources() {
  const { language } = useLanguage();
  const ar = language === "ar";
  return (
    <>
      <PageSEO
        title={ar ? "المصادر — CrossFire Wiki" : "Sources — CrossFire Wiki"}
        description={ar ? "مصادر معلومات CrossFire Wiki وكيف نوثقها." : "How CrossFire Wiki sources and verifies CrossFire information."}
        canonicalPath="/sources"
      />
      <div className="min-h-screen py-12 md:py-16" style={{ background: "var(--background)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#f5a623" }}>
            ← {ar ? "الرئيسية" : "Home"}
          </Link>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--foreground)" }}>
            {ar ? "المصادر" : "Sources"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#888" }}>
            {ar ? "كل معلومة في CrossFire Wiki لها مصدر. هذه أنواع المصادر التي نعتمدها." : "Every fact on CrossFire Wiki has a source. These are the source types we rely on."}
          </p>

          {[
            {
              icon: Link2,
              title: ar ? "الإعلانات الرسمية" : "Official Announcements",
              desc: ar ? "مصدر أساسي — إعلانات Z8Games والمنتدى الرسمي." : "Primary source — Z8Games announcements and official forum.",
              example: "https://forum.z8games.com/categories/crossfire-announcements",
            },
            {
              icon: Shield,
              title: ar ? "الموقع الرسمي" : "Official Website",
              desc: ar ? "صفحات crossfire.z8games.com الرسمية." : "Pages on crossfire.z8games.com.",
              example: "https://crossfire.z8games.com/characters.html",
            },
            {
              icon: ImageIcon,
              title: ar ? "ملفات اللعبة" : "Game Files",
              desc: ar ? "صور وأصوات مستخرجة مباشرة من مجلد اللعبة (قراءة فقط)." : "Images and sounds extracted read-only from the game folder.",
              example: "rez/Snd2 — extracted voice lines",
            },
            {
              icon: Calendar,
              title: ar ? "ملاحظات التحديث" : "Patch Notes",
              desc: ar ? "سجل التغييرات الرسمي لكل تحديث." : "Official changelog for each update.",
              example: "Updates & Events archive",
            },
            {
              icon: Archive,
              title: ar ? "الأرشيف واللقطات" : "Archive & Screenshots",
              desc: ar ? "لقطات من اللعبة وأرشيف إعلانات قديمة." : "In-game screenshots and archived announcements.",
              example: "Event screenshots, rank tables",
            },
            {
              icon: Mic,
              title: ar ? "توثيق المجتمع (مراجع)" : "Community Documentation (Reviewed)",
              desc: ar ? "معلومات مجتمعية ننشرها فقط بعد المراجعة اليدوية ووضع علامة \"غير موثق\" حتى التأكيد." : "Community info published only after human review and marked unverified until confirmed.",
              example: "Wiki contributions, fan databases",
            },
          ].map((s) => (
            <div key={s.title} className="flex gap-4 mb-6 p-5" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
              <s.icon className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: "#f5a623" }} />
              <div>
                <h2 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>{s.title}</h2>
                <p className="text-sm leading-relaxed mb-1" style={{ color: "#888" }}>{s.desc}</p>
                <p className="text-xs break-all" style={{ color: "#666" }}>{s.example}</p>
              </div>
            </div>
          ))}

          <div className="text-sm p-4" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#888" }}>
            {ar ? "كل صفحة بيانات تعرض: المصدر، تاريخ التحقق، وآخر تحديث — حيثما توفر." : "Every database page shows where possible: source, last verified and last updated."}
          </div>
        </div>
      </div>
    </>
  );
}
