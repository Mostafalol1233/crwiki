import PageSEO from "@/components/PageSEO";
import { ExternalLink, ShoppingCart, Zap, Shield, Star, Gift, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const ZP_PACKAGES = [
  { zp: "400 ZP",    price: "$5",   bonus: "",           popular: false, color: "#60a5fa" },
  { zp: "800 ZP",    price: "$10",  bonus: "+100 ZP",    popular: false, color: "#60a5fa" },
  { zp: "2,000 ZP",  price: "$20",  bonus: "+300 ZP",    popular: false, color: "#34d399" },
  { zp: "5,500 ZP",  price: "$50",  bonus: "+700 ZP",    popular: true,  color: "#f5a623" },
  { zp: "11,500 ZP", price: "$100", bonus: "+1,500 ZP",  popular: false, color: "#a78bfa" },
  { zp: "20,000 ZP", price: "$200", bonus: "+3,000 ZP",  popular: false, color: "#f472b6" },
];

const TOP_UP_METHODS = [
  {
    name: "Official Z8Games Store",
    url: "https://www.z8games.com/",
    desc: "The official way — buy directly from Smilegate / Z8Games.",
    badge: "Official",
    badgeColor: "#4ade80",
    icon: "🏪",
  },
  {
    name: "Verified Sellers on CrossFire Wiki",
    url: "/sellers",
    desc: "Buy ZP from trusted community sellers reviewed by other players.",
    badge: "Community",
    badgeColor: "#f5a623",
    icon: "⚡",
    internal: true,
  },
  {
    name: "PaymentWall",
    url: "https://www.paymentwall.com/",
    desc: "Multiple payment methods: cards, wallets, and local options.",
    badge: "Multi-method",
    badgeColor: "#60a5fa",
    icon: "💳",
  },
  {
    name: "G2G Marketplace",
    url: "https://www.g2g.com/categories/crossfire-zp",
    desc: "Third-party marketplace for ZP and account services.",
    badge: "Marketplace",
    badgeColor: "#a78bfa",
    icon: "🛒",
  },
];

const ZP_USES = [
  { item: "Permanent Weapons",    cost: "From 6,900 ZP",  icon: "🔫", desc: "Unlock powerful weapons permanently — no rentals." },
  { item: "Character Skins",      cost: "From 2,900 ZP",  icon: "👤", desc: "Customize your appearance with exclusive skins." },
  { item: "VVIP Weapons",         cost: "From 29,000 ZP", icon: "⭐", desc: "The most powerful permanent weapons with special effects." },
  { item: "Crate Keys",           cost: "From 99 ZP/key", icon: "📦", desc: "Unlock mystery crates for rare weapons and skins." },
  { item: "GP Boosts",            cost: "From 500 ZP",    icon: "🚀", desc: "Earn GP faster to unlock free in-game rewards." },
  { item: "Special Ammo",         cost: "From 200 ZP",    icon: "💥", desc: "Explosive, incendiary and special ammo types." },
  { item: "Black Market Items",   cost: "Varies",          icon: "🎰", desc: "Spin for limited-time exclusive items." },
  { item: "Mercenary Rentals",    cost: "From 1,000 ZP",  icon: "🧬", desc: "Rent premium mercenaries for 7 or 30 days." },
];

const PROMO_CODES = [
  { code: "CFWIKI2026", desc: "Check official CrossFire social media for active promo codes", platform: "Z8Games" },
  { code: "DISCORD2026", desc: "Join the CrossFire Discord for exclusive code drops", platform: "Discord" },
  { code: "CFNEWS",    desc: "Subscribe to the newsletter for seasonal bonus codes", platform: "Newsletter" },
];

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy code"
      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all hover:brightness-110"
      style={{ background: copied ? "rgba(74,222,128,0.15)" : "rgba(245,166,35,0.12)", color: copied ? "#4ade80" : "#f5a623", border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(245,166,35,0.25)"}` }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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

      <div className="min-h-screen" style={{ background: "var(--background)" }} dir={isArabic ? "rtl" : "ltr"}>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden py-16 md:py-24 text-center" style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "3px" }}>
              <Zap className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>ZP & Pricing Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-4" style={{ color: "var(--foreground)" }}>
              CrossFire
              <br />
              <span style={{ color: "#f5a623" }}>ZP Packages</span>
            </h1>
            <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: "#666" }}>
              Everything you need to know about Zen Points — prices, what to buy, how to top up, and where to find the best deals.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16 space-y-16">

          {/* ── ZP Packages ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="h-5 w-5" style={{ color: "#f5a623" }} />
              <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>ZP Package Prices</h2>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ml-1" style={{ background: "rgba(245,166,35,0.1)", color: "#f5a623", borderRadius: "2px" }}>USD (approx.)</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ZP_PACKAGES.map((pkg) => (
                <div
                  key={pkg.zp}
                  className="relative p-5 flex flex-col gap-2"
                  style={{ background: "var(--card)", border: `1px solid ${pkg.popular ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: "4px" }}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-4 text-[9px] font-black uppercase tracking-wider px-2 py-0.5" style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}>Most Popular</span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black" style={{ color: pkg.color }}>{pkg.zp}</span>
                    <span className="text-2xl font-black" style={{ color: "var(--foreground)" }}>{pkg.price}</span>
                  </div>
                  {pkg.bonus && (
                    <div className="flex items-center gap-1.5">
                      <Gift className="h-3 w-3" style={{ color: "#4ade80" }} />
                      <span className="text-[11px] font-bold" style={{ color: "#4ade80" }}>+{pkg.bonus} bonus</span>
                    </div>
                  )}
                  <a
                    href="https://www.z8games.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ background: pkg.popular ? "#f5a623" : "rgba(255,255,255,0.05)", color: pkg.popular ? "#000" : "#888", borderRadius: "2px" }}
                  >
                    Buy on Z8Games <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px]" style={{ color: "#555" }}>
              * Prices are approximate and may vary by region. Always verify on the official Z8Games store.
            </p>
          </section>

          {/* ── Where to Top Up ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5" style={{ color: "#f5a623" }} />
              <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Where to Top Up</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {TOP_UP_METHODS.map((m) => (
                <div key={m.name} className="p-5 flex gap-4" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                  <div className="text-2xl flex-shrink-0">{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-sm uppercase tracking-tight" style={{ color: "var(--foreground)" }}>{m.name}</h3>
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 flex-shrink-0" style={{ background: `${m.badgeColor}18`, color: m.badgeColor, borderRadius: "2px" }}>{m.badge}</span>
                    </div>
                    <p className="text-[12px] mb-3" style={{ color: "#666" }}>{m.desc}</p>
                    {m.internal ? (
                      <Link href={m.url} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider hover:underline" style={{ color: "#f5a623" }}>
                        Visit Sellers <ChevronRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider hover:underline" style={{ color: "#f5a623" }}>
                        Visit Site <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── What ZP Buys You ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-5 w-5" style={{ color: "#f5a623" }} />
              <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>What Can ZP Buy?</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ZP_USES.map((item) => (
                <div key={item.item} className="p-4" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-black text-[12px] uppercase tracking-tight mb-1" style={{ color: "var(--foreground)" }}>{item.item}</h3>
                  <p className="text-[10px] font-black mb-2" style={{ color: "#f5a623" }}>{item.cost}</p>
                  <p className="text-[11px]" style={{ color: "#666" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Promo Codes ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Gift className="h-5 w-5" style={{ color: "#f5a623" }} />
              <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Promo Codes & Free ZP</h2>
            </div>
            <div className="p-5 mb-4" style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}>
              <p className="text-[12px] mb-4" style={{ color: "#888" }}>
                CrossFire occasionally releases promo codes through official channels. Check these sources regularly for free ZP and bonus items:
              </p>
              <div className="flex flex-col gap-3">
                {PROMO_CODES.map((p) => (
                  <div key={p.code} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3" style={{ background: "rgba(255,255,255,0.03)", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <CopyButton code={p.code} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px]" style={{ color: "#888" }}>{p.desc}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#555", borderRadius: "2px" }}>{p.platform}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "#555" }}>
              Promo codes expire quickly. Follow <a href="https://discord.gg/7AbuDrNNJM" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#5865f2" }}>our Discord</a> and <a href="/news" className="hover:underline" style={{ color: "#f5a623" }}>news page</a> for the latest drops.
            </p>
          </section>

          {/* ── Safety tips ── */}
          <section className="p-5 md:p-6" style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "4px" }}>
            <h2 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: "#f87171" }}>⚠️ Stay Safe When Buying ZP</h2>
            <ul className="space-y-2.5">
              {[
                "Only buy from the official Z8Games store or verified community sellers with reviews.",
                "Never share your account password with anyone claiming to sell ZP.",
                "Z8Games staff and GMs will NEVER ask for your ZP or account access.",
                "If a deal sounds too good to be true, it probably is — stick to trusted sources.",
                "Check our verified sellers page for community-reviewed providers.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-[12px]" style={{ color: "#888" }}>
                  <span style={{ color: "#f87171", flexShrink: 0 }}>•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </>
  );
}
