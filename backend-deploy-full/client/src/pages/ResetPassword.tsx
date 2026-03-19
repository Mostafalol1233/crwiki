import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";

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
    <div className="container mx-auto px-4 py-8">
      <PageSEO title="Reset Password" description="Reset your account password" />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Password Recovery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="flex gap-2">
              <Button onClick={requestCode}>Request Reset Code</Button>
              {code && <Button type="button" onClick={() => navigator.clipboard.writeText(code)}>Copy Code</Button>}
            </div>
            <div>
              <label className="text-sm font-medium">Reset Code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters and at least one special character.</p>
            </div>
            <Button onClick={submitReset} className="w-full">Change Password</Button>
            {status && <p className="text-sm mt-2">{status}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}