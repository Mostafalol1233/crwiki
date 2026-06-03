import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageSEO from "@/components/PageSEO";
import { User, Camera, Loader2, Mail, Phone, Lock, UserPlus } from "lucide-react";

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
      const { signUp } = await import("@/lib/supabaseApi");
      await signUp(values.email, values.password, {
        username: values.username,
        phone: values.phone || "",
        avatar: avatarUrl,
      });
      try {
        sessionStorage.setItem("prefillLogin", JSON.stringify({ identifier: values.email, password: values.password }));
      } catch {}
      toast({ title: "Account created", description: "Check your email to confirm, then sign in." });
      setLocation("/login");
    } catch (e: any) {
      const msg = String(e.message || "");
      if (msg.toLowerCase().includes("email")) {
        setStatus("This email address couldn't be registered. Try a different email (e.g. Gmail, Outlook).");
      } else if (msg.toLowerCase().includes("already")) {
        setStatus("An account with this email already exists. Try signing in instead.");
      } else if (msg.toLowerCase().includes("password")) {
        setStatus("Password doesn't meet requirements. Please choose a stronger password.");
      } else {
        setStatus(msg || "Something went wrong. Please try again.");
      }
    }
  };

  const fields = [
    { id: "email", label: "Email", type: "email", placeholder: "you@example.com", icon: Mail, key: "email" },
    { id: "phone", label: "Phone (Optional)", type: "tel", placeholder: "+1234567890", icon: Phone, key: "phone" },
    { id: "username", label: "Username", type: "text", placeholder: "yourname", icon: User, key: "username" },
    { id: "password", label: "Password", type: "password", placeholder: "••••••••", icon: Lock, key: "password" },
  ];

  return (
    <>
      <PageSEO title="Create Account — CrossFire Wiki" description="Register to join CrossFire Wiki." />
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "var(--background)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />

        <div className="relative w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "3px" }}>
              <UserPlus className="h-6 w-6" style={{ color: "#f5a623" }} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Create Account</h1>
            <p className="text-xs mt-1" style={{ color: "#555" }}>Join the CrossFire Wiki community</p>
          </div>

          {/* Card */}
          <div className="p-6" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="relative group">
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
                    className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: "#f5a623", borderRadius: "50%" }}
                    disabled={isUploading}
                  >
                    <Camera className="w-3 h-3 text-black" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                </div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#555" }}>Profile Picture (Optional)</p>
              </div>

              {/* Fields */}
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

              {status && <p className="text-xs" style={{ color: status.includes("success") || status.includes("Creating") ? "#888" : "#f87171" }}>{status}</p>}

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
    </>
  );
}
