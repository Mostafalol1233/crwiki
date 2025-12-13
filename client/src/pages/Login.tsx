import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";
import Orb from "@/components/Orb";
import { useLocation } from "wouter";

export default function Login() {
  const { register, handleSubmit, setValue } = useForm();
  const [status, setStatus] = useState<string>("");
  const [, setLocation] = useLocation();

  const onSubmit = async (values: any) => {
    setStatus("Signing in...");
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userId", data.user?.id || "");
      localStorage.setItem("username", data.user?.username || "");
      setLocation("/chat");
    } catch (e: any) {
      setStatus(e.message);
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
    <div className="container mx-auto px-4 py-8">
      <PageSEO title="Login" description="Sign in to chat" />
      <Orb hoverIntensity={0.5} rotateOnHover={true} hue={200}>
      <Card className="w-full max-w-md mx-auto auth-box">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium">Email / Username / Phone</label>
              <Input placeholder="identifier" {...register("identifier")} />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" {...register("password")} />
            </div>
            <Button type="submit" className="w-full h-12 text-base">Login</Button>
            {status && <p className="text-sm mt-2">{status}</p>}
          </form>
        </CardContent>
      </Card>
      </Orb>
    </div>
  );
}
