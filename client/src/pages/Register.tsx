import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageSEO from "@/components/PageSEO";
import Orb from "@/components/Orb";

const schema = z.object({
  username: z.string().min(2, "Username is required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .min(8, "Invalid phone")
    .max(15, "Invalid phone")
    .refine((v) => /^\+?\d{8,15}$/.test(v), "Invalid phone number"),
  password: z.string().min(8, "Min 8 characters").refine((v) => /[^A-Za-z0-9]/.test(v), {
    message: "Include at least one special character",
  }),
});

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [status, setStatus] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onSubmit = async (values: any) => {
    setStatus("Registering...");
    try {
      const phoneSanitized = String(values.phone || "").replace(/^\+/, "");
      if (!/^\d{8,15}$/.test(phoneSanitized)) {
        setStatus("Invalid phone number");
        return;
      }
      const payload = { ...values, phone: phoneSanitized };
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");
      try {
        sessionStorage.setItem(
          "prefillLogin",
          JSON.stringify({ identifier: values.email, password: values.password })
        );
      } catch {}
      toast({ title: "Account created", description: "You can now sign in." });
      setLocation("/login");
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <PageSEO title="Register" description="Create an account to chat" />
      <Orb hoverIntensity={0.5} rotateOnHover={true} hue={320}>
      <Card className="w-full max-w-md mx-auto auth-box">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[75vh] overflow-y-auto">
          <form className="space-y-4 pb-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{String(errors.email.message)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9+]*"
                placeholder="123456789"
                {...register("phone")}
              />
              {errors.phone && <p className="text-red-500 text-sm">{String(errors.phone.message)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input placeholder="yourname" {...register("username")} />
              {errors.username && <p className="text-red-500 text-sm">{String(errors.username.message)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-red-500 text-sm">{String(errors.password.message)}</p>}
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters and at least one special character.</p>
            </div>
            <div className="sticky bottom-0 bg-background pt-2">
              <Button type="submit" className="w-full h-12 text-base">Register</Button>
              <p className="text-sm mt-2 min-h-5">{status}</p>
            </div>
          </form>
        </CardContent>
      </Card>
      </Orb>
    </div>
  );
}
