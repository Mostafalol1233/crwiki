import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { Mail, MessageSquare, Send, CheckCircle, ArrowRight } from "lucide-react";
import { SiDiscord, SiFacebook, SiWhatsapp, SiX } from "react-icons/si";
import { Link } from "wouter";

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    value: "contact@crossfire.wiki",
    desc: "Response within 24–48 hours",
    color: "#f5a623",
  },
  {
    icon: MessageSquare,
    title: "Support Ticket",
    value: "Official support system",
    desc: "Submit and track your request",
    color: "#818cf8",
    href: "/support",
  },
  {
    icon: Send,
    title: "WhatsApp Channel",
    value: "Join WhatsApp updates",
    desc: "News, alerts, and community support",
    color: "#25d366",
    href: WHATSAPP_CHANNEL_URL,
  },
];

const SOCIALS = [
  { href: WHATSAPP_CHANNEL_URL, icon: <SiWhatsapp className="h-5 w-5" />, label: "WhatsApp Channel", color: "#25d366" },
  { href: "https://discord.gg/7AbuDrNNJM", icon: <SiDiscord className="h-5 w-5" />, label: "Discord", color: "#5865f2" },
  { href: "https://www.facebook.com/crossfireonline", icon: <SiFacebook className="h-5 w-5" />, label: "Facebook", color: "#1877f2" },
  { href: "https://x.com/CrossFireOnline", icon: <SiX className="h-5 w-5" />, label: "Twitter / X", color: "#e0e0e0" },
];

export default function Contact() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("sending");
    try {
      const formData = new FormData();
      formData.append("title", `Contact: ${name}`);
      formData.append("description", message);
      formData.append("userName", name);
      formData.append("userEmail", email);
      formData.append("category", "contact");
      formData.append("priority", "normal");
      const base = (import.meta as any).env?.VITE_API_URL || "";
      const url = base ? `${base}/api/tickets` : "/api/tickets";
      const res = await fetch(url, { method: "POST", body: formData, credentials: "include" });
      if (res.ok) {
        setStatus("ok");
        setName(""); setEmail(""); setMessage("");
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        setStatus("err");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch {
      setStatus("err");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <>
      <PageSEO
        title="Contact — CrossFire Wiki"
        description="Get in touch with CrossFire Wiki — send us a message, ask questions, or provide feedback."
        canonicalPath="/contact"
      />

      <div className="min-h-screen py-14 md:py-20" style={{ background: "var(--background)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* ── Header ── */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-[1px] w-10" style={{ background: "linear-gradient(to left, #f5a623, transparent)" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Get In Touch</span>
              <div className="h-[1px] w-10" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3" style={{ color: "var(--foreground)" }}>
              {t("contactUs") || "Contact Us"}
            </h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#666" }}>
              Have a question, suggestion, or want to contribute? We'd love to hear from you.
            </p>
          </div>

          {/* ── Channel cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const inner = (
                <div
                  className="p-5 text-center h-full transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded mx-auto mb-3" style={{ background: `${ch.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: ch.color }} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-tight mb-1" style={{ color: "var(--foreground)" }}>{ch.title}</h3>
                  <p className="text-[11px] font-bold mb-1" style={{ color: ch.color }}>{ch.value}</p>
                  <p className="text-[11px]" style={{ color: "#555" }}>{ch.desc}</p>
                </div>
              );
              return ch.href ? (
                ch.href.startsWith("http") ? (
                  <a key={ch.title} href={ch.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>
                ) : (
                  <Link key={ch.title} href={ch.href}>{inner}</Link>
                )
              ) : (
                <div key={ch.title}>{inner}</div>
              );
            })}
          </div>

          {/* ── Main form + social ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            {/* Form */}
            <div
              className="p-6 md:p-8"
              style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
              <h2 className="text-lg font-black uppercase tracking-tight mb-5" style={{ color: "var(--foreground)" }}>
                {t("sendUsMessage") || "Send Us a Message"}
              </h2>

              {status === "ok" ? (
                <div className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3" style={{ color: "#4ade80" }} />
                  <p className="font-black text-sm uppercase tracking-wider mb-1" style={{ color: "#4ade80" }}>Message Sent!</p>
                  <p className="text-[12px]" style={{ color: "#666" }}>We'll get back to you within 24–48 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: "#888" }}>{t("name") || "Name"}</label>
                      <Input
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: "#888" }}>{t("email") || "Email"}</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: "#888" }}>{t("message") || "Message"}</label>
                    <Textarea
                      placeholder="Tell us what's on your mind..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      required
                      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)", resize: "vertical" }}
                    />
                  </div>

                  {status === "err" && (
                    <p className="text-[11px] font-bold" style={{ color: "#f87171" }}>Failed to send. Please try again or email us directly.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-60"
                    style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                  >
                    {status === "sending" ? "Sending…" : <>{t("submit") || "Send Message"} <ArrowRight className="h-3.5 w-3.5" /></>}
                  </button>
                </form>
              )}
            </div>

            {/* Social sidebar */}
            <div className="space-y-4">
              <div
                className="p-5"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
              >
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#f5a623" }}>Follow Us</h3>
                <div className="space-y-2">
                  {SOCIALS.map(({ href, icon, label, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 transition-all hover:-translate-y-0.5"
                      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}
                    >
                      <span style={{ color }}>{icon}</span>
                      <span className="text-[12px] font-bold" style={{ color: "#888" }}>{label}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div
                className="p-5"
                style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}
              >
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "#f5a623" }}>Need Support?</h3>
                <p className="text-[12px] mb-3" style={{ color: "#666" }}>For account issues, bugs, or ZP seller disputes, submit an official ticket.</p>
                <Link href="/support">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110"
                    style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                  >
                    Submit Ticket <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
