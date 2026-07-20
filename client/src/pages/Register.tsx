import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageSEO from "@/components/PageSEO";
import { User, Camera, Loader2, Mail, Phone, Lock, UserPlus, Crosshair, Shield, Star } from "lucide-react";

const schema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Enter a valid email address (e.g. you@gmail.com)"),
  phone: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/[\s\-().]/g, "") : ""))
    .refine((v) => !v || /^\+?\d{7,15}$/.test(v), "Enter a valid phone number (digits only)"),
  password: z.string().min(8, "Password must be at least 8 characters").refine((v) => /[^A-Za-z0-9]/.test(v), {
    message: "Add at least one special character (e.g. ! @ # $)",
  }),
  avatar: z.string().optional(),
});

const BENEFITS = [
  { icon: Shield, text: "Track your rank progression" },
  { icon: Star, text: "Save and review weapons" },
  { icon: Crosshair, text: "Join community discussions" },
];

export default function Register() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [status, setStatus] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const fileName = `avatar_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const url = urlData?.publicUrl || "";
      if (url) {
        setAvatarUrl(url);
        setValue("avatar", url);
        toast({ title: "Avatar uploaded" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: any) => {
    setStatus("Creating account...");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          username: values.username,
          phone: values.phone || "",
          avatar: avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setStatus("Signing in...");
      const { signIn } = await import("@/lib/supabaseApi");
      await signIn(values.email, values.password);

      toast({ title: "Welcome!", description: "Your account is ready." });
      setLocation("/");
    } catch (e: any) {
      const msg = String(e.message || "");
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered") || msg.toLowerCase().includes("already exists")) {
        setStatus("An account with this email already exists. Try signing in instead.");
      } else if (msg.toLowerCase().includes("password")) {
        setStatus("Password doesn't meet requirements. Please choose a stronger password.");
      } else {
        setStatus(msg || "Something went wrong. Please try again.");
      }
    }
  };

  const fields = [
    { id: "email", label: "Email", type: "email", placeholder: "you@example.com", icon: Mail, key: "email", autoComplete: "email" },
    { id: "phone", label: "Phone (Optional)", type: "tel", placeholder: "+1234567890", icon: Phone, key: "phone", autoComplete: "tel" },
    { id: "username", label: "Username", type: "text", placeholder: "yourname", icon: User, key: "username", autoComplete: "username" },
    { id: "password", label: "Password", type: "password", placeholder: "••••••••", icon: Lock, key: "password", autoComplete: "new-password" },
  ];

  return (
    <>
      <PageSEO title="Create Account — CrossFire Wiki" description="Register to join CrossFire Wiki." />
      <div className="min-h-screen flex" style={{ background: "var(--background)" }}>

        {/* ── Left decorative panel ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #0a0a0a 0%, #111008 50%, #0c0b00 100%)",
            borderRight: "1px solid rgba(245,166,35,0.12)",
          }}
        >
          {/* Background details */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute"
              style={{
                top: "-60px", right: "-60px",
                width: "280px", height: "280px",
                background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: "80px", left: "-30px",
                width: "200px", height: "200px",
                background: "radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(rgba(245,166,35,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="absolute top-0 left-0 w-16 h-[2px]" style={{ background: "#f5a623" }} />
            <div className="absolute top-0 left-0 w-[2px] h-16" style={{ background: "#f5a623" }} />
            <div className="absolute bottom-0 right-0 w-16 h-[2px]" style={{ background: "#f5a623" }} />
            <div className="absolute bottom-0 right-0 w-[2px] h-16" style={{ background: "#f5a623" }} />
          </div>

          {/* Logo */}
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
              Join the<br />
              <span style={{ color: "#f5a623" }}>Community</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Create an account to unlock all features and become part of the CrossFire Wiki community.
            </p>
          </div>

          {/* Benefits */}
          <div className="relative space-y-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-5" style={{ color: "#f5a623" }}>Member Benefits</p>
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "2px" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#f5a623" }} />
                </div>
                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Bottom quote */}
          <div className="relative">
            <div className="h-[1px] mb-4" style={{ background: "rgba(255,255,255,0.05)" }} />
            <p className="text-[11px] italic" style={{ color: "#444" }}>
              "The most complete CrossFire database on the web."
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 50% 40% at 50% 20%, rgba(245,166,35,0.03) 0%, transparent 70%)" }}
          />

          <div className="relative w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative mx-auto mb-4 w-fit">
                <div
                  className="w-20 h-20 flex items-center justify-center overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)", border: "2px solid rgba(245,166,35,0.2)", borderRadius: "50%" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10" style={{ color: "#444" }} />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", borderRadius: "50%" }}>
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: "#f5a623", borderRadius: "50%" }}
                  disabled={isUploading}
                  title="Upload profile picture"
                >
                  <Camera className="w-3.5 h-3.5 text-black" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Create Account</h1>
              <p className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: "#555" }}>Profile picture optional</p>
            </div>

            {/* Card */}
            <div
              className="p-6"
              style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
            >
              {/* Gold top bar */}
              <div className="h-[2px] -mx-6 -mt-6 mb-6" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {fields.map((f) => {
                  const Icon = f.icon;
                  const err = errors[f.key as keyof typeof errors];
                  return (
                    <div key={f.id}>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>{f.label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
                        <Input
                          type={f.type}
                          placeholder={f.placeholder}
                          className="pl-9 h-10 text-sm"
                          autoComplete={f.autoComplete}
                          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${err ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.08)"}` }}
                          {...register(f.key as any)}
                        />
                      </div>
                      {err && <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{String(err.message)}</p>}
                      {f.key === "password" && !err && (
                        <p className="text-[10px] mt-1" style={{ color: "#555" }}>Min 8 characters, at least one special character.</p>
                      )}
                    </div>
                  );
                })}

                {status && (
                  <p className="text-xs" style={{ color: status.includes("success") || status.includes("Creating") || status.includes("Signing") ? "#888" : "#f87171" }}>
                    {status}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-10 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 mt-2"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                >
                  Create Account
                </button>
              </form>
            </div>

            <p className="text-center text-xs mt-5" style={{ color: "#555" }}>
              Already have an account?{" "}
              <Link href="/login">
                <span className="font-bold cursor-pointer hover:opacity-80" style={{ color: "#f5a623" }}>Sign in</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
