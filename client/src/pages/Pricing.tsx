import PageSEO from "@/components/PageSEO";
import {
  ExternalLink, ShieldCheck, Zap, Star, Gift, ChevronRight, Copy, Check,
  ShoppingBag, Users, CreditCard, Globe, Sword, Shirt, Package, Rocket,
  Flame, TrendingUp, Lock, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const ZP_PACKAGES = [
  { zp: "400",    price: "$5",   bonus: "",           popular: false },
  { zp: "800",    price: "$10",  bonus: "+100 ZP",    popular: false },
  { zp: "2,000",  price: "$20",  bonus: "+300 ZP",    popular: false },
  { zp: "5,500",  price: "$50",  bonus: "+700 ZP",    popular: true  },
  { zp: "11,500", price: "$100", bonus: "+1,500 ZP",  popular: false },
  { zp: "20,000", price: "$200", bonus: "+3,000 ZP",  popular: false },
];

const TOP_UP_METHODS = [
  {
    name: "Z8Games Official Store",
    url: "https://www.z8games.com/",
    desc: "Buy directly from Smilegate — the safest and most reliable source.",
    badge: "Official",
    badgeOk: true,
    Icon: ShieldCheck,
    internal: false,
  },
  {
    name: "CrossFire Wiki Sellers",
    url: "/sellers",
    desc: "Community-reviewed sellers with verified track records and buyer feedback.",
    badge: "Community",
    badgeOk: false,
    Icon: Users,
    internal: true,
  },
  {
    name: "PaymentWall",
    url: "https://www.paymentwall.com/",
    desc: "Cards, e-wallets, and local payment options across 200+ countries.",
    badge: "Multi-method",
    badgeOk: false,
    Icon: CreditCard,
    internal: false,
  },
  {
    name: "G2G Marketplace",
    url: "https://www.g2g.com/categories/crossfire-zp",
    desc: "Third-party marketplace for ZP top-ups and account services.",
    badge: "Marketplace",
    badgeOk: false,
    Icon: Globe,
    internal: false,
  },
];

const ZP_USES = [
  { item: "Permanent Weapons",  cost: "From 6,900 ZP",  Icon: Sword,     desc: "Unlock powerful weapons permanently." },
  { item: "Character Skins",    cost: "From 2,900 ZP",  Icon: Shirt,     desc: "Exclusive appearance customization." },
  { item: "VVIP Weapons",       cost: "From 29,000 ZP", Icon: Star,      desc: "Permanent weapons with special effects." },
  { item: "Crate Keys",         cost: "From 99 ZP/key", Icon: Package,   desc: "Unlock mystery crates for rare items." },
  { item: "GP Boosts",          cost: "From 500 ZP",    Icon: Rocket,    desc: "Earn GP faster, unlock free rewards." },
  { item: "Special Ammo",       cost: "From 200 ZP",    Icon: Flame,     desc: "Explosive, incendiary and special ammo." },
  { item: "Black Market",       cost: "Varies",         Icon: TrendingUp, desc: "Limited-time exclusive spinning items." },
  { item: "Mercenary Rentals",  cost: "From 1,000 ZP",  Icon: ShoppingBag, desc: "Rent premium mercenaries for 7–30 days." },
];

const PROMO_CODES = [
  { code: "CFWIKI2026", desc: "Follow CrossFire social media for active promos", platform: "Z8Games" },
  { code: "DISCORD2026", desc: "Join our Discord for exclusive code drops", platform: "Discord" },
  { code: "CFNEWS", desc: "Subscribe to the newsletter for seasonal bonuses", platform: "Newsletter" },
];

const GOLD = "#d4a017";
const GOLD_DIM = "rgba(212,160,23,0.15)";
const GOLD_BORDER = "rgba(212,160,23,0.2)";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Copy code"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
        fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", borderRadius: 4, cursor: "pointer",
        background: copied ? "rgba(74,222,128,0.1)" : GOLD_DIM,
        color: copied ? "#4ade80" : GOLD,
        border: `1px solid ${copied ? "rgba(74,222,128,0.25)" : GOLD_BORDER}`,
        transition: "all 0.15s",
        fontFamily: "'SF Mono', 'Fira Code', monospace",
      }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {code}
    </button>
  );
}

