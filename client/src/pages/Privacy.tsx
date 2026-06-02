import { Link } from "wouter";
import { Shield, Eye, Lock, Mail, Cookie, UserCheck, ArrowLeft } from "lucide-react";
import PageSEO from "@/components/PageSEO";

const sections = [
  {
    icon: Eye,
    title: "Information We Collect",
    content: "We collect information you provide directly to us when you:",
    list: [
      "Create an account or submit support tickets",
      "Contact us through our support system",
      "Participate in community features",
      "Use our website and services",
    ],
  },
  {
    icon: Lock,
    title: "How We Use Your Information",
    content: "We use the information we collect to:",
    list: [
      "Provide, maintain, and improve our services",
      "Process and respond to support requests",
      "Send technical notices and support messages",
      "Monitor and analyze usage patterns and trends",
    ],
  },
  {
    icon: Shield,
    title: "Data Security",
    content: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. No method of transmission over the internet is 100% secure, but we strive to use commercially acceptable means.",
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    content: "We use cookies and similar technologies to enhance your experience. You can control cookie settings through your browser. We may use analytics services (Google Analytics) to understand how our website is used.",
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    content: "Depending on your location, you may have rights regarding your personal data:",
    list: [
      "Access to your personal information",
      "Correction of inaccurate information",
      "Deletion of your personal information",
      "Restriction or objection to processing",
      "Data portability",
    ],
  },
];

export default function Privacy() {
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
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </a>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <Shield className="h-7 w-7" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
              Privacy Policy
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>Last updated: March 26, 2026</p>
          </div>

          {/* Intro */}
          <div className="p-5 mb-8" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
              Your privacy matters to us. This page explains what data we collect, why we collect it, and the controls you have over your information.
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
              <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>Information Sharing</h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#777" }}>
                We do not sell or trade your personal information. We may share information when:
              </p>
              <ul className="space-y-1.5">
                {["Service providers who help operate our website", "Required by law or to protect our rights", "In connection with a business transfer"].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#666" }}>
                    <span style={{ color: "#f5a623", marginTop: "2px" }}>•</span>{i}
                  </li>
                ))}
              </ul>
            </div>

            {/* Children */}
            <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>Children's Privacy</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
                Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such data, we will delete it promptly.
              </p>
            </div>

            {/* Changes */}
            <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>Changes to This Policy</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
                We may update this Privacy Policy from time to time. We will notify you of changes by posting the new policy on this page and updating the "Last updated" date at the top.
              </p>
            </div>

            {/* Contact */}
            <div className="p-5" style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Mail className="h-4 w-4" style={{ color: "#f5a623" }} />
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Contact Us</h2>
              </div>
              <p className="text-sm mb-2" style={{ color: "#777" }}>Questions about this Privacy Policy?</p>
              <a href="mailto:contact@crossfire.wiki" className="text-sm font-bold" style={{ color: "#f5a623" }}>contact@crossfire.wiki</a>
            </div>
          </div>

          <div className="text-center pt-8 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "#444" }}>© 2026 CrossFire Wiki by Bimora Gaming. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
