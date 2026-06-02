import { Input } from "@/components/ui/input";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";
import { Mail, Key, Lock, RotateCcw } from "lucide-react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  const requestCode = async () => {
    setStatus("Requesting reset code...");
    const res = await fetch("/api/users/request-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (!res.ok) { setStatus(data?.error || "Failed"); return; }
    setCode(data.resetCode);
    setStatus("Reset code generated. Check your email or use the code shown.");
  };

  const submitReset = async () => {
    setStatus("Resetting password...");
    const res = await fetch("/api/users/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, newPassword }) });
    const data = await res.json();
    if (!res.ok) { setStatus(data?.error || "Failed"); return; }
    setStatus("Password changed successfully.");
  };

  return (
    <>
      <PageSEO title="Reset Password — CrossFire Wiki" description="Reset your account password" />
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "var(--background)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <RotateCcw className="h-6 w-6" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Password Recovery</h1>
            <p className="text-xs mt-1" style={{ color: "#555" }}>Reset your CrossFire Wiki password</p>
          </div>

          <div className="p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 h-10 text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={requestCode}
                className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110"
                style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
              >
                Request Code
              </button>
              {code && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="h-9 px-3 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground)", borderRadius: "2px" }}
                >
                  Copy
                </button>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Reset Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  className="pl-9 h-10 text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-10 text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: "#555" }}>Min 8 characters, at least one special character.</p>
            </div>

            {status && (
              <p className="text-xs py-2 px-3" style={{
                background: status.includes("success") ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                color: status.includes("success") ? "#4ade80" : "#888",
                borderRadius: "2px",
              }}>{status}</p>
            )}

            <button
              onClick={submitReset}
              className="w-full h-10 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
              style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
