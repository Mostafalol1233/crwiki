import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";

const schema = z.object({
  username: z.string().min(2, "Username is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(6, "Invalid phone"),
  password: z.string().min(8, "Min 8 characters").refine((v) => /[^A-Za-z0-9]/.test(v), {
    message: "Include at least one special character",
  }),
});

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [status, setStatus] = useState<string>("");
  const [codes, setCodes] = useState<{ emailCode?: string; phoneCode?: string } | null>(null);

  const onSubmit = async (values: any) => {
    setStatus("Registering...");
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");
      setCodes({ emailCode: data.emailCode, phoneCode: data.phoneCode });
      setStatus("Registered. Please verify email and phone.");
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageSEO title="Register" description="Create an account to chat" />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{String(errors.email.message)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input type="tel" placeholder="+123456789" {...register("phone")} />
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
            <Button type="submit" className="w-full">Register</Button>
            {status && <p className="text-sm mt-2">{status}</p>}
            {codes && (
              <div className="mt-3 text-sm">
                <p>Email verification code: <span className="font-mono">{codes.emailCode}</span></p>
                <p>Phone verification code: <span className="font-mono">{codes.phoneCode}</span></p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}