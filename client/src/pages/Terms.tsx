import { Link } from "wouter";
import { FileText, Shield, Users, Mail, Gavel, AlertTriangle, ArrowLeft } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";

export default function Terms() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Shield,
      title: t("termsSec1Title"),
      content: t("termsSec1Desc"),
    },
    {
      icon: Users,
      title: t("termsSec2Title"),
      list: [t("termsSec2i1"), t("termsSec2i2"), t("termsSec2i3"), t("termsSec2i4"), t("termsSec2i5")],
    },
    {
      icon: Gavel,
      title: t("termsSec3Title"),
      content: t("termsSec3Desc"),
      list: [t("termsSec3i1"), t("termsSec3i2"), t("termsSec3i3"), t("termsSec3i4"), t("termsSec3i5")],
    },
    {
      icon: FileText,
      title: t("termsSec4Title"),
      content: t("termsSec4Desc"),
    },
    {
      icon: AlertTriangle,
      title: t("termsSec5Title"),
      content: t("termsSec5Desc"),
    },
    {
      icon: FileText,
      title: t("termsSec6Title"),
      content: t("termsSec6Desc"),
    },
  ];

  return (
    <>
      <PageSEO
        title="Terms of Service — CrossFire Wiki"
        description="Read the CrossFire Wiki terms of service and usage guidelines."
        canonicalPath="/terms"
      />
      <div className="min-h-screen py-12 md:py-16" style={{ background: "var(--background)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8">

          {/* Back */}
          <Link href="/">
            <a className="inline-flex items-center gap-2 mb-8 text-[11px] font-black uppercase tracking-wider transition-opacity hover:opacity-80" style={{ color: "#555" }}>
              <ArrowLeft className="h-3.5 w-3.5" /> {t("backToHome")}
            </a>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <FileText className="h-7 w-7" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
              {t("termsTitle")}
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>{t("termsLastUpdated")}</p>
          </div>

          {/* Intro */}
          <div className="p-5 mb-8" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
              {t("termsIntro")}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <div key={sec.title} className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "#f5a623" }} />
                    <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>{sec.title}</h2>
                  </div>
                  {sec.content && (
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#777" }}>{sec.content}</p>
                  )}
                  {sec.list && (
                    <ul className="space-y-1.5">
                      {sec.list.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[12px]" style={{ color: "#666" }}>
                          <span style={{ color: "#f5a623", marginTop: "2px" }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* Contact */}
            <div className="p-5" style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Mail className="h-4 w-4" style={{ color: "#f5a623" }} />
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>{t("contactUs")}</h2>
              </div>
              <p className="text-sm mb-2" style={{ color: "#777" }}>{t("termsQuestionsText")}</p>
              <a href="mailto:contact@crossfire.wiki" className="text-sm font-bold" style={{ color: "#f5a623" }}>contact@crossfire.wiki</a>
            </div>
          </div>

          <div className="text-center pt-8 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "#444" }}>{t("termsCopyrightLine")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
