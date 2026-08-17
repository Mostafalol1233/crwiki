import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";
import { useLocation, Link } from "wouter";
import { LogIn, User, Lock, Shield, Crosshair, Target, Zap } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function Login() {
  const { t } = useLanguage();
  const { register, handleSubmit, setValue } = useForm();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [redirectMsg, setRedirectMsg] = useState<string>("");
  const [, setLocation] = useLocation();
  const [dbCounts, setDbCounts] = useState({ weapons: "…", maps: "…", ranks: "…", modes: "…" });

  // Fetch real DB counts for the stats panel
  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      Promise.all([
        supabase.from("weapons").select("id", { count: "exact", head: true }),
        supabase.from("maps").select("id", { count: "exact", head: true }),
        supabase.from("ranks").select("id", { count: "exact", head: true }),
        supabase.from("modes").select("id", { count: "exact", head: true }),
      ]).then(([w, m, r, md]) => {
        setDbCounts({
          weapons: w.count != null ? w.count.toLocaleString() : "3,589",
          maps: m.count != null ? m.count.toLocaleString() : "312",
          ranks: r.count != null ? r.count.toLocaleString() : "104",
          modes: md.count != null ? md.count.toLocaleString() : "61",
        });
      }).catch(() => {
        setDbCounts({ weapons: "3,589", maps: "312", ranks: "104", modes: "61" });
      });
    });
  }, []);

  const BRAND_STATS = [
    { value: dbCounts.weapons, label: t("weapons") },
    { value: dbCounts.maps, label: t("maps") },
    { value: dbCounts.ranks, label: t("ranks") },
    { value: dbCounts.modes, label: t("modes") },
  ];

  const onSubmit = async (values: any) => {
    setLoading(true);
    setStatus("Signing in...");
    try {
      const { signIn } = await import("@/lib/supabaseApi");
      const data = await signIn(values.identifier, values.password);
      if (!data.user) throw new Error("Login failed");
      const uid = data.user.id || "";
      const uname = data.user.user_metadata?.username || values.identifier;
      localStorage.setItem("userId", uid);
      localStorage.setItem("username", uname);

      setLocation("/profile");
    } catch (e: any) {
      setStatus(e.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("prefillLogin");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.identifier) setValue("identifier", String(p.identifier));
        if (p?.password) setValue("password", String(p.password));
        sessionStorage.removeItem("prefillLogin");
        setStatus("Account created successfully. Please sign in.");
      }
      const msg = sessionStorage.getItem("authRedirectMsg");
      if (msg) {
        setRedirectMsg(msg);
        sessionStorage.removeItem("authRedirectMsg");
      }
    } catch {}
  }, [setValue]);

  return (
    <>
      <PageSEO title="Sign In — CrossFire Wiki" description="Sign in to your CrossFire Wiki account." noindex />
      <div className="min-h-screen flex" style={{ background: "var(--background)" }}>

        {/* ── Left decorative panel ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #0a0a0a 0%, #111008 50%, #0c0b00 100%)",
            borderRight: "1px solid rgba(245,166,35,0.12)",
          }}
        >
          {/* Diagonal gold accent */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute"
              style={{
                top: "-80px", right: "-80px",
                width: "300px", height: "300px",
                background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: "60px", left: "-40px",
                width: "220px", height: "220px",
                background: "radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%)",
              }}
            />
            {/* Grid lines */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(rgba(245,166,35,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Top-left corner accent */}
            <div className="absolute top-0 left-0 w-16 h-[2px]" style={{ background: "#f5a623" }} />
            <div className="absolute top-0 left-0 w-[2px] h-16" style={{ background: "#f5a623" }} />
            {/* Bottom-right corner accent */}
            <div className="absolute bottom-0 right-0 w-16 h-[2px]" style={{ background: "#f5a623" }} />
            <div className="absolute bottom-0 right-0 w-[2px] h-16" style={{ background: "#f5a623" }} />
          </div>

          {/* Logo + tagline */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ background: "#f5a623", borderRadius: "2px" }}
              >
                <Crosshair className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest" style={{ color: "#f5a623" }}>CrossFire Wiki</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-3" style={{ color: "#fff" }}>
              A Practical<br />
              <span style={{ color: "#f5a623" }}>{t("loginCFResource")}</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              {t("loginTagline")}
            </p>
          </div>

          {/* Feature icons */}
          <div className="relative space-y-4">
            {[
              { icon: Shield, label: t("loginRankCalc") },
              { icon: Target, label: t("loginArsenalDB") },
              { icon: Zap, label: t("loginLiveEvents") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "2px" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#f5a623" }} />
                </div>
                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 gap-3">
            {BRAND_STATS.map((s) => (
              <div
                key={s.label}
                className="p-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "3px" }}
              >
                <div className="text-xl font-black leading-none mb-0.5" style={{ color: "#f5a623" }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "#444" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-16 relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 50% 40% at 50% 20%, rgba(245,166,35,0.03) 0%, transparent 70%)" }}
          />

          <div className="relative w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="w-12 h-12 flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "3px" }}
              >
                <LogIn className="h-6 w-6" style={{ color: "#f5a623" }} />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>{t("loginTitle")}</h1>
              <p className="text-xs mt-1" style={{ color: "#555" }}>{t("loginWelcome")}</p>
            </div>

            {/* Redirect message */}
            {redirectMsg && (
              <div
                className="mb-4 p-3 text-xs font-bold flex items-center gap-2"
                style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "3px", color: "#f5a623" }}
              >
                <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                {redirectMsg}
              </div>
            )}

            {/* Card */}
            <div
              className="p-6"
              style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
            >
              {/* Gold top bar */}
              <div className="h-[2px] -mx-6 -mt-6 mb-6" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>
                    {t("loginEmailLabel")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                    <Input
                      placeholder={t("loginEmailPlaceholder")}
                      className="pl-9 h-10 text-sm"
                      autoComplete="username"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      {...register("identifier")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>
                    {t("loginPasswordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-10 text-sm"
                      autoComplete="current-password"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      {...register("password")}
                    />
                  </div>
                </div>

                {status && (
                  <p className={`text-xs ${status.includes("success") || status.includes("Signing") ? "text-green-400" : "text-red-400"}`}>
                    {status}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                >
                  {loading ? t("loginSigningIn") : t("loginSignIn")}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setStatus("");
                  try {
                    const { signInWithGoogle } = await import("@/lib/supabaseApi");
                    await signInWithGoogle();
                    // Supabase redirects to Google — nothing else needed here
                  } catch (e: any) {
                    setStatus(e.message || "Google sign-in failed.");
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full h-10 flex items-center justify-center gap-2.5 text-[11px] font-bold tracking-wide transition-all disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "2px",
                  color: "#ccc",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
              >
                {/* Google logo SVG */}
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M47.532 24.552c0-1.636-.148-3.2-.422-4.704H24.48v8.898h12.943c-.558 3.01-2.25 5.56-4.794 7.272v6.04h7.765c4.542-4.184 7.138-10.345 7.138-17.506z" fill="#4285F4"/>
                  <path d="M24.48 48c6.494 0 11.944-2.152 15.924-5.832l-7.765-6.04c-2.152 1.44-4.908 2.296-8.16 2.296-6.274 0-11.59-4.238-13.49-9.928H2.956v6.24C6.924 42.664 15.158 48 24.48 48z" fill="#34A853"/>
                  <path d="M10.99 28.496a14.48 14.48 0 0 1 0-9.248V13.01H2.956a23.98 23.98 0 0 0 0 21.726l8.034-6.24z" fill="#FBBC05"/>
                  <path d="M24.48 9.528c3.536 0 6.71 1.216 9.206 3.6l6.9-6.9C36.416 2.38 30.974 0 24.48 0 15.158 0 6.924 5.336 2.956 13.01l8.034 6.24c1.9-5.69 7.216-9.722 13.49-9.722z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="text-center mt-4">
                <Link href="/reset-password">
                  <span className="text-[11px] cursor-pointer hover:opacity-80 transition-opacity" style={{ color: "#555" }}>
                    Forgot password?
                  </span>
                </Link>
              </div>
            </div>

            <p className="text-center text-xs mt-5" style={{ color: "#555" }}>
              {t("loginNoAccount")}{" "}
              <Link href="/register">
                <span className="font-bold cursor-pointer hover:opacity-80" style={{ color: "#f5a623" }}>{t("loginCreateOne")}</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
