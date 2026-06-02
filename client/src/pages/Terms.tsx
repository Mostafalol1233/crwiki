import { Link } from "wouter";
import { FileText, Shield, Users, Mail, Gavel, AlertTriangle, ArrowLeft } from "lucide-react";
import PageSEO from "@/components/PageSEO";

const sections = [
  {
    icon: Shield,
    title: "Acceptance of Terms",
    content: "By accessing and using CrossFire Wiki (crossfire.wiki), you accept and agree to be bound by the terms of this agreement. If you do not agree, please do not use this service.",
  },
  {
    icon: Users,
    title: "User Responsibilities",
    list: [
      "Provide accurate and truthful information when creating accounts or submitting content",
      "Respect intellectual property rights of others",
      "Not engage in harassment, spam, or abusive behavior",
      "Follow CrossFire's terms of service and community guidelines",
      "Not attempt to circumvent security measures or access restricted areas",
    ],
  },
  {
    icon: Gavel,
    title: "Content Guidelines",
    content: "All content on CrossFire Wiki must adhere to the following:",
    list: [
      "Content must be relevant to CrossFire gaming",
      "No hate speech, discrimination, or offensive material",
      "Respect copyright and fair use policies",
      "Provide accurate information to the best of your ability",
      "Credit sources when applicable",
    ],
  },
  {
    icon: FileText,
    title: "Intellectual Property",
    content: "CrossFire Wiki content is protected by copyright and trademark laws. CrossFire® is a registered trademark of Smilegate. All game-related content, images, and materials belong to their respective owners. CrossFire Wiki provides informational content for educational purposes only.",
  },
  {
    icon: AlertTriangle,
    title: "Disclaimer",
    content: "The information provided on CrossFire Wiki is for general informational purposes only. While we strive for accuracy, we cannot guarantee the completeness or timeliness of information. Use of this website is at your own risk.",
  },
  {
    icon: FileText,
    title: "Changes to Terms",
    content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this page. Your continued use of the service constitutes acceptance of the modified terms.",
  },
];

export default function Terms() {
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
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </a>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <FileText className="h-7 w-7" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
              Terms of Service
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>Last updated: March 26, 2026</p>
          </div>

          {/* Intro */}
          <div className="p-5 mb-8" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
              These terms explain your rights and responsibilities when using CrossFire Wiki. By continuing to browse, register, or submit content, you agree to follow this policy.
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
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Contact Us</h2>
              </div>
              <p className="text-sm mb-2" style={{ color: "#777" }}>Questions about these Terms of Service?</p>
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
