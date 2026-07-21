import { Link } from "wouter";
import { Shield, Eye, Lock, Mail, Cookie, UserCheck, ArrowLeft } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";

export default function Privacy() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Eye,
      title: t("privSec1Title"),
      content: t("privSec1Desc"),
      list: [t("privSec1i1"), t("privSec1i2"), t("privSec1i3"), t("privSec1i4")],
    },
    {
      icon: Lock,
      title: t("privSec2Title"),
      content: t("privSec2Desc"),
      list: [t("privSec2i1"), t("privSec2i2"), t("privSec2i3"), t("privSec2i4")],
    },
    {
      icon: Shield,
      title: t("privSec3Title"),
      content: t("privSec3Desc"),
    },
    {
      icon: Cookie,
      title: t("privSec4Title"),
      content: t("privSec4Desc"),
    },
    {
      icon: UserCheck,
      title: t("privSec5Title"),
      content: t("privSec5Desc"),
      list: [t("privSec5i1"), t("privSec5i2"), t("privSec5i3"), t("privSec5i4"), t("privSec5i5")],
    },
  ];

  return (
    <>
      <PageSEO
        title="Privacy Policy — CrossFire Wiki"
        description="Learn how CrossFire Wiki collects, uses, and protects your data."
        canonicalPath="/privacy"
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
              <Shield className="h-7 w-7" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
              {t("privacyTitle")}
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>{t("privacyLastUpdated")}</p>
          </div>

          {/* Intro */}
          <div className="p-5 mb-8" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
              {t("privacyIntro")}
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
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#777" }}>{sec.content}</p>
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

            {/* Sharing */}
            <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>{t("privSec6Title")}</h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#777" }}>
                {t("privSec6Desc")}
              </p>
              <ul className="space-y-1.5">
                {[t("privSec6i1"), t("privSec6i2"), t("privSec6i3")].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#666" }}>
                    <span style={{ color: "#f5a623", marginTop: "2px" }}>•</span>{i}
                  </li>
                ))}
              </ul>
            </div>

            {/* Children */}
            <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>{t("privSec7Title")}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
                {t("privSec7Desc")}
              </p>
            </div>

            {/* Changes */}
            <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>{t("privSec8Title")}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
                {t("privSec8Desc")}
              </p>
            </div>

            {/* Contact */}
            <div className="p-5" style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Mail className="h-4 w-4" style={{ color: "#f5a623" }} />
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>{t("contactUs")}</h2>
              </div>
              <p className="text-sm mb-2" style={{ color: "#777" }}>{t("privacyQuestionsText")}</p>
              <a href="mailto:contact@crossfire.wiki" className="text-sm font-bold" style={{ color: "#f5a623" }}>contact@crossfire.wiki</a>
            </div>
          </div>

          <div className="text-center pt-8 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "#444" }}>{t("privacyCopyrightLine")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
