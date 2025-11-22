import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";
import { useLocation } from "wouter";

export default function Login() {
  const { register, handleSubmit } = useForm();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <PageSEO title="Login" description="Sign in to chat" />
      <Card className="max-w-md mx-auto">
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
            <Button type="submit" className="w-full">Login</Button>
            {status && <p className="text-sm mt-2">{status}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}