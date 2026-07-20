import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";
import { useLocation, Link } from "wouter";
import { LogIn, User, Lock } from "lucide-react";

export default function Login() {
  const { register, handleSubmit, setValue } = useForm();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

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
    } catch {}
  }, [setValue]);

  return (
    <>
      <PageSEO title="Sign In — CrossFire Wiki" description="Sign in to your CrossFire Wiki account." />
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "var(--background)" }}>
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />

        <div className="relative w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <LogIn className="h-6 w-6" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Sign In</h1>
            <p className="text-xs mt-1" style={{ color: "#555" }}>Welcome back to CrossFire Wiki</p>
          </div>

          {/* Card */}
          <div className="p-6" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>
                  Email / Username / Phone
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                  <Input
                    placeholder="Enter your identifier"
                    className="pl-9 h-10 text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    {...register("identifier")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    {...register("password")}
                  />
                </div>
              </div>

              {status && (
                <p className={`text-xs ${status.includes("success") ? "text-green-400" : "text-red-400"}`}>
                  {status}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "#555" }}>
            Don't have an account?{" "}
            <Link href="/register">
              <span className="font-bold cursor-pointer hover:opacity-80" style={{ color: "#f5a623" }}>Create one</span>
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