export default function PricingPage() {
  const isArabic = typeof window !== "undefined" && (document.documentElement.lang === "ar" || localStorage.getItem("lang") === "ar");

  return (
    <>
      <PageSEO
        title="CrossFire ZP Prices & Top-Up Guide — CrossFire Wiki"
        description="Complete guide to CrossFire ZP packages, top-up methods, what ZP buys you, and trusted community sellers."
        canonicalPath="/pricing"
      />

      <div className="min-h-screen" style={{ background: "hsl(var(--background))" }} dir={isArabic ? "rtl" : "ltr"}>

        {/* Hero */}
        <div style={{ borderBottom: `1px solid ${GOLD_BORDER}`, padding: "72px 24px 64px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 20,
              background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, marginBottom: 24,
            }}>
              <Zap size={12} style={{ color: GOLD }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase" }}>
                ZP Pricing Guide
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Cinzel', serif", fontWeight: 400, fontSize: "clamp(2rem, 5vw, 3.2rem)",
              letterSpacing: "0.08em", color: "hsl(var(--foreground))", lineHeight: 1.15, marginBottom: 18,
            }}>
              CrossFire<br />
              <span style={{ color: GOLD }}>ZP Packages</span>
            </h1>

            <p style={{ fontSize: 15, color: "hsl(var(--muted-foreground))", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
              Everything you need — prices, what to spend on, and where to top up safely.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>

          {/* ZP Packages */}
          <section style={{ marginBottom: 80 }}>
            <SectionHeader icon={<ShoppingBag size={16} />} label="ZP Package Prices" sub="USD (approximate)" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="zp-grid">
              {ZP_PACKAGES.map((pkg) => (
                <div key={pkg.zp} style={{
                  position: "relative", padding: "24px 20px",
                  background: pkg.popular ? "rgba(212,160,23,0.04)" : "hsl(var(--card))",
                  border: `1px solid ${pkg.popular ? "rgba(212,160,23,0.35)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 8, transition: "border-color 0.2s",
                }}>
                  {pkg.popular && (
                    <div style={{
                      position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                      background: GOLD, color: "#09090b", fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 10,
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {pkg.zp}
                    </div>
                    <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2, letterSpacing: "0.06em" }}>
                      ZEN POINTS
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--foreground))" }}>{pkg.price}</span>
                    {pkg.bonus && (
                      <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
                        +{pkg.bonus} bonus
                      </span>
                    )}
                  </div>

                  <a href="https://www.z8games.com/" target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "9px 0", borderRadius: 5, fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.08em", textDecoration: "none", transition: "opacity 0.15s",
                      background: pkg.popular ? GOLD : "rgba(255,255,255,0.05)",
                      color: pkg.popular ? "#09090b" : "hsl(var(--muted-foreground))",
                    }}>
                    Buy on Z8Games <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
              Prices are approximate and may vary by region. Always verify on the official Z8Games store.
            </p>
          </section>

          {/* Where to top up */}
          <section style={{ marginBottom: 80 }}>
            <SectionHeader icon={<ShieldCheck size={16} />} label="Where to Top Up" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="methods-grid">
              {TOP_UP_METHODS.map((m) => (
                <div key={m.name} style={{
                  padding: "20px 22px", background: "hsl(var(--card))",
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
                  display: "flex", gap: 16, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: m.badgeOk ? "rgba(74,222,128,0.08)" : GOLD_DIM,
                    border: `1px solid ${m.badgeOk ? "rgba(74,222,128,0.2)" : GOLD_BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <m.Icon size={18} style={{ color: m.badgeOk ? "#4ade80" : GOLD }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--foreground))", margin: 0 }}>{m.name}</h3>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "2px 7px", borderRadius: 3,
                        background: m.badgeOk ? "rgba(74,222,128,0.1)" : GOLD_DIM,
                        color: m.badgeOk ? "#4ade80" : GOLD,
                      }}>{m.badge}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: "0 0 10px", lineHeight: 1.5 }}>{m.desc}</p>
                    {m.internal ? (
                      <Link href={m.url}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: GOLD, cursor: "pointer" }}>
                          Visit Sellers <ChevronRight size={12} />
                        </span>
                      </Link>
                    ) : (
                      <a href={m.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: GOLD, textDecoration: "none" }}>
                        Visit Site <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What ZP buys */}
          <section style={{ marginBottom: 80 }}>
            <SectionHeader icon={<Star size={16} />} label="What Can ZP Buy?" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="uses-grid">
              {ZP_USES.map((item) => (
                <div key={item.item} style={{
                  padding: "18px 16px", background: "hsl(var(--card))",
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, marginBottom: 12,
                    background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <item.Icon size={16} style={{ color: GOLD }} />
                  </div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))", margin: "0 0 4px", letterSpacing: "0.04em" }}>
                    {item.item}
                  </h3>
                  <p style={{ fontSize: 11, fontWeight: 600, color: GOLD, margin: "0 0 6px" }}>{item.cost}</p>
                  <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Promo codes */}
          <section style={{ marginBottom: 80 }}>
            <SectionHeader icon={<Gift size={16} />} label="Promo Codes & Free ZP" />

            <div style={{
              background: "hsl(var(--card))", border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 8, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: 0 }}>
                  CrossFire occasionally releases promo codes through official channels. Check regularly for free ZP and bonus items.
                </p>
              </div>
              {PROMO_CODES.map((p, i) => (
                <div key={p.code} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                  borderBottom: i < PROMO_CODES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <CopyButton code={p.code} />
                  <p style={{ flex: 1, fontSize: 12, color: "hsl(var(--muted-foreground))", margin: 0 }}>{p.desc}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "3px 8px", borderRadius: 3, background: "rgba(255,255,255,0.05)",
                    color: "hsl(var(--muted-foreground))",
                  }}>{p.platform}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
              Codes expire fast — follow{" "}
              <a href="https://discord.gg/7AbuDrNNJM" target="_blank" rel="noopener noreferrer" style={{ color: "#5865f2" }}>our Discord</a>{" "}
              and <a href="/news" style={{ color: GOLD }}>news page</a> for the latest drops.
            </p>
          </section>

          {/* Safety warning */}
          <section style={{
            padding: "24px 28px", background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={15} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f87171", margin: 0, letterSpacing: "0.05em" }}>
                Stay Safe When Buying ZP
              </h2>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Only buy from the official Z8Games store or verified community sellers with reviews.",
                "Never share your account password with anyone claiming to sell ZP.",
                "Z8Games staff and GMs will NEVER ask for your ZP or account access.",
                "If a deal sounds too good to be true, it probably is — stick to trusted sources.",
                "Check our verified sellers page for community-reviewed providers.",
              ].map((tip) => (
                <li key={tip} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
                  <Lock size={11} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>

      <style>{`
        @media(max-width:900px){.zp-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:600px){.zp-grid{grid-template-columns:1fr!important;}.methods-grid{grid-template-columns:1fr!important;}.uses-grid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
    </>
  );
}

function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7, background: GOLD_DIM,
        border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: GOLD }}>{icon}</span>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))", margin: 0, letterSpacing: "0.02em" }}>{label}</h2>
      {sub && <span style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>{sub}</span>}
    </div>
  );
}
