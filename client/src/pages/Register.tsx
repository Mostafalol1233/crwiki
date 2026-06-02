import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageSEO from "@/components/PageSEO";
import Orb from "@/components/Orb";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Camera, Loader2 } from "lucide-react";

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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      // Avatar upload via Supabase Storage
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
    setStatus("Registering...");
    try {
      const phoneSanitized = String(values.phone || "").replace(/^\+/, "");
      if (!/^\d{8,15}$/.test(phoneSanitized)) {
        setStatus("Invalid phone number");
        return;
      }
      const { signUp } = await import("@/lib/supabaseApi");
      await signUp(values.email, values.password, {
        username: values.username,
        phone: phoneSanitized,
        avatar: avatarUrl,
      });
      try {
        sessionStorage.setItem(
          "prefillLogin",
          JSON.stringify({ identifier: values.email, password: values.password })
        );
      } catch {}
      toast({ title: "Account created", description: "Check your email to confirm, then sign in." });
      setLocation("/login");
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 flex justify-center overflow-y-auto">
      <PageSEO title="Register" description="Create an account to chat" />
      <Orb hoverIntensity={0.5} rotateOnHover={true} hue={320}>
      <Card className="w-full max-w-md mx-auto auth-box">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4 pb-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-primary/20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-primary/5">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">Profile Picture (Optional)</p>
            </div>
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
            <div className="pt-2">
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
