import { Input } from "@/components/ui/input";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";
import { Mail, Lock, RotateCcw, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({ type: "idle", msg: "" });

  // Detect if we arrived via a Supabase password-reset link (has access_token in hash)
  const isResetMode = typeof window !== "undefined" &&
    (window.location.hash.includes("access_token") || window.location.hash.includes("type=recovery"));

  const requestReset = async () => {
    if (!email.trim()) {
      setStatus({ type: "error", msg: "Please enter your email address." });
      return;
    }
    setStatus({ type: "loading", msg: "Sending reset link…" });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setStatus({ type: "error", msg: error.message || "Failed to send reset email." });
    } else {
      setStatus({ type: "success", msg: "Check your email — we sent you a password reset link." });
    }
  };

  const submitNewPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setStatus({ type: "error", msg: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }
    setStatus({ type: "loading", msg: "Updating password…" });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus({ type: "error", msg: error.message || "Could not update password." });
    } else {
      setStatus({ type: "success", msg: "Password updated successfully! You can now sign in." });
    }
  };

  const isLoading = status.type === "loading";

  return (
    <>
      <PageSEO title="Reset Password — CrossFire Wiki" description="Reset your account password" noindex />
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "var(--background)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <RotateCcw className="h-6 w-6" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              {isResetMode ? "Set New Password" : "Password Recovery"}
            </h1>
            <p className="text-xs mt-1" style={{ color: "#555" }}>
              {isResetMode ? "Enter your new password below" : "We'll send a reset link to your email"}
            </p>
          </div>

          <div className="p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>

            {!isResetMode ? (
              /* ── Request reset link ── */
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && requestReset()}
                      placeholder="you@example.com"
                      className="pl-9 h-10 text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                {status.msg && (
                  <p className="text-xs py-2 px-3 flex items-center gap-2" style={{
                    background: status.type === "success" ? "rgba(74,222,128,0.08)" : status.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                    color: status.type === "success" ? "#4ade80" : status.type === "error" ? "#f87171" : "#888",
                    borderRadius: "2px",
                  }}>
                    {status.type === "success" && <CheckCircle className="h-3 w-3 flex-shrink-0" />}
                    {status.msg}
                  </p>
                )}

                <button
                  onClick={requestReset}
                  disabled={isLoading || status.type === "success"}
                  className="w-full h-10 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                >
                  {isLoading ? "Sending…" : "Send Reset Link"}
                </button>
              </>
            ) : (
              /* ── Set new password ── */
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="pl-9 h-10 text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitNewPassword()}
                      placeholder="Repeat password"
                      className="pl-9 h-10 text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                {status.msg && (
                  <p className="text-xs py-2 px-3 flex items-center gap-2" style={{
                    background: status.type === "success" ? "rgba(74,222,128,0.08)" : status.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                    color: status.type === "success" ? "#4ade80" : status.type === "error" ? "#f87171" : "#888",
                    borderRadius: "2px",
                  }}>
                    {status.type === "success" && <CheckCircle className="h-3 w-3 flex-shrink-0" />}
                    {status.msg}
                  </p>
                )}

                <button
                  onClick={submitNewPassword}
                  disabled={isLoading || status.type === "success"}
                  className="w-full h-10 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                >
                  {isLoading ? "Updating…" : "Set New Password"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
